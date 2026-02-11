
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskQueue from './components/TaskQueue';
import CalendarView from './components/CalendarView';
import BlocksManager from './components/BlocksManager';
import { Task, ViewType, TimeBlock, TaskPriority } from './types';
import { generatePlan, applySchedulingResults } from './scheduler';

// Helper to create a date with time
const createDateWithTime = (daysFromNow: number, hours: number, minutes: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Calc III Problem Set 4',
    deadline: createDateWithTime(0, 23, 59),
    durationMinutes: 120,
    priority: 'Alta',
    status: 'pending'
  },
  {
    id: '2',
    title: 'History Essay Draft',
    deadline: createDateWithTime(1, 17, 0),
    durationMinutes: 180,
    priority: 'Media',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Read Chapter 4-5',
    deadline: createDateWithTime(1, 20, 0),
    durationMinutes: 45,
    priority: 'Baja',
    status: 'pending'
  },
  {
    id: '4',
    title: 'Lab Report Formatting',
    deadline: createDateWithTime(4, 18, 0),
    durationMinutes: 30,
    priority: 'Baja',
    status: 'pending'
  }
];

// Get current day of week
const today = new Date().getDay();

const INITIAL_BLOCKS: TimeBlock[] = [
  // Fixed class
  {
    id: 'class1',
    dayOfWeek: today,
    startTime: '09:00',
    endTime: '10:20',
    isFixed: true,
    title: 'Chemistry 101 Lecture'
  },
  // Available study blocks
  {
    id: 'block1',
    dayOfWeek: today,
    startTime: '11:00',
    endTime: '13:00',
    isFixed: false
  },
  {
    id: 'block2',
    dayOfWeek: today,
    startTime: '14:00',
    endTime: '16:00',
    isFixed: false
  },
  {
    id: 'block3',
    dayOfWeek: today,
    startTime: '19:00',
    endTime: '21:00',
    isFixed: false
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [blocks, setBlocks] = useState<TimeBlock[]>(INITIAL_BLOCKS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [planGenerated, setPlanGenerated] = useState(false);
  const [editTaskFromCalendar, setEditTaskFromCalendar] = useState<Task | null>(null);

  // Generate plan whenever tasks or blocks change (but only if plan was generated)
  const planResult = useMemo(() => {
    if (!planGenerated) return null;
    return generatePlan(tasks, blocks, selectedDate);
  }, [tasks, blocks, selectedDate, planGenerated]);

  // Apply scheduling results to tasks
  const displayTasks = useMemo(() => {
    if (planResult) {
      return applySchedulingResults(tasks, planResult);
    }
    return tasks;
  }, [tasks, planResult]);

  const handleAddTask = (taskData: {
    title: string;
    deadline: Date;
    durationMinutes: number;
    priority: TaskPriority;
  }) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      ...taskData,
      status: 'pending'
    };
    setTasks([newTask, ...tasks]);
    setPlanGenerated(false); // Invalidate plan
  };

  const handleUpdateTask = (id: string, taskData: {
    title: string;
    deadline: Date;
    durationMinutes: number;
    priority: TaskPriority;
  }) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...taskData } : t
    ));
    setPlanGenerated(false);
    setEditTaskFromCalendar(null);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setPlanGenerated(false);
  };

  const handleScheduleTask = (id: string) => {
    // Trigger plan generation which will automatically schedule the task
    setPlanGenerated(true);
  };

  const handleReassignTask = (taskId: string) => {
    // Reset the task to pending and regenerate plan
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'pending' as const, assignedBlockId: undefined } : t
    ));
    // Re-generate plan
    setPlanGenerated(true);
  };

  const handleEditTaskFromCalendar = (task: Task) => {
    setEditTaskFromCalendar(task);
  };

  const handleAddBlock = (block: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = {
      id: Math.random().toString(36).substr(2, 9),
      ...block
    };
    setBlocks([...blocks, newBlock]);
    setPlanGenerated(false);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    setPlanGenerated(false);
  };

  const handleGeneratePlan = () => {
    setPlanGenerated(true);
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // Re-generate plan for new date if plan was already generated
    if (planGenerated) {
      setPlanGenerated(true);
    }
  };

  const conflicts = displayTasks.filter(t => t.status === 'conflict' || t.status === 'expired').length;

  // Format today's date
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    const formatted = date.toLocaleDateString('es-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const renderContent = () => {
    switch (currentView) {

      case 'Bloques':
        return (
          <div className="flex-1 p-6 overflow-auto">
            <BlocksManager
              blocks={blocks}
              onAddBlock={handleAddBlock}
              onDeleteBlock={handleDeleteBlock}
            />
          </div>
        );
      case 'Plan':
        return (
          <div className="flex-1 overflow-hidden">
            <CalendarView 
              blocks={blocks}
              scheduledTasks={planResult?.scheduledTasks || []}
              conflicts={planResult?.conflicts || []}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onEditTask={handleEditTaskFromCalendar}
              onReassignTask={handleReassignTask}
            />
          </div>
        );
      default: // Dashboard
        return (
          <div className="flex-1 flex overflow-hidden">
            <TaskQueue
              tasks={displayTasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onScheduleTask={handleScheduleTask}
            />
            <CalendarView 
              blocks={blocks}
              scheduledTasks={planResult?.scheduledTasks || []}
              conflicts={planResult?.conflicts || []}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onEditTask={handleEditTaskFromCalendar}
              onReassignTask={handleReassignTask}
            />
          </div>
        );
    }
  };

  // Edit Modal for task from calendar
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Alta': return 'bg-orange-100 text-orange-700';
      case 'Media': return 'bg-blue-100 text-blue-700';
      case 'Baja': return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title={formatDate(selectedDate)}
          conflictCount={conflicts}
          onGeneratePlan={handleGeneratePlan}
          planGenerated={planGenerated}
        />
        
        {renderContent()}
      </main>

      {/* Edit Modal from Calendar */}
      {editTaskFromCalendar && (
        <EditTaskModal
          task={editTaskFromCalendar}
          onClose={() => setEditTaskFromCalendar(null)}
          onSave={(taskData) => handleUpdateTask(editTaskFromCalendar.id, taskData)}
          formatDateForInput={formatDateForInput}
          getPriorityColor={getPriorityColor}
        />
      )}
    </div>
  );
};

// Separate component for edit modal
interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskData: { title: string; deadline: Date; durationMinutes: number; priority: TaskPriority }) => void;
  formatDateForInput: (date: Date) => string;
  getPriorityColor: (priority: TaskPriority) => string;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onSave, formatDateForInput, getPriorityColor }) => {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDuration, setEditDuration] = useState(task.durationMinutes);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editDeadline, setEditDeadline] = useState(formatDateForInput(task.deadline));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editDeadline) {
      onSave({
        title: editTitle,
        deadline: new Date(editDeadline),
        durationMinutes: editDuration,
        priority: editPriority
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={onClose}
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
  );
};

export default App;
