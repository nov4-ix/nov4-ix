import React, { useState, useEffect } from 'react';
import { RepoCleanupSuggestion } from '../types';
import Button from './Button';
import { TrashIcon } from './icons/TrashIcon';
import { InfoIcon } from './icons/InfoIcon';

interface RepoCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: RepoCleanupSuggestion[];
  onConfirm: (filesToDelete: string[]) => void;
  isDeleting: boolean;
}

const RepoCleanupModal: React.FC<RepoCleanupModalProps> = ({ isOpen, onClose, suggestions, onConfirm, isDeleting }) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Pre-select all suggestions when the modal opens
      setSelectedFiles(new Set(suggestions.map(s => s.path)));
    }
  }, [isOpen, suggestions]);

  if (!isOpen) return null;

  const handleToggleFile = (path: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  const handleToggleAll = () => {
    if (selectedFiles.size === suggestions.length) {
        setSelectedFiles(new Set());
    } else {
        setSelectedFiles(new Set(suggestions.map(s => s.path)));
    }
  }

  const handleConfirmClick = () => {
    onConfirm(Array.from(selectedFiles));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#122024] border border-[#15333B] rounded-lg shadow-xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#15333B]">
          <h2 className="text-xl font-bold">Sugerencias de Depuración</h2>
          <p className="text-sm text-gray-400 mt-1">
            La IA ha identificado archivos que podrían ser innecesarios. Revisa y selecciona los que deseas eliminar permanentemente.
          </p>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto max-h-[50vh]">
          {suggestions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
                <InfoIcon className="h-10 w-10 mx-auto text-green-500 mb-2"/>
                <p>No se encontraron archivos innecesarios.</p>
            </div>
          ) : (
            <div className="space-y-3">
                <div className="flex items-center pb-2 border-b border-[#15333B]">
                     <input
                        type="checkbox"
                        checked={selectedFiles.size === suggestions.length}
                        onChange={handleToggleAll}
                        className="h-4 w-4 rounded border-[#15333B] bg-[#171925] text-[#B858FE] focus:ring-[#B858FE] cursor-pointer"
                      />
                      <label onClick={handleToggleAll} className="ml-2 text-sm font-semibold text-gray-300 cursor-pointer">
                        {selectedFiles.size === suggestions.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                      </label>
                </div>
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start p-2 rounded-md hover:bg-[#171925]/50">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(suggestion.path)}
                    onChange={() => handleToggleFile(suggestion.path)}
                    className="h-4 w-4 rounded border-[#15333B] bg-[#122024] text-[#B858FE] focus:ring-[#B858FE] mt-1 cursor-pointer"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-mono text-sm text-white">{suggestion.path}</p>
                    <p className="text-xs text-gray-500">{suggestion.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-[#171925]/50 border-t border-[#15333B] flex justify-end items-center space-x-3">
          <Button onClick={onClose} variant="secondary" disabled={isDeleting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmClick} 
            isLoading={isDeleting} 
            disabled={isDeleting || selectedFiles.size === 0}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Eliminar {selectedFiles.size} Archivo(s)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RepoCleanupModal;
