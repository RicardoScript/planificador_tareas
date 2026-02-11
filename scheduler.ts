
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
  
  // 1. Get ALL blocks for target day (fixed and available)
  const dayBlocks = blocks
    .filter(b => b.dayOfWeek === dayOfWeek)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  // 2. Identify occupied time ranges from Fixed Blocks (Classes)
  const occupiedRanges: { start: number; end: number; title: string }[] = [];
  
  dayBlocks.forEach(block => {
    if (block.isFixed) {
      occupiedRanges.push({
        start: timeToMinutes(block.startTime),
        end: timeToMinutes(block.endTime),
        title: block.title || 'Evento Fijo'
      });
    }
  });

  const scheduledTasks: ScheduledTask[] = [];
  const conflicts: Task[] = [];
  const assignedTaskIds = new Set<string>();
  const events: CalendarEvent[] = []; // Store events here to check against for collisions

  // Helper to check collision with ANY existing event/task
  const checkCollision = (start: number, end: number): boolean => {
    // Check against fixed class blocks
    if (occupiedRanges.some(r => 
      (start < r.end && end > r.start) // Overlap
    )) return true;

    // Check against already scheduled tasks
    if (scheduledTasks.some(st => {
      const stStart = timeToMinutes(st.startTime);
      const stEnd = timeToMinutes(st.endTime);
      return (start < stEnd && end > stStart);
    })) return true;

    return false;
  };

  // 3. Process Fixed Slot Tasks FIRST
  const fixedSlotTasks = tasks.filter(t => t.fixedSlot && t.status !== 'completed' && t.status !== 'expired');

  fixedSlotTasks.forEach(task => {
    if (!task.fixedSlot) return;
    
    // Convert fixed time to minutes
    const start = timeToMinutes(task.fixedSlot.startTime);
    const end = start + task.durationMinutes;
    
    // Check if it's in the past (if today)
    if (isToday && end <= nowMinutes) {
      conflicts.push({
        ...task,
        status: 'expired',
        conflictMessage: 'El horario fijo ya pasó'
      });
      return;
    }

    // Check collisions
    if (checkCollision(start, end)) {
       conflicts.push({
        ...task,
        status: 'conflict',
        conflictMessage: 'Conflicto con otro evento o clase'
      });
      return;
    }

    // Determine which "block" this falls into or create a virtual one?
    // For simplicity, we just add it to scheduledTasks. 
    // We can assign a 'custom-block' ID or find the closest block if needed for UI,
    // but the calendar renders based on time, so blockID matches are less critical for rendering 
    // IF we update CalendarView to render all scheduledTasks regardless of block ID.
    // However, existing logic relies on blocks. Let's try to fit it into an available block 
    // or create a "virtual" assignment.
    
    // NOTE: The current CalendarView renders tasks based on `blockId` matching `todayBlocks`.
    // If we want to support arbitrary fixed times outside of defined "Available Blocks",
    // we need to be careful.
    // Strategy: fixed tasks are just scheduled tasks. We assign them a virtual block ID 
    // if they don't fit a real one, OR we imply they are their own block.
    
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    scheduledTasks.push({
      taskId: task.id,
      blockId: 'fixed-slot-' + task.id, // Virtual block ID
      startTime,
      endTime,
      task: { ...task, status: 'scheduled', assignedBlockId: 'fixed-slot-' + task.id }
    });
    
    assignedTaskIds.add(task.id);
  });

  // 4. Flexible Scheduling for remaining tasks
  // Filter available blocks for regular scheduling
  // We need to subtract time occupied by Fixed Slot tasks from these blocks
  
  // Re-calculate available time ranges
  // Start with defined "Available Blocks"
  let flexibleTimeRanges: { start: number; end: number; blockId: string }[] = [];
  
  dayBlocks.filter(b => !b.isFixed).forEach(block => {
    let start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    
    if (isToday) {
      if (end <= nowMinutes) return;
      if (start < nowMinutes) start = nowMinutes;
    }
    
    if (start < end) {
      flexibleTimeRanges.push({ start, end, blockId: block.id });
    }
  });

  // Subtract Scheduled Fixed Tasks from these ranges
  scheduledTasks.forEach(st => {
    const stStart = timeToMinutes(st.startTime);
    const stEnd = timeToMinutes(st.endTime);
    
    const newRanges: { start: number; end: number; blockId: string }[] = [];
    
    flexibleTimeRanges.forEach(range => {
      // Logic to split range if task overlaps
      if (stEnd <= range.start || stStart >= range.end) {
        // No overlap
        newRanges.push(range);
      } else {
        // Overlap - split
        if (stStart > range.start) {
            newRanges.push({ start: range.start, end: stStart, blockId: range.blockId });
        }
        if (stEnd < range.end) {
            newRanges.push({ start: stEnd, end: range.end, blockId: range.blockId });
        }
      }
    });
    flexibleTimeRanges = newRanges;
  });

  // Sort available ranges by time
  flexibleTimeRanges.sort((a, b) => a.start - b.start);

  // Priority queue by urgency for remaining tasks
  const pendingTasks = sortByUrgency(tasks, now).filter(t => !assignedTaskIds.has(t.id));

  // Check for expired tasks
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

  // Greedy assignment for flexible tasks
  for (const task of pendingTasks) {
    if (assignedTaskIds.has(task.id)) continue;
    
    let assigned = false;
    
    for (const range of flexibleTimeRanges) {
      const availableMinutes = range.end - range.start;
      
      if (task.durationMinutes <= availableMinutes) {
         if (isWorkableWithinDeadline(task, range.start, task.durationMinutes, targetDate)) {
            const startTime = minutesToTime(range.start);
            const endTime = minutesToTime(range.start + task.durationMinutes);
            
            scheduledTasks.push({
              taskId: task.id,
              blockId: range.blockId,
              startTime,
              endTime,
              task: { ...task, status: 'scheduled', assignedBlockId: range.blockId }
            });
            
            // Consume time from this range
            range.start += task.durationMinutes;
            assigned = true;
            assignedTaskIds.add(task.id);
            break;
         }
      }
    }
    
    if (!assigned) {
       conflicts.push({
        ...task,
        status: 'conflict',
        conflictMessage: 'No cabe en el horario disponible'
      });
    }
  }
  
  // Generate calendar events
  
  // Add fixed blocks as events
  dayBlocks.filter(b => b.isFixed).forEach(block => {
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
