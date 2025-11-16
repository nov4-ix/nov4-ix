import { vscodeApi } from './vscodeApi';
import { AIConfig, ProjectAnalysisFinding, RepoCleanupSuggestion } from '../types';

// These interfaces are simplified versions of params from ai.ts for serialization
// as AbortSignal cannot be passed via postMessage.
interface VscodeGenerateCodeParams {
    config: AIConfig;
    fileContent: string;
    userInstruction: string;
    fileName: string;
    fullFileTree: string;
    aiRules: string;
}

interface VscodeGenerateProjectAnalysisParams {
    config: AIConfig;
    fileTree: string;
    filesContent: { path: string; content: string }[];
}

interface VscodeApplyAnalysisSuggestionParams {
    config: AIConfig;
    fileContent: string;
    finding: ProjectAnalysisFinding;
    userRefinement: string;
}

interface VscodeGenerateRepoCleanupParams {
    config: AIConfig;
    fileTree: string;
}


export const generateCodeSuggestion = (params: VscodeGenerateCodeParams): Promise<string> => {
    return vscodeApi.request('gemini:generateCodeSuggestion', params);
};

export const generateProjectAnalysis = (params: VscodeGenerateProjectAnalysisParams): Promise<ProjectAnalysisFinding[]> => {
    return vscodeApi.request('gemini:generateProjectAnalysis', params);
};

export const applyProjectAnalysisSuggestion = (params: VscodeApplyAnalysisSuggestionParams): Promise<string> => {
    return vscodeApi.request('gemini:applyProjectAnalysisSuggestion', params);
};

export const generateRepoCleanupSuggestions = (params: VscodeGenerateRepoCleanupParams): Promise<RepoCleanupSuggestion[]> => {
    return vscodeApi.request('gemini:generateRepoCleanupSuggestions', params);
};
