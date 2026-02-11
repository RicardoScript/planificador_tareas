
import React, { useMemo, useState } from 'react';
import { TimeBlock, ScheduledTask, Task, TaskPriority } from '../types';

interface CalendarViewProps {
  blocks: TimeBlock[];
  scheduledTasks: ScheduledTask[];
  conflicts: Task[];
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
  onEditTask?: (task: Task) => void;
  onReassignTask?: (taskId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  blocks, 
  scheduledTasks, 
  conflicts, 
  selectedDate, 
  onDateChange,
  onEditTask,
  onReassignTask 
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
  const dayOfWeek = selectedDate.getDay();

  // Get blocks for selected day
  const todayBlocks = useMemo(() => 
    blocks.filter(b => b.dayOfWeek === dayOfWeek),
    [blocks, dayOfWeek]
  );

  // Current time indicator position
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimePosition = ((currentHour - 7) * 100) + (currentMinute / 60 * 100);
  
  // Check if selected date is today
  const isToday = selectedDate.toDateString() === now.toDateString();

  // Convert time to position
  const timeToPosition = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return (h - 7) * 100 + (m / 60) * 100;
  };

  // Convert time to height
  const timeToHeight = (startTime: string, endTime: string): number => {
    const start = timeToPosition(startTime);
    const end = timeToPosition(endTime);
    return end - start;
  };

  // Format time for display
  const formatTime = (time: string): string => {
    const [hours, mins] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return mins === 0 ? `${displayHours} ${suffix}` : `${displayHours}:${mins.toString().padStart(2, '0')} ${suffix}`;
  };

  // Format date for header
  const formatDateHeader = (): string => {
    return selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    if (onDateChange) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      onDateChange(newDate);
    }
  };

  // Navigate to next day
  const goToNextDay = () => {
    if (onDateChange) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      onDateChange(newDate);
    }
  };

  // Handle date selection from picker
  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateChange && e.target.value) {
      const newDate = new Date(e.target.value);
      onDateChange(newDate);
      setShowDatePicker(false);
    }
  };

  // Format date for input value
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get day name
  const getDayName = (): string => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[selectedDate.getDay()];
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Alta': return 'bg-orange-100 text-orange-600';
      case 'Media': return 'bg-blue-100 text-blue-600';
      case 'Baja': return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPreviousDay}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700">{formatDateHeader()}</span>
                <span className="text-xs text-gray-500">{getDayName()}</span>
                <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_month</span>
              </button>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                  <input
                    type="date"
                    value={formatDateForInput(selectedDate)}
                    onChange={handleDateSelect}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        if (onDateChange) onDateChange(new Date());
                        setShowDatePicker(false);
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={goToNextDay}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

            {isToday && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                Hoy
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-100 border border-gray-200"></div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Clase Fija</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-200"></div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-200"></div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tarea Asignada</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="flex flex-col relative" style={{ minHeight: hours.length * 100 }}>
          {/* Hour lines */}
          {hours.map((hour) => (
            <div key={hour} className="flex min-h-[100px] border-b border-gray-50 group relative">
              <div className="w-20 px-4 py-3 text-right shrink-0 border-r border-gray-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </span>
              </div>
              <div className="flex-1 group-hover:bg-gray-50/30 transition-colors"></div>
            </div>
          ))}

          {/* No blocks message */}
          {todayBlocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-6 bg-gray-50/80 rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event_busy</span>
                <p className="text-gray-500 font-medium">No hay bloques para este día</p>
                <p className="text-gray-400 text-sm mt-1">Ve a "Bloques" para definir tu disponibilidad</p>
              </div>
            </div>
          )}

          {/* Fixed blocks (classes) */}
          {todayBlocks.filter(b => b.isFixed).map(block => (
            <div
              key={block.id}
              className="absolute left-20 right-4 bg-gray-100 border-l-4 border-gray-400 rounded-md p-3 shadow-sm z-10"
              style={{
                top: timeToPosition(block.startTime),
                height: timeToHeight(block.startTime, block.endTime) - 4
              }}
            >
              <div className="flex justify-between items-start">
                <h5 className="text-xs font-bold text-gray-700">{block.title}</h5>
                <span className="text-[10px] font-medium text-gray-500">
                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                </span>
              </div>
            </div>
          ))}

          {/* Available blocks */}
          {todayBlocks.filter(b => !b.isFixed).map(block => {
            const blockTasks = scheduledTasks.filter(st => st.blockId === block.id);
            const hasScheduledTasks = blockTasks.length > 0;
            
            return (
              <React.Fragment key={block.id}>
                {/* Base available block */}
                <div
                  className={`absolute left-20 right-4 rounded-xl border-2 border-dashed z-5 ${
                    hasScheduledTasks 
                      ? 'bg-emerald-50/30 border-emerald-200' 
                      : 'bg-emerald-50/50 border-emerald-300'
                  }`}
                  style={{
                    top: timeToPosition(block.startTime),
                    height: timeToHeight(block.startTime, block.endTime) - 4
                  }}
                >
                  {!hasScheduledTasks && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-emerald-400 text-xs font-medium opacity-50">
                        Bloque disponible: {formatTime(block.startTime)} - {formatTime(block.endTime)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scheduled tasks within block */}
                {blockTasks.map(st => {
                  const isHovered = hoveredTaskId === st.taskId;
                  return (
                    <div
                      key={st.taskId}
                      className="absolute left-24 right-8 bg-blue-50 border-l-4 border-blue-500 rounded-md p-3 shadow-sm z-10 group cursor-pointer hover:shadow-md transition-shadow"
                      style={{
                        top: timeToPosition(st.startTime) + 4,
                        height: Math.max(timeToHeight(st.startTime, st.endTime) - 8, 60)
                      }}
                      onMouseEnter={() => setHoveredTaskId(st.taskId)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-blue-700">{st.task.title}</h5>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-medium text-blue-500">
                            {formatTime(st.startTime)} - {formatTime(st.endTime)}
                          </span>
                          
                          {/* Action buttons - visible on hover */}
                          {isHovered && (
                            <div className="flex gap-1 ml-2">
                              {onEditTask && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTask(st.task);
                                  }}
                                  className="p-1 bg-white rounded shadow-sm hover:bg-blue-100 transition-colors"
                                  title="Editar tarea"
                                >
                                  <span className="material-symbols-outlined text-[14px] text-blue-600">edit</span>
                                </button>
                              )}
                              {onReassignTask && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReassignTask(st.taskId);
                                  }}
                                  className="p-1 bg-white rounded shadow-sm hover:bg-orange-100 transition-colors"
                                  title="Reasignar a otro horario"
                                >
                                  <span className="material-symbols-outlined text-[14px] text-orange-600">schedule</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {st.task.priority && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${getPriorityColor(st.task.priority)}`}>
                            Prioridad {st.task.priority}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Conflict indicator */}
          {conflicts.length > 0 && (
            <div className="absolute left-20 right-4 bottom-4 z-20">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                  <span className="text-sm font-bold text-red-700">Conflictos Detectados</span>
                </div>
                <div className="space-y-1">
                  {conflicts.slice(0, 3).map(task => (
                    <div key={task.id} className="text-xs text-red-600">
                      • {task.title}: {task.conflictMessage}
                    </div>
                  ))}
                  {conflicts.length > 3 && (
                    <div className="text-xs text-red-400">...y {conflicts.length - 3} más</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current time indicator - only show on today */}
          {isToday && currentHour >= 7 && currentHour <= 20 && (
            <div 
              className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
              style={{ top: currentTimePosition }}
            >
              <div className="w-20 h-px bg-transparent"></div>
              <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-sm border-2 border-white"></div>
              <div className="flex-1 h-[2px] bg-red-500 shadow-sm"></div>
              <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-l-md -mr-px flex items-center">
                {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
