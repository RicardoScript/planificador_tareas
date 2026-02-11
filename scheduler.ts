
import { Task, TimeBlock, ScheduledTask, CalendarEvent, PlanResult } from './types';
import { PriorityQueue, LinkedList } from './structures';

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

// Sort tasks by urgency (greedy approach) - DEPRECATED/REMOVED in favor of PriorityQueue
// function sortByUrgency(tasks: Task[], now: Date): Task[] { ... }

// Main scheduling algorithm
export function generatePlan(
  tasks: Task[],
  blocks: TimeBlock[],
  targetDate: Date = new Date()
): PlanResult {
  const now = new Date();
  const dayOfWeek = targetDate.getDay();

  // 0. HashMap de Tareas para acceso rápido (Requisito)
  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  // Check if target date is today
  const isToday = targetDate.getDate() === now.getDate() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getFullYear() === now.getFullYear();

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Get ALL blocks for target day (fixed and available) putting them in a LinkedList
  // Requisito: Lista enlazada ordenada cronológicamente
  const blocksList = new LinkedList<TimeBlock>();

  blocks
    .filter(b => b.dayOfWeek === dayOfWeek)
    .forEach(b => {
      blocksList.insertSorted(b, (b1, b2) => timeToMinutes(b1.startTime) - timeToMinutes(b2.startTime));
    });

  // 2. Identify occupied time ranges from Fixed Blocks (Classes)
  const occupiedRanges: { start: number; end: number; title: string }[] = [];

  // Iterate the LinkedList
  let currentBlock = blocksList.head;
  while (currentBlock) {
    const block = currentBlock.value;
    if (block.isFixed) {
      occupiedRanges.push({
        start: timeToMinutes(block.startTime),
        end: timeToMinutes(block.endTime),
        title: block.title || 'Evento Fijo'
      });
    }
    currentBlock = currentBlock.next;
  }

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

  // Re-calculate available time ranges
  let flexibleTimeRanges: { start: number; end: number; blockId: string }[] = [];

  // Iterate LinkedList for flexible blocks
  currentBlock = blocksList.head;
  while (currentBlock) {
    const block = currentBlock.value;
    if (!block.isFixed) {
      let start = timeToMinutes(block.startTime);
      const end = timeToMinutes(block.endTime);

      if (isToday) {
        if (end <= nowMinutes) {
          currentBlock = currentBlock.next;
          continue;
        }
        if (start < nowMinutes) start = nowMinutes;
      }

      if (start < end) {
        flexibleTimeRanges.push({ start, end, blockId: block.id });
      }
    }
    currentBlock = currentBlock.next;
  }

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

  // Requisito: Priority Queue (Heap) para Tareas Candidatas
  const candidateQueue = new PriorityQueue<Task>();

  tasks.forEach(t => {
    if (t.status === 'pending' && !assignedTaskIds.has(t.id)) {
      // Calculate urgency
      const urgency = calculateUrgency(t, now);
      candidateQueue.enqueue(t, urgency);
    }
  });

  // Process queue
  while (!candidateQueue.isEmpty()) {
    const task = candidateQueue.dequeue()!;

    if (assignedTaskIds.has(task.id)) continue;

    // Check for expired tasks
    if (task.deadline < now) {
      conflicts.push({
        ...task,
        status: 'expired',
        conflictMessage: '¡El deadline ya pasó!'
      });
      assignedTaskIds.add(task.id);
      continue;
    }

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

  // Add fixed blocks as events from LinkedList
  currentBlock = blocksList.head;
  while (currentBlock) {
    const block = currentBlock.value;
    if (block.isFixed) {
      events.push({
        id: `fixed-${block.id}`,
        title: block.title || 'Evento Fijo',
        type: 'class',
        startTime: block.startTime,
        endTime: block.endTime
      });
    }
    currentBlock = currentBlock.next;
  }

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
