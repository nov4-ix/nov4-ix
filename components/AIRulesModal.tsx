import React, { useState, useEffect } from 'react';

interface AIRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: string;
  onSave: (rules: string) => void;
}

const AIRulesModal: React.FC<AIRulesModalProps> = ({ isOpen, onClose, rules, onSave }) => {
  const [localRules, setLocalRules] = useState(rules);

  useEffect(() => {
    setLocalRules(rules);
  }, [rules, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localRules);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#122024] border border-[#15333B] rounded-lg shadow-xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#15333B]">
          <h2 className="text-xl font-bold">Reglas del Asistente de IA</h2>
          <p className="text-sm text-gray-400 mt-1">
            Define un conjunto de reglas que la IA debe seguir siempre para este repositorio. Escribe cada regla en una nueva línea.
          </p>
        </div>
        
        <div className="p-6 flex-1">
          <textarea
            value={localRules}
            onChange={(e) => setLocalRules(e.target.value)}
            placeholder={`Ejemplos:
- No usar librerías externas a menos que se pida explícitamente.
- Todos los componentes deben usar Tailwind CSS para los estilos.
- Nunca modificar el archivo 'src/config.ts'.`}
            className="w-full h-64 px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md text-sm outline-none focus:ring-1 focus:ring-[#B858FE] resize-y"
          />
        </div>

        <div className="p-4 bg-[#171925]/50 border-t border-[#15333B] flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-[#15333B]/70 hover:bg-[#15333B] rounded-md transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-[#B858FE] text-black font-bold rounded-md hover:bg-[#a048e0] text-sm">
            Guardar Reglas
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRulesModal;
