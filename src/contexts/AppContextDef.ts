import { createContext } from 'react';
import type { AppConfig, EditorState, AIChat, FileNode, GitHubRepo } from '../types/app.types';

export interface FileBrowserState {
  files: FileNode[];
  isLoading: boolean;
  error: string | null;
  selectedFile: FileNode | null;
}

export interface AppContextType {
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
  aiChat: AIChat;
  setAiChat: (chat: AIChat) => void;
  isAuthenticated: boolean;
  fileBrowser: FileBrowserState;
  setFileBrowser: (state: FileBrowserState) => void;
  currentRepo: GitHubRepo | null;
  setCurrentRepo: (repo: GitHubRepo | null) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);