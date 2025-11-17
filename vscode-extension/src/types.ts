// These types are mirrored from the main application's types.ts
// to avoid breaking the vscode-extension's rootDir constraint.

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
