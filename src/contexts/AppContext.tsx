import React, { useState } from 'react';
import type { ReactNode } from 'react';
import type { AppConfig, EditorState, AIChat, GitHubRepo } from '../types/app.types';
import { AppContext } from './AppContextDef';
import type { FileBrowserState } from './AppContextDef';

// Check for development environment variables
const getInitialConfig = (): AppConfig | null => {
  if (
    import.meta.env.VITE_GITHUB_TOKEN &&
    import.meta.env.VITE_GITHUB_REPO_URL &&
    import.meta.env.VITE_OPENAI_API_KEY
  ) {
    console.log('Loading credentials from environment variables');
    return {
      githubToken: import.meta.env.VITE_GITHUB_TOKEN,
      repoUrl: import.meta.env.VITE_GITHUB_REPO_URL,
      openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
      openaiModel: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4-turbo-preview',
    };
  }
  return null;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(getInitialConfig());
  const [editorState, setEditorState] = useState<EditorState>({
    content: '',
    originalContent: '',
    isDirty: false,
  });
  const [aiChat, setAiChat] = useState<AIChat>({
    messages: [],
    isLoading: false,
  });
  const [fileBrowser, setFileBrowser] = useState<FileBrowserState>({
    files: [],
    isLoading: false,
    error: null,
    selectedFile: null,
  });
  const [currentRepo, setCurrentRepo] = useState<GitHubRepo | null>(null);

  const isAuthenticated = Boolean(config?.githubToken && config?.repoUrl);

  return (
    <AppContext.Provider
      value={{
        config,
        setConfig,
        editorState,
        setEditorState,
        aiChat,
        setAiChat,
        isAuthenticated,
        fileBrowser,
        setFileBrowser,
        currentRepo,
        setCurrentRepo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

