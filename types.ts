
export type TaskPriority = 'Baja' | 'Media' | 'Alta';
export type TaskStatus = 'pending' | 'scheduled' | 'completed' | 'conflict' | 'expired';

export interface Task {
  id: string;
  title: string;
  deadline: Date;
  durationMinutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  conflictMessage?: string;
  assignedBlockId?: string;
}

export interface TimeBlock {
  id: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  isFixed?: boolean; // true for classes, false for available time
  title?: string;    // for fixed blocks like classes
}

export interface ScheduledTask {
  taskId: string;
  blockId: string;
  startTime: string;
  endTime: string;
  task: Task;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'class' | 'study' | 'available';
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
  priority?: TaskPriority;
  taskId?: string;
  isConflict?: boolean;
}

export interface PlanResult {
  scheduledTasks: ScheduledTask[];
  conflicts: Task[];
  events: CalendarEvent[];
}

export type ViewType = 'Dashboard' | 'Tareas' | 'Bloques' | 'Plan';
