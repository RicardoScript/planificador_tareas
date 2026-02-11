import React, { useState } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Bienvenido a tu Planificador',
    description: 'Organiza tu vida académica con inteligencia artificial. Aquí tienes una guía rápida de cómo funciona.',
    icon: 'school'
  },
  {
    title: '1. Define tus Bloques',
    description: 'Ve a la sección "Bloques" y establece tus horas disponibles para estudio y tus clases fijas. Es esencial para que la IA sepa cuándo puedes trabajar.',
    icon: 'calendar_add_on'
  },
  {
    title: '2. Crea tus Tareas',
    description: 'Agrega tus entregas y exámenes en el "Dashboard". Define la fecha límite, duración y prioridad.',
    icon: 'add_task'
  },
  {
    title: '3. Genera tu Horario',
    description: 'Al hacer clic en "Añadir al horario" o "Planificar", el sistema asignará automáticamente tus tareas en los mejores bloques disponibles.',
    icon: 'auto_schedule'
  },
  {
    title: '4. Ajusta y Cumple',
    description: 'Puedes arrastrar tareas conflictos o editar bloques si tu día cambia. ¡Marca las tareas como completadas para seguir avanzando!',
    icon: 'check_circle'
  }
];

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-blue-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 opacity-50"></div>
          <span className="material-symbols-outlined text-6xl relative z-10 mb-4 block">
            {STEPS[currentStep].icon}
          </span>
          <h2 className="text-2xl font-bold relative z-10">{STEPS[currentStep].title}</h2>
          
          <div className="absolute top-4 right-4">
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-gray-600 text-lg leading-relaxed">
            {STEPS[currentStep].description}
          </p>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStep === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {currentStep === STEPS.length - 1 ? '¡Entendido!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
