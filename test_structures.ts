import { generatePlan } from './scheduler';
import { Task, TimeBlock } from './types';

const now = new Date();
const today = new Date(now);
today.setHours(0, 0, 0, 0);

const blocks: TimeBlock[] = [
    { id: 'b1', dayOfWeek: today.getDay(), startTime: '08:00', endTime: '10:00', isFixed: false },
    { id: 'b2', dayOfWeek: today.getDay(), startTime: '10:00', endTime: '12:00', isFixed: true, title: 'Clase de Algoritmos' }, // Fixed
    { id: 'b3', dayOfWeek: today.getDay(), startTime: '14:00', endTime: '18:00', isFixed: false }
];

const tasks: Task[] = [
    {
        id: 't1', title: 'Tarea Urgente Corta', durationMinutes: 30, priority: 'Alta', status: 'pending',
        deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
    },
    {
        id: 't2', title: 'Tarea Media Larga', durationMinutes: 60, priority: 'Media', status: 'pending',
        deadline: new Date(now.getTime() + 5 * 60 * 60 * 1000)
    },
    {
        id: 't3', title: 'Tarea Baja', durationMinutes: 30, priority: 'Baja', status: 'pending',
        deadline: new Date(now.getTime() + 10 * 60 * 60 * 1000)
    },
    {
        id: 't4', title: 'Tarea Fixed Slot', durationMinutes: 60, priority: 'Alta', status: 'pending',
        deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        fixedSlot: { startTime: '08:00' } // Should overlap with b1
    }
];

console.log('--- Ejecutando Planificador ---');
const result = generatePlan(tasks, blocks, today);

console.log('\n--- Tareas Programadas ---');
result.scheduledTasks.forEach(st => {
    console.log(`[${st.startTime} - ${st.endTime}] ${st.task.title} (Block: ${st.blockId})`);
});

console.log('\n--- Conflictos ---');
result.conflicts.forEach(c => {
    console.log(`[Conflict] ${c.title}: ${c.conflictMessage}`);
});

console.log('\n--- Eventos Calendario ---');
result.events.forEach(e => {
    console.log(`[${e.startTime} - ${e.endTime}] ${e.title} (${e.type})`);
});
