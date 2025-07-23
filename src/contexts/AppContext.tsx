import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppConfig, EditorState, AIChat } from '../types/app.types';

interface AppContextType {
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
  aiChat: AIChat;
  setAiChat: (chat: AIChat) => void;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};