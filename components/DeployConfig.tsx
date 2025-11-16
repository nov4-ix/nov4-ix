import React, { useState, useEffect, useRef } from 'react';
import { Repository, Platform, DeploymentConfig } from '../types';
import { VercelIcon } from './icons/VercelIcon';
import { RailwayIcon } from './icons/RailwayIcon';
import { NetlifyIcon } from './icons/NetlifyIcon';
import { BackArrowIcon } from './icons/BackArrowIcon';
import Button from './Button';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { UploadIcon } from './icons/UploadIcon';

interface DeployConfigProps {
  repo: Repository;
  onProceed: (config: DeploymentConfig) => void;
  onBack: () => void;
}

const DeployConfig: React.FC<DeployConfigProps> = ({ repo, onProceed, onBack }) => {
  const [platform, setPlatform] = useState<Platform>(Platform.VERCEL);
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [showEnvValues, setShowEnvValues] = useState<Record<number, boolean>>({});
  const envVarsContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Basic detection logic, can be improved
    const paths = repo.fileTree.map(f => f.path.toLowerCase());
    const isBackend = paths.some(p => 
      p.endsWith('requirements.txt') || p.endsWith('pom.xml') || p.endsWith('go.mod')
    );
    if(isBackend) {
        setPlatform(Platform.RAILWAY);
    } else {
        setPlatform(Platform.VERCEL);
    }
  }, [repo]);

  useEffect(() => {
    if (envVarsContainerRef.current) {
      const inputs = envVarsContainerRef.current.querySelectorAll<HTMLInputElement>('input[placeholder="KEY"]');
      if (inputs.length > 0) {
        const lastInput = inputs[inputs.length - 1];
        if (lastInput && envVars[envVars.length - 1]?.key === '' && envVars[envVars.length - 1]?.value === '') {
          lastInput.focus();
        }
      }
    }
  }, [envVars.length]);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('text/') || file.name.endsWith('.env') || file.name.endsWith('.md')) {
              const reader = new FileReader();
              reader.onload = (event) => {
                  const content = event.target?.result as string;
                  if (!content) return;

                  const lines = content.split(/\r?\n/);
                  const parsedVars = lines
                      .map(line => {
                          const trimmedLine = line.trim();
                          if (trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
                              return null;
                          }
                          const separatorIndex = trimmedLine.indexOf('=');
                          const key = trimmedLine.substring(0, separatorIndex).trim();
                          let value = trimmedLine.substring(separatorIndex + 1).trim();

                          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                              value = value.slice(1, -1);
                          }

                          if (!key) return null;

                          return { key, value };
                      })
                      .filter((v): v is { key: string; value: string } => v !== null);

                  const existingManualVars = envVars.filter(v => v.key.trim() !== '');
                  const droppedVarKeys = new Set(parsedVars.map(v => v.key));

                  const mergedVars = [
                      ...parsedVars,
                      ...existingManualVars.filter(v => !droppedVarKeys.has(v.key))
                  ];
                  
                  if (mergedVars.length === 0) {
                      setEnvVars([{ key: '', value: '' }]);
                  } else {
                      setEnvVars(mergedVars);
                  }
              };
              reader.readAsText(file);
          }
          e.dataTransfer.clearData();
      }
  };


  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };
    
  const handleRemoveEnvVar = (index: number) => {
    const newEnvVars = envVars.filter((_, i) => i !== index);
    if (newEnvVars.length === 0) {
        setEnvVars([{ key: '', value: '' }]);
    } else {
        setEnvVars(newEnvVars);
    }
  };
  
  const toggleShowEnvValue = (index: number) => {
    setShowEnvValues(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleProceedClick = () => {
    if (!platform) return;
    const filteredEnvVars = envVars.filter(v => v.key.trim() !== '');
    onProceed({ repo, envVars: filteredEnvVars, platform });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center text-sm text-[#40FDAE] hover:text-[#35e09b] mb-4">
        <BackArrowIcon className="h-4 w-4 mr-1"/>
        Volver al Asistente de Código
      </button>

      <h2 className="text-3xl font-bold mb-2">Desplegar: {repo.name}</h2>
      <p className="text-gray-400 mb-6">Configura los ajustes de tu despliegue.</p>

      <div className="space-y-6 bg-[#122024]/50 border border-[#15333B] rounded-lg p-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Detalles del Proyecto</h3>
          <div className="text-sm space-y-1 text-gray-300">
            <p><span className="font-medium text-gray-400">Repositorio:</span> {repo.owner.login}/{repo.name}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Plataforma de Despliegue</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setPlatform(Platform.VERCEL)}
                    className={`p-4 border rounded-lg flex items-center justify-center transition-colors ${platform === Platform.VERCEL ? 'bg-[#B858FE]/20 border-[#B858FE]' : 'bg-[#171925] border-[#15333B] hover:border-[#40FDAE]'}`}
                >
                    <VercelIcon className="h-6 w-6 mr-2" /> Vercel
                </button>
                 <button
                    onClick={() => setPlatform(Platform.NETLIFY)}
                    className={`p-4 border rounded-lg flex items-center justify-center transition-colors ${platform === Platform.NETLIFY ? 'bg-[#B858FE]/20 border-[#B858FE]' : 'bg-[#171925] border-[#15333B] hover:border-[#40FDAE]'}`}
                >
                    <NetlifyIcon className="h-6 w-6 mr-2" /> Netlify
                </button>
                <button
                    onClick={() => setPlatform(Platform.RAILWAY)}
                    className={`p-4 border rounded-lg flex items-center justify-center transition-colors ${platform === Platform.RAILWAY ? 'bg-[#B858FE]/20 border-[#B858FE]' : 'bg-[#171925] border-[#15333B] hover:border-[#40FDAE]'}`}
                >
                    <RailwayIcon className="h-6 w-6 mr-2" /> Railway
                </button>
            </div>
        </div>

        <div
          className="relative border-2 border-dashed border-[#15333B] rounded-lg p-4 transition-colors"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 bg-[#171925]/80 border-2 border-dashed border-[#B858FE] rounded-lg flex flex-col items-center justify-center pointer-events-none z-10">
                    <UploadIcon className="h-10 w-10 text-[#B858FE] mb-2"/>
                    <p className="text-[#B858FE] font-semibold">Suelta tu archivo (.env, .txt)</p>
                </div>
            )}
          <h3 className="text-lg font-semibold mb-3">Variables de Entorno</h3>
           <p className="text-xs text-gray-500 -mt-2 mb-4">Añade claves manualmente o arrastra y suelta un archivo <code>.env</code> aquí. Estas se configurarán en la plataforma de despliegue.</p>

          <div ref={envVarsContainerRef} className="space-y-2">
            {envVars.map((env, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="KEY"
                  value={env.key}
                  onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md font-mono text-sm outline-none focus:ring-1 focus:ring-[#B858FE]"
                />
                <div className="flex-1 relative">
                    <input
                      type={showEnvValues[index] ? 'text' : 'password'}
                      placeholder="VALUE"
                      value={env.value}
                      onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md font-mono text-sm outline-none focus:ring-1 focus:ring-[#B858FE] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowEnvValue(index)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                      aria-label={showEnvValues[index] ? 'Hide value' : 'Show value'}
                    >
                      {showEnvValues[index] ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                </div>
                {envVars.length > 1 || env.key ? (
                    <button onClick={() => handleRemoveEnvVar(index)} className="text-gray-500 hover:text-red-400 p-1" aria-label="Remove variable">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    </button>
                ) : <div className="w-7 h-7"></div>}
              </div>
            ))}
          </div>
          <button onClick={handleAddEnvVar} className="text-sm text-[#40FDAE] hover:text-[#35e09b] mt-3">
            + Añadir Variable
          </button>
        </div>

        <div className="pt-4 border-t border-[#15333B]">
          <Button onClick={handleProceedClick} disabled={!platform || envVars.some(v => v.key.trim() === '' && v.value.trim() !== '')} fullWidth>
            Proceder a Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeployConfig;