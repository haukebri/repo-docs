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
  setConfig: React.Dispatch<React.SetStateAction<AppConfig | null>>;
  editorState: EditorState;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;
  aiChat: AIChat;
  setAiChat: React.Dispatch<React.SetStateAction<AIChat>>;
  isAuthenticated: boolean;
  fileBrowser: FileBrowserState;
  setFileBrowser: React.Dispatch<React.SetStateAction<FileBrowserState>>;
  currentRepo: GitHubRepo | null;
  setCurrentRepo: React.Dispatch<React.SetStateAction<GitHubRepo | null>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);