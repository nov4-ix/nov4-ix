export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface FileTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
}

export interface Repository {
  id: string;
  name: string;
  owner: { login: string };
  description: string | null;
  private: boolean;
  updatedAt: string;
  language: string | null;
  defaultBranch: string;
  fileTree: FileTreeItem[];
}

export interface OpenFile {
  path: string;
  content: string;
  sha: string;
  isDirty?: boolean; // For future use
}

export enum AIProvider {
    GEMINI = 'gemini',
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
}

export type AIConfig = {
    provider: AIProvider;
    apiKey: string;
    model: string;
    baseUrl?: string; // For OpenAI-compatible endpoints like Ollama
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
    suggestion?: string | null; // The code suggestion from the AI
    fileContent?: string | null; // The original file content for diffing
    isLoading?: boolean;
    error?: string;
}

export enum Platform {
  VERCEL = 'Vercel',
  RAILWAY = 'Railway',
  NETLIFY = 'Netlify'
}

export type DeploymentConfig = {
    repo: Repository;
    envVars: { key: string; value: string }[];
    platform: Platform;
}

export interface ProjectAnalysisFinding {
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'suggestion';
  description: string;
  suggestion: string;
}

export interface RepoCleanupSuggestion {
  path: string;
  reason: string;
}
