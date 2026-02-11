
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems: { label: ViewType; icon: string; description: string }[] = [
    { label: 'Dashboard', icon: 'dashboard', description: 'Vista general' },
    { label: 'Tareas', icon: 'assignment', description: 'Gestionar tareas' },
    { label: 'Bloques', icon: 'calendar_month', description: 'Definir horarios' },
    { label: 'Plan', icon: 'event_note', description: 'Ver plan generado' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-[22px]">school</span>
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-gray-900">Planificador IA</h2>
            <p className="text-xs text-gray-500">Organiza tus estudios</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onViewChange(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === item.label
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${
                currentView === item.label ? 'text-blue-600' : 'text-gray-400'
              }`}>{item.icon}</span>
              <div className="text-left">
                <div>{item.label}</div>
                <div className={`text-[10px] ${
                  currentView === item.label ? 'text-blue-400' : 'text-gray-400'
                }`}>{item.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-100">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">tips_and_updates</span>
            <span className="text-xs font-bold text-blue-800">Consejo</span>
          </div>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Define tus bloques de tiempo libre y deja que la IA organice tus tareas automáticamente.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
