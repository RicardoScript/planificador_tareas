
import { Task, TimeBlock, ScheduledTask, CalendarEvent, PlanResult } from './types';

// Calculate urgency score (higher = more urgent)
function calculateUrgency(task: Task, now: Date): number {
  const hoursUntilDeadline = (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const priorityScore = task.priority === 'Alta' ? 100 : task.priority === 'Media' ? 50 : 25;
  
  // More urgent if deadline is closer + higher priority
  // Negative hours mean expired
  if (hoursUntilDeadline <= 0) return -Infinity; // Expired tasks
  
  return priorityScore / hoursUntilDeadline;
}

// Convert time string to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes from midnight to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Get block duration in minutes
function getBlockDuration(block: TimeBlock): number {
  return timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
}

// Check if task fits within deadline
function isWorkableWithinDeadline(task: Task, startTimeMinutes: number, durationMinutes: number, targetDate: Date): boolean {
  const endTimeMinutes = startTimeMinutes + durationMinutes;
  
  // Create a Date object for the potential end time
  const potentialEndTime = new Date(targetDate);
  const hours = Math.floor(endTimeMinutes / 60);
  const minutes = endTimeMinutes % 60;
  potentialEndTime.setHours(hours, minutes, 0, 0);
  
  // Check if completion time is at or before deadline
  return task.deadline.getTime() >= potentialEndTime.getTime();
}

// Sort tasks by urgency (greedy approach)
function sortByUrgency(tasks: Task[], now: Date): Task[] {
  return [...tasks]
    .filter(t => t.status === 'pending')
    .sort((a, b) => {
      const urgencyA = calculateUrgency(a, now);
      const urgencyB = calculateUrgency(b, now);
      return urgencyB - urgencyA; // Descending
    });
}

// Main scheduling algorithm
export function generatePlan(
  tasks: Task[],
  blocks: TimeBlock[],
  targetDate: Date = new Date()
): PlanResult {
  const now = new Date();
  const dayOfWeek = targetDate.getDay();
  
  // Check if target date is today
  const isToday = targetDate.getDate() === now.getDate() &&
                  targetDate.getMonth() === now.getMonth() &&
                  targetDate.getFullYear() === now.getFullYear();

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Filter blocks for target day and not fixed (available time)
  const availableBlocks = blocks
    .filter(b => b.dayOfWeek === dayOfWeek && !b.isFixed)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  // Get fixed blocks (classes, etc.)
  const fixedBlocks = blocks.filter(b => b.dayOfWeek === dayOfWeek && b.isFixed);
  
  // Priority queue by urgency
  const pendingTasks = sortByUrgency(tasks, now);
  
  const scheduledTasks: ScheduledTask[] = [];
  const conflicts: Task[] = [];
  const assignedTaskIds = new Set<string>();
  
  // Track remaining time in each block
  const blockRemainingTime = new Map<string, { start: number; end: number }>();
  availableBlocks.forEach(block => {
    let start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    
    // If scheduling for today, adjust start time to not be in the past
    if (isToday) {
      if (end <= nowMinutes) {
        // Block is entirely in the past, skip it
        return; 
      }
      if (start < nowMinutes) {
        // Block started in the past, adjust start to now
        start = nowMinutes;
      }
    }
    
    blockRemainingTime.set(block.id, { start, end });
  });
  
  // Check for expired tasks first
  for (const task of pendingTasks) {
    if (task.deadline < now) {
      conflicts.push({
        ...task,
        status: 'expired',
        conflictMessage: '¡El deadline ya pasó!'
      });
      assignedTaskIds.add(task.id);
    }
  }
  
  // Greedy assignment: for each task, find first available block
  for (const task of pendingTasks) {
    if (assignedTaskIds.has(task.id)) continue;
    
    let assigned = false;
    
    for (const block of availableBlocks) {
      const remaining = blockRemainingTime.get(block.id);
      if (!remaining) continue;
      
      const availableMinutes = remaining.end - remaining.start;
      
      // Check if task fits
      if (task.durationMinutes <= availableMinutes) {
        // Check if deadline allows using the correct logic:
        // Task end time must be <= Deadline (not Block end time <= Deadline)
        if (isWorkableWithinDeadline(task, remaining.start, task.durationMinutes, targetDate)) {
          const startTime = minutesToTime(remaining.start);
          const endTime = minutesToTime(remaining.start + task.durationMinutes);
          
          scheduledTasks.push({
            taskId: task.id,
            blockId: block.id,
            startTime,
            endTime,
            task: { ...task, status: 'scheduled', assignedBlockId: block.id }
          });
          
          // Update remaining time in block
          remaining.start += task.durationMinutes;
          assignedTaskIds.add(task.id);
          assigned = true;
          break;
        }
      }
    }
    
    if (!assigned) {
      // Determine conflict reason
      const maxBlockDuration = Math.max(...availableBlocks.map(b => getBlockDuration(b)), 0);
      let conflictMessage = '¡No cabe en el horario de hoy!';
      
      if (task.durationMinutes > maxBlockDuration && maxBlockDuration > 0) {
        conflictMessage = `Requiere ${task.durationMinutes}min, bloque máximo: ${maxBlockDuration}min`;
      } else if (availableBlocks.length === 0) {
        conflictMessage = 'No hay bloques disponibles definidos';
      }
      
      conflicts.push({
        ...task,
        status: 'conflict',
        conflictMessage
      });
    }
  }
  
  // Generate calendar events
  const events: CalendarEvent[] = [];
  
  // Add fixed blocks as events
  fixedBlocks.forEach(block => {
    events.push({
      id: `fixed-${block.id}`,
      title: block.title || 'Evento Fijo',
      type: 'class',
      startTime: block.startTime,
      endTime: block.endTime
    });
  });
  
  // Add scheduled tasks as events
  scheduledTasks.forEach(st => {
    events.push({
      id: `task-${st.taskId}`,
      title: st.task.title,
      type: 'study',
      startTime: st.startTime,
      endTime: st.endTime,
      priority: st.task.priority,
      taskId: st.taskId
    });
  });
  
  // Add conflict indicators for each block that has remaining time
  // but tasks couldn't fit
  conflicts.forEach(task => {
    if (task.status === 'conflict' && task.conflictMessage?.includes('Requiere')) {
      events.push({
        id: `conflict-${task.id}`,
        title: `⚠️ ${task.title} no cabe`,
        type: 'study',
        startTime: '00:00',
        endTime: '00:00',
        isConflict: true
      });
    }
  });
  
  return { scheduledTasks, conflicts, events };
}

// Update task list with scheduling results
export function applySchedulingResults(
  tasks: Task[],
  result: PlanResult
): Task[] {
  const scheduledMap = new Map<string, ScheduledTask>();
  result.scheduledTasks.forEach(st => scheduledMap.set(st.taskId, st));
  
  const conflictMap = new Map<string, Task>();
  result.conflicts.forEach(c => conflictMap.set(c.id, c));
  
  return tasks.map(task => {
    if (task.status === 'completed') return task;
    
    const scheduled = scheduledMap.get(task.id);
    if (scheduled) {
      return {
        ...task,
        status: 'scheduled' as const,
        assignedBlockId: scheduled.blockId,
        conflictMessage: undefined
      };
    }
    
    const conflict = conflictMap.get(task.id);
    if (conflict) {
      return {
        ...task,
        status: conflict.status,
        conflictMessage: conflict.conflictMessage
      };
    }
    
    return task;
  });
}

// Get display time for events
export function formatTimeRange(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return mins === 0 ? `${displayHours} ${suffix}` : `${displayHours}:${mins.toString().padStart(2, '0')} ${suffix}`;
  };
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}
