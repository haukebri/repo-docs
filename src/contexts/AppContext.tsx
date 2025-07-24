import React, { useState } from 'react';
import type { ReactNode } from 'react';
import type { AppConfig, EditorState, AIChat, GitHubRepo } from '../types/app.types';
import { AppContext } from './AppContextDef';
import type { FileBrowserState } from './AppContextDef';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
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

