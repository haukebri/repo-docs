import React, { useEffect, useRef } from 'react';
import { useAIChat } from '../hooks/useAIChat';

export const AIChatPanel: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    input,
    setInput,
    sendMessage,
    clearChat,
    copyToClipboard,
    hasApiKey
  } = useAIChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    }
  };

  if (!hasApiKey) {
    return (
      <div className="ai-chat-panel">
        <h2>AI Assistant</h2>
        <div className="ai-chat-disabled">
          <p>OpenAI API key is required to use the AI assistant.</p>
          <p>Please add your API key in the authentication screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-header">
        <h2>AI Assistant</h2>
        {messages.length > 0 && (
          <button 
            className="clear-chat-btn"
            onClick={clearChat}
            title="Clear chat"
          >
            Clear
          </button>
        )}
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <p>Ask me anything about your markdown file!</p>
            <p className="ai-chat-hint">
              I can help you improve writing, fix grammar, 
              summarize content, or answer questions.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`ai-message ai-message-${message.role}`}
              >
                <div className="ai-message-role">
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="ai-message-content">
                  {message.content}
                  {message.role === 'assistant' && message.content && (
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(message.content)}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-role">AI</div>
                <div className="ai-message-content">
                  <span className="loading-dots">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="ai-chat-error">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="ai-chat-input-form">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or request help..."
          className="ai-chat-input"
          rows={3}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="ai-chat-send-btn"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};