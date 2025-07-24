export interface AppConfig {
  githubToken: string;
  repoUrl: string;
  openaiApiKey: string;
  openaiModel?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  sha?: string;
  size?: number;
  children?: FileNode[];
}

export interface EditorState {
  content: string;
  originalContent: string;
  isDirty: boolean;
  isLoading?: boolean;
  lastSaved?: Date;
  currentFile?: FileNode;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
  branch?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIChat {
  messages: AIMessage[];
  isLoading: boolean;
  error?: string;
  contextFiles: FileNode[];
}