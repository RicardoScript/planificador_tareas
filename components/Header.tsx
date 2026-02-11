
import React from 'react';

interface HeaderProps {
  title: string;
  conflictCount: number;
  onGeneratePlan: () => void;
  planGenerated?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, conflictCount, onGeneratePlan, planGenerated }) => {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {conflictCount > 0 ? (
          <div className="flex items-center gap-2 mt-1 text-sm text-red-500">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span className="font-medium">
              {conflictCount} {conflictCount === 1 ? 'tarea no cabe' : 'tareas no caben'} en el horario
            </span>
          </div>
        ) : planGenerated ? (
          <div className="flex items-center gap-2 mt-1 text-sm text-green-600">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span className="font-medium">Plan generado correctamente</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Haz clic en "Generar Plan" para organizar tus tareas</span>
          </div>
        )}
      </div>
      
      <button
        onClick={onGeneratePlan}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95 ${
          planGenerated && conflictCount === 0
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {planGenerated ? 'refresh' : 'auto_awesome'}
        </span>
        {planGenerated ? 'Regenerar Plan' : 'Generar Plan'}
      </button>
    </header>
  );
};

export default Header;
