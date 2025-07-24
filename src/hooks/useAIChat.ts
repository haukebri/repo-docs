import { useState, useCallback, useRef } from 'react';
import { useApp } from './useApp';
import { OpenAIService } from '../services/openai.service';
import type { AIMessage } from '../types/app.types';

export const useAIChat = () => {
  const { config, aiChat, setAiChat, editorState } = useApp();
  const [input, setInput] = useState('');
  const openAIServiceRef = useRef<OpenAIService | null>(null);

  // Initialize OpenAI service when API key is available
  if (config?.openaiApiKey && !openAIServiceRef.current) {
    openAIServiceRef.current = new OpenAIService(
      config.openaiApiKey,
      config.openaiModel || 'gpt-4.1-nano'
    );
  }

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
      // Create messages with context
      const messages = openAIServiceRef.current.createContextMessages(
        message,
        editorState.content,
        editorState.currentFile?.name
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
  }, [editorState.content, editorState.currentFile?.name, setAiChat]);

  const clearChat = useCallback(() => {
    setAiChat({
      messages: [],
      isLoading: false,
      error: undefined
    });
  }, [setAiChat]);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  return {
    messages: aiChat.messages,
    isLoading: aiChat.isLoading,
    error: aiChat.error,
    input,
    setInput,
    sendMessage,
    clearChat,
    copyToClipboard,
    hasApiKey: !!config?.openaiApiKey
  };
};