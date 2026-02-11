
import React, { useState } from 'react';
import { Task, TaskPriority } from '../types';

interface TaskQueueProps {
  tasks: Task[];
  onAddTask: (taskData: {
    title: string;
    deadline: Date;
    durationMinutes: number;
    priority: TaskPriority;
  }) => void;
  onUpdateTask?: (id: string, taskData: {
    title: string;
    deadline: Date;
    durationMinutes: number;
    priority: TaskPriority;
  }) => void;
  onDeleteTask: (id: string) => void;
  onScheduleTask?: (id: string) => void;
  fullWidth?: boolean;
}

const TaskQueue: React.FC<TaskQueueProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask, onScheduleTask, fullWidth }) => {
  const [showForm, setShowForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Media');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Todas' | 'Pendientes' | 'Conflictos'>('Todas');
  
  // Selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  
  // Modal states
  const [scheduleModalTask, setScheduleModalTask] = useState<Task | null>(null);
  const [deleteModalTask, setDeleteModalTask] = useState<Task | null>(null);
  const [editModalTask, setEditModalTask] = useState<Task | null>(null);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editPriority, setEditPriority] = useState<TaskPriority>('Media');
  const [editDeadline, setEditDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && newTaskDeadline) {
      onAddTask({
        title: newTaskTitle,
        deadline: new Date(newTaskDeadline),
        durationMinutes: newTaskDuration,
        priority: newTaskPriority
      });
      setNewTaskTitle('');
      setNewTaskDuration(60);
      setNewTaskPriority('Media');
      setNewTaskDeadline('');
      setShowForm(false);
    }
  };

  // Toggle task selection
  const handleToggleSelect = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Open schedule modal on task click
  const handleTaskClick = (task: Task) => {
    if (task.status === 'pending' || task.status === 'conflict') {
      setScheduleModalTask(task);
    }
  };

  // Confirm schedule
  const handleConfirmSchedule = () => {
    if (scheduleModalTask && onScheduleTask) {
      onScheduleTask(scheduleModalTask.id);
    }
    setScheduleModalTask(null);
  };

  // Schedule all selected tasks
  const handleScheduleSelected = () => {
    if (onScheduleTask) {
      selectedTaskIds.forEach(id => onScheduleTask(id));
    }
    setSelectedTaskIds(new Set());
  };

  // Open edit modal
  const openEditModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(task.title);
    setEditDuration(task.durationMinutes);
    setEditPriority(task.priority);
    setEditDeadline(formatDateForInput(task.deadline));
    setEditModalTask(task);
  };

  // Submit edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModalTask && onUpdateTask && editTitle.trim() && editDeadline) {
      onUpdateTask(editModalTask.id, {
        title: editTitle,
        deadline: new Date(editDeadline),
        durationMinutes: editDuration,
        priority: editPriority
      });
      setEditModalTask(null);
    }
  };

  // Open delete modal
  const openDeleteModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalTask(task);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteModalTask) {
      onDeleteTask(deleteModalTask.id);
    }
    setDeleteModalTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'Pendientes') return task.status === 'pending';
    if (activeFilter === 'Conflictos') return task.status === 'conflict' || task.status === 'expired';
    return task.status !== 'completed';
  });

  const conflictCount = tasks.filter(t => t.status === 'conflict' || t.status === 'expired').length;
  const selectedCount = selectedTaskIds.size;
  const pendingSelected = [...selectedTaskIds].filter(id => {
    const task = tasks.find(t => t.id === id);
    return task && (task.status === 'pending' || task.status === 'conflict');
  }).length;

  const formatDeadline = (date: Date): string => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.getDate() === tomorrow.getDate() && 
                       date.getMonth() === tomorrow.getMonth() && 
                       date.getFullYear() === tomorrow.getFullYear();
    
    if (date < now) return 'Vencido';
    
    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    if (isTomorrow) {
      return `Mañana, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getStatusColor = (task: Task, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-50 border-blue-300 ring-2 ring-blue-200';
    if (task.status === 'expired') return 'bg-gray-100 border-gray-300';
    if (task.status === 'conflict') return 'bg-red-50 border-red-100';
    if (task.status === 'scheduled') return 'bg-green-50 border-green-100';
    return 'bg-white border-gray-200';
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Alta': return 'bg-orange-100 text-orange-700';
      case 'Media': return 'bg-blue-100 text-blue-700';
      case 'Baja': return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      <div className={`${fullWidth ? 'w-full' : 'w-96'} border-r border-gray-200 bg-gray-50 flex flex-col h-full overflow-hidden`}>
        <div className="p-4 flex flex-col gap-4 shrink-0">
          {/* Quick add or Form toggle */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl py-3 px-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">add</span>
              <span className="font-medium">Añadir nueva tarea</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nombre de la tarea..."
                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Duración (min)</label>
                  <input
                    type="number"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(parseInt(e.target.value) || 30)}
                    min={15}
                    step={15}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Prioridad</label>
                <div className="flex gap-2">
                  {(['Baja', 'Media', 'Alta'] as TaskPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        newTaskPriority === p
                          ? getPriorityColor(p)
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          )}

          {/* Selection Action Bar */}
          {selectedCount > 0 && (
            <div className="bg-blue-600 rounded-xl p-3 flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {selectedCount} tarea{selectedCount > 1 ? 's' : ''} seleccionada{selectedCount > 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTaskIds(new Set())}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-100 hover:bg-blue-500 transition-colors"
                >
                  Deseleccionar
                </button>
                {pendingSelected > 0 && (
                  <button
                    onClick={handleScheduleSelected}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                    Añadir al horario
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['Todas', 'Pendientes', 'Conflictos'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeFilter === filter
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter}
                {filter === 'Conflictos' && conflictCount > 0 && (
                  <span className={`px-1.5 rounded-full text-[10px] ${activeFilter === 'Conflictos' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                    {conflictCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">COLA DE PRIORIDADES</h3>
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
              <p className="text-sm">No hay tareas pendientes</p>
            </div>
          )}
          
          {filteredTasks.map(task => {
            const isSelected = selectedTaskIds.has(task.id);
            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`p-3 rounded-xl border transition-all group cursor-pointer ${getStatusColor(task, isSelected)} hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  {/* Selection Checkbox */}
                  <button
                    onClick={(e) => handleToggleSelect(task.id, e)}
                    className={`w-5 h-5 rounded border-2 mt-0.5 transition-all flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : task.status === 'conflict' || task.status === 'expired'
                        ? 'border-red-300 hover:border-red-400'
                        : task.status === 'scheduled'
                        ? 'border-green-400 hover:border-green-500'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>
                    )}
                    {task.status === 'scheduled' && !isSelected && (
                      <span className="material-symbols-outlined text-[14px] text-green-600 font-bold">check</span>
                    )}
                  </button>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-sm font-semibold truncate ${
                        task.status === 'expired' ? 'text-gray-400 line-through' :
                        task.status === 'conflict' ? 'text-red-900' :
                        task.status === 'scheduled' ? 'text-green-800' :
                        'text-gray-800'
                      }`}>
                        {task.title}
                      </h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Edit Button */}
                        <button
                          onClick={(e) => openEditModal(task, e)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar tarea"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={(e) => openDeleteModal(task, e)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar tarea"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                    
                    <p className={`text-xs mt-0.5 ${
                      task.status === 'expired' ? 'text-gray-400' :
                      task.status === 'conflict' ? 'text-red-600 font-medium' :
                      task.status === 'scheduled' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {task.conflictMessage || (task.status === 'scheduled' ? '✓ Programada' : `Vence ${formatDeadline(task.deadline)}`)}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span className="text-[10px] font-medium">{formatDuration(task.durationMinutes)}</span>
                      </div>
                      {task.status === 'scheduled' && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">event_available</span>
                          Asignada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Confirmation Modal */}
      {scheduleModalTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setScheduleModalTask(null)}>
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-2xl">calendar_add_on</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">¿Añadir al horario?</h3>
                <p className="text-sm text-gray-500">La tarea se asignará a un bloque disponible</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{scheduleModalTask.title}</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-1 rounded font-semibold ${getPriorityColor(scheduleModalTask.priority)}`}>
                  {scheduleModalTask.priority}
                </span>
                <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 font-medium">
                  {formatDuration(scheduleModalTask.durationMinutes)}
                </span>
                <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 font-medium">
                  Vence {formatDeadline(scheduleModalTask.deadline)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setScheduleModalTask(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Añadir al horario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteModalTask(null)}>
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">¿Eliminar tarea?</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-100">
              <h4 className="font-semibold text-red-900">{deleteModalTask.title}</h4>
              <p className="text-sm text-red-700 mt-1">
                {formatDuration(deleteModalTask.durationMinutes)} • Vence {formatDeadline(deleteModalTask.deadline)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalTask(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editModalTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditModalTask(null)}>
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-2xl">edit</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Editar tarea</h3>
                <p className="text-sm text-gray-500">Modifica los detalles de la tarea</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duración (min)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value) || 30)}
                    min={15}
                    step={15}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                <div className="flex gap-2">
                  {(['Baja', 'Media', 'Alta'] as TaskPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        editPriority === p
                          ? getPriorityColor(p)
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalTask(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskQueue;
