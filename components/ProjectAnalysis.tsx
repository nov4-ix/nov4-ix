import React, { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js';
import { ProjectAnalysisFinding } from '../types';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { InfoIcon } from './icons/InfoIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import Spinner from './Spinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

type AnalyzedFinding = ProjectAnalysisFinding & { status: 'pending' | 'applying' | 'applied' | 'ignored' };

interface ProjectAnalysisProps {
    findings: AnalyzedFinding[];
    onOpenFile: (path: string) => void;
    onDismiss: () => void;
    onApplySuggestion: (findingIndex: number, userPrompt: string) => void;
    onIgnoreSuggestion: (findingIndex: number) => void;
}

const severityConfig = {
    error: {
        Icon: ExclamationTriangleIcon,
        color: 'text-red-400',
        bgColor: 'bg-red-900/40',
        borderColor: 'border-red-500/50',
        title: 'Error'
    },
    warning: {
        Icon: ExclamationTriangleIcon,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/40',
        borderColor: 'border-yellow-500/50',
        title: 'Advertencia'
    },
    suggestion: {
        Icon: SparklesIcon,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-900/40',
        borderColor: 'border-cyan-500/50',
        title: 'Sugerencia'
    }
}

const Suggestion: React.FC<{ text: string }> = ({ text }) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    const parts = text.split(codeBlockRegex);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [text]);

    return (
        <div ref={contentRef} className="text-sm text-gray-300 space-y-2">
            {parts.map((part, index) => {
                if (index % 3 === 2) { // This is the code block content
                    const lang = parts[index - 1] || 'plaintext';
                    return (
                        <pre key={index} className="bg-[#0e141a] rounded-md p-3 overflow-x-auto">
                            <code className={`language-${lang}`}>{part.trim()}</code>
                        </pre>
                    );
                }
                if (index % 3 === 0 && part.trim()) { // This is the regular text
                    return <p key={index} className="whitespace-pre-wrap">{part.trim()}</p>;
                }
                return null;
            })}
        </div>
    );
};


const ProjectAnalysis: React.FC<ProjectAnalysisProps> = ({ findings, onOpenFile, onDismiss, onApplySuggestion, onIgnoreSuggestion }) => {
    const [prompts, setPrompts] = useState<Record<number, string>>({});
    
    const handlePromptChange = (index: number, value: string) => {
        setPrompts(prev => ({ ...prev, [index]: value }));
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#171925]">
            <div className="p-4 border-b border-[#15333B]">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Informe de Análisis del Proyecto</h2>
                    <button onClick={onDismiss} className="flex items-center text-sm text-[#40FDAE] hover:text-[#35e09b]">
                        <BackArrowIcon className="h-4 w-4 mr-1"/>
                        Volver al Editor
                    </button>
                </div>
                <p className="text-gray-400 text-sm">Se encontraron {findings.length} problemas o sugerencias.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {findings.length === 0 ? (
                     <div className="text-center text-gray-500 py-12">
                         <InfoIcon className="h-12 w-12 mx-auto mb-2 text-green-500"/>
                         <h3 className="text-lg font-semibold text-gray-300">¡Buen trabajo!</h3>
                         <p>El análisis automático no encontró problemas evidentes en los archivos clave.</p>
                     </div>
                ) : (
                    findings.map((finding, index) => {
                        const config = severityConfig[finding.severity];
                        const isProcessed = finding.status === 'applied' || finding.status === 'ignored';

                        return (
                            <div key={index} className={`border ${config.borderColor} ${config.bgColor} rounded-lg transition-opacity ${isProcessed ? 'opacity-50' : ''}`}>
                                <div className="p-4 border-b border-white/10">
                                    <div className="flex items-center text-lg font-semibold">
                                        <config.Icon className={`h-6 w-6 mr-3 ${config.color}`} />
                                        <span className={config.color}>{config.title}:</span>
                                        <span className="ml-2 text-gray-200 truncate">{finding.description}</span>
                                    </div>
                                    <div className="mt-2 text-xs">
                                        <button onClick={() => onOpenFile(finding.file)} className="font-mono bg-[#15333B] px-2 py-1 rounded hover:bg-[#B858FE]/20 hover:text-[#BCAACD]">
                                           📍 {finding.file}{finding.line ? `:${finding.line}` : ''}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-semibold text-gray-400 mb-2">Sugerencia de la IA:</h4>
                                    <Suggestion text={finding.suggestion} />
                                </div>
                                
                                {finding.status === 'pending' && (
                                    <div className="p-4 bg-black/20 rounded-b-lg border-t border-white/10">
                                        <textarea
                                            value={prompts[index] || ''}
                                            onChange={(e) => handlePromptChange(index, e.target.value)}
                                            placeholder="Refina o añade detalles a la sugerencia aquí... (opcional)"
                                            className="w-full px-3 py-2 bg-[#171925] border border-[#15333B] rounded-md text-sm outline-none focus:ring-1 focus:ring-[#B858FE] resize-y"
                                            rows={2}
                                        />
                                        <div className="flex justify-end space-x-2 mt-2">
                                            <button onClick={() => onIgnoreSuggestion(index)} className="flex items-center px-3 py-1.5 text-xs font-semibold text-gray-300 bg-[#15333B]/70 hover:bg-[#15333B] rounded-md transition-colors">
                                                <XCircleIcon className="h-4 w-4 mr-1.5"/> Ignorar
                                            </button>
                                            <button onClick={() => onApplySuggestion(index, prompts[index] || '')} className="flex items-center px-3 py-1.5 text-xs font-bold text-black bg-[#40FDAE] hover:bg-[#35e09b] rounded-md transition-colors">
                                                <CheckIcon className="h-4 w-4 mr-1.5"/> Aplicar Sugerencia
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {finding.status === 'applying' && (
                                    <div className="p-4 flex items-center justify-center text-sm text-gray-400 bg-black/20 rounded-b-lg border-t border-white/10">
                                        <Spinner size="sm" />
                                        <span className="ml-2">Aplicando cambios...</span>
                                    </div>
                                )}
                                {finding.status === 'applied' && (
                                    <div className="p-3 flex items-center justify-center text-sm text-green-400 bg-green-900/30 rounded-b-lg border-t border-green-500/30">
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        <span>Cambios aplicados con éxito.</span>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}

export default ProjectAnalysis;