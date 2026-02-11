
import React, { useState } from 'react';
import { TimeBlock } from '../types';

interface BlocksManagerProps {
  blocks: TimeBlock[];
  onAddBlock: (block: Omit<TimeBlock, 'id'>) => void;
  onDeleteBlock: (id: string) => void;
}

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

const BlocksManager: React.FC<BlocksManagerProps> = ({ blocks, onAddBlock, onDeleteBlock }) => {
  const [showForm, setShowForm] = useState(false);
  const [newBlockDay, setNewBlockDay] = useState(new Date().getDay());
  const [newBlockStart, setNewBlockStart] = useState('09:00');
  const [newBlockEnd, setNewBlockEnd] = useState('11:00');
  const [newBlockIsFixed, setNewBlockIsFixed] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBlockStart < newBlockEnd) {
      onAddBlock({
        dayOfWeek: newBlockDay,
        startTime: newBlockStart,
        endTime: newBlockEnd,
        isFixed: newBlockIsFixed,
        title: newBlockIsFixed ? newBlockTitle : undefined
      });
      setShowForm(false);
      setNewBlockTitle('');
      setNewBlockIsFixed(false);
    }
  };

  const formatTime = (time: string): string => {
    const [hours, mins] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return mins === 0 ? `${displayHours} ${suffix}` : `${displayHours}:${mins.toString().padStart(2, '0')} ${suffix}`;
  };

  const getDuration = (start: string, end: string): string => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hours}h ${remainMins}min` : `${hours}h`;
  };

  // Group blocks by day
  const blocksByDay = DAYS.map(day => ({
    ...day,
    blocks: blocks.filter(b => b.dayOfWeek === day.value).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    )
  })).filter(d => d.blocks.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bloques de Tiempo</h2>
          <p className="text-gray-500 text-sm mt-1">Define tus horarios disponibles y clases fijas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Bloque
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Bloque</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Día</label>
                <select
                  value={newBlockDay}
                  onChange={(e) => setNewBlockDay(parseInt(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {DAYS.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio</label>
                <input
                  type="time"
                  value={newBlockStart}
                  onChange={(e) => setNewBlockStart(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin</label>
                <input
                  type="time"
                  value={newBlockEnd}
                  onChange={(e) => setNewBlockEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBlockIsFixed}
                  onChange={(e) => setNewBlockIsFixed(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Es una clase fija (no disponible para tareas)</span>
              </label>
            </div>

            {newBlockIsFixed && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de la clase</label>
                <input
                  type="text"
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  placeholder="Ej: Matemáticas 101"
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Crear Bloque
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {blocksByDay.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">calendar_add_on</span>
            <h3 className="text-lg font-semibold text-gray-600">No hay bloques definidos</h3>
            <p className="text-gray-400 mt-1">Agrega bloques de disponibilidad para empezar a planificar</p>
          </div>
        ) : (
          blocksByDay.map(day => (
            <div key={day.value} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">{day.label}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {day.blocks.map(block => (
                  <div key={block.id} className="px-5 py-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-12 rounded-full ${block.isFixed ? 'bg-gray-400' : 'bg-emerald-500'}`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {formatTime(block.startTime)} - {formatTime(block.endTime)}
                          </span>
                          <span className="text-xs text-gray-400">({getDuration(block.startTime, block.endTime)})</span>
                        </div>
                        <span className={`text-sm ${block.isFixed ? 'text-gray-600' : 'text-emerald-600'}`}>
                          {block.isFixed ? block.title : 'Disponible para tareas'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                        block.isFixed ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {block.isFixed ? 'Fijo' : 'Libre'}
                      </span>
                      <button
                        onClick={() => onDeleteBlock(block.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlocksManager;
