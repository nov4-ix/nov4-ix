import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider } from '../types';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onConfigChange: (newConfig: AIConfig) => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose, config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;
  
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    const newConfig: AIConfig = {
        provider: newProvider,
        apiKey: '',
        model: newProvider === AIProvider.GEMINI ? 'gemini-2.5-flash' : (newProvider === AIProvider.ANTHROPIC ? 'claude-3-haiku-20240307' : 'gpt-4o'),
        baseUrl: '',
    };
    setLocalConfig(newConfig);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setLocalConfig(prev => ({ ...prev, [name]: value }));
  }

  const handleSave = () => {
      onConfigChange(localConfig);
      onClose();
  }

  const providerDetails = {
    [AIProvider.GEMINI]: {
        name: "Google Gemini",
        needsKey: false,
        models: ["gemini-2.5-pro", "gemini-2.5-flash"],
        needsBaseUrl: false,
        description: "Usa la clave de API proporcionada en el entorno. No se necesita configuración adicional."
    },
    [AIProvider.OPENAI]: {
        name: "OpenAI / Compatible",
        needsKey: true,
        models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
        needsBaseUrl: true,
        description: "Para la API de OpenAI o cualquier servicio compatible como Ollama. Para Ollama, usa el nombre de tu modelo (ej. 'llama3') y establece la URL Base a http://localhost:11434/v1."
    },
    [AIProvider.ANTHROPIC]: {
        name: "Anthropic Claude",
        needsKey: true,
        models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
        needsBaseUrl: false,
        description: "Usa la API oficial de Anthropic para los modelos Claude."
    },
  }

  const currentProvider = providerDetails[localConfig.provider];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#122024] border border-[#15333B] rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Configuración del Proveedor de IA</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-1">Proveedor</label>
            <select
              id="provider"
              name="provider"
              value={localConfig.provider}
              onChange={handleProviderChange}
              className="w-full px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md text-sm outline-none focus:ring-1 focus:ring-[#B858FE]"
            >
              <option value={AIProvider.GEMINI}>{providerDetails.gemini.name}</option>
              <option value={AIProvider.OPENAI}>{providerDetails.openai.name}</option>
              <option value={AIProvider.ANTHROPIC}>{providerDetails.anthropic.name}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{currentProvider.description}</p>
          </div>

          {currentProvider.needsKey && (
             <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">Clave de API</label>
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  value={localConfig.apiKey}
                  onChange={handleChange}
                  placeholder="Ingresa tu Clave de API"
                  className="w-full px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md text-sm outline-none focus:ring-1 focus:ring-[#B858FE]"
                />
            </div>
          )}

           <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">Nombre del Modelo</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={localConfig.model}
                  onChange={handleChange}
                  placeholder="e.g., gpt-4o"
                  className="w-full px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md text-sm outline-none focus:ring-1 focus:ring-[#B858FE]"
                />
            </div>
          
           {currentProvider.needsBaseUrl && (
             <div>
                <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-300 mb-1">URL Base (Opcional)</label>
                <input
                  type="text"
                  id="baseUrl"
                  name="baseUrl"
                  value={localConfig.baseUrl}
                  onChange={handleChange}
                  placeholder="e.g., http://localhost:11434/v1"
                  className="w-full px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md text-sm outline-none focus:ring-1 focus:ring-[#B858FE]"
                />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="px-5 py-2 bg-[#B858FE] text-black font-bold rounded-md hover:bg-[#a048e0] text-sm">
                Guardar y Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;