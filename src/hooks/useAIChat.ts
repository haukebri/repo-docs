import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from './useApp';
import { OpenAIService } from '../services/openai.service';
import { GitHubService } from '../services/github.service';
import type { AIMessage, FileNode } from '../types/app.types';

export const useAIChat = () => {
  const { config, aiChat, setAiChat, editorState, setEditorState, currentRepo } = useApp();
  const [input, setInput] = useState('');
  const openAIServiceRef = useRef<OpenAIService | null>(null);
  const [githubService, setGithubService] = useState<GitHubService | null>(null);

  // Initialize services when API keys are available
  useEffect(() => {
    if (config?.openaiApiKey && !openAIServiceRef.current) {
      openAIServiceRef.current = new OpenAIService(
        config.openaiApiKey,
        config.openaiModel || 'gpt-4.1-nano'
      );
    }
    
    if (config?.githubToken) {
      setGithubService(new GitHubService(config.githubToken));
    }
  }, [config?.openaiApiKey, config?.githubToken, config?.openaiModel]);

  const sendMessage = useCallback(async (message: string) => {
    if (!openAIServiceRef.current || !message.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Add user message and set loading state
    setAiChat(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: undefined
    }));

    const assistantMessage: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    // Add empty assistant message that will be streamed into
    setAiChat(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage]
    }));

    try {
      // Fetch content for all context files
      const contextFileContents: Array<{name: string, content: string}> = [];
      
      // Add current file if it exists
      if (editorState.currentFile && editorState.content) {
        contextFileContents.push({
          name: editorState.currentFile.name,
          content: editorState.content
        });
      }
      
      // Fetch content for additional context files
      if (githubService && currentRepo && aiChat.contextFiles.length > 0) {
        for (const file of aiChat.contextFiles) {
          // Skip if it's the current file (already added)
          if (file.path === editorState.currentFile?.path) continue;
          
          try {
            const content = await githubService.getFileContent(currentRepo, file.path);
            contextFileContents.push({
              name: file.name,
              content
            });
          } catch (error) {
            console.error(`Failed to fetch content for ${file.name}:`, error);
          }
        }
      }
      
      // Create messages with all context files
      const messages = openAIServiceRef.current.createContextMessages(
        message,
        contextFileContents
      );

      // Stream the response
      const stream = openAIServiceRef.current.streamChatCompletion(
        messages,
        (error) => {
          setAiChat(prev => ({
            ...prev,
            isLoading: false,
            error: error.message
          }));
        }
      );

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        // Update the assistant message content
        setAiChat(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: fullContent }
              : msg
          )
        }));
      }

      // Set loading to false when done
      setAiChat(prev => ({
        ...prev,
        isLoading: false
      }));
    } catch (error) {
      setAiChat(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    }
  }, [editorState.content, editorState.currentFile, aiChat.contextFiles, githubService, currentRepo, setAiChat]);

  const clearChat = useCallback(() => {
    setAiChat(prev => ({
      ...prev,
      messages: [],
      isLoading: false,
      error: undefined
    }));
  }, [setAiChat]);

  const removeFromContext = useCallback((file: FileNode) => {
    setAiChat(prev => ({
      ...prev,
      contextFiles: prev.contextFiles.filter(f => f.path !== file.path)
    }));
  }, [setAiChat]);

  const clearContextFiles = useCallback(() => {
    setAiChat(prev => ({
      ...prev,
      contextFiles: []
    }));
  }, [setAiChat]);

  const sendSelectedText = useCallback(async (selectedText: string) => {
    const message = `About this selected text:\n> ${selectedText}\n\nWhat would you like me to help with?`;
    await sendMessage(message);
  }, [sendMessage]);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const applyToDocument = useCallback(async () => {
    if (!openAIServiceRef.current || aiChat.messages.length === 0) return false;

    // Convert our AIMessage format to ChatCompletionMessageParam format
    const chatHistory = aiChat.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    setAiChat(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await openAIServiceRef.current.analyzeDocumentUpdate(
        chatHistory,
        editorState.content
      );

      if (!result) {
        setAiChat(prev => ({
          ...prev,
          isLoading: false,
          error: 'Could not identify which section to update. Please be more specific about what changes you want.'
        }));
        return false;
      }

      // Apply the update to the document
      const updatedContent = editorState.content.replace(
        result.oldContent,
        result.newContent
      );

      if (updatedContent === editorState.content) {
        setAiChat(prev => ({
          ...prev,
          isLoading: false,
          error: 'Could not find the specified content in the document. The document may have changed.'
        }));
        return false;
      }

      setEditorState(prev => ({
        ...prev,
        content: updatedContent,
        isDirty: true
      }));

      setAiChat(prev => ({ ...prev, isLoading: false, error: undefined }));
      return true;
    } catch (error) {
      setAiChat(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to apply changes'
      }));
      return false;
    }
  }, [aiChat.messages, editorState.content, setAiChat, setEditorState]);

  return {
    messages: aiChat.messages,
    isLoading: aiChat.isLoading,
    error: aiChat.error,
    input,
    setInput,
    sendMessage,
    clearChat,
    copyToClipboard,
    applyToDocument,
    hasApiKey: !!config?.openaiApiKey,
    contextFiles: aiChat.contextFiles,
    removeFromContext,
    clearContextFiles,
    sendSelectedText
  };
};