import React, { useState, useCallback, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useApp } from '../hooks/useApp';
import { useAIChat } from '../hooks/useAIChat';

interface MarkdownEditorProps {
  onSave?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ onSave }) => {
  const { editorState, setEditorState } = useApp();
  const { sendSelectedText } = useAIChat();
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  const handleChange = useCallback(
    (value?: string) => {
      setEditorState(prev => ({
        ...prev,
        content: value || '',
        isDirty: (value || '') !== prev.originalContent,
      }));
    },
    [setEditorState]
  );

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  const toggleMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString();
      setSelectedText(text);
    } else {
      setSelectedText(null);
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Handle text selection
  useEffect(() => {
    // Add a small delay to ensure the selection is complete
    const handleSelectionWithDelay = () => {
      setTimeout(handleTextSelection, 10);
    };
    
    document.addEventListener('mouseup', handleSelectionWithDelay);
    document.addEventListener('keyup', handleSelectionWithDelay);
    
    return () => {
      document.removeEventListener('mouseup', handleSelectionWithDelay);
      document.removeEventListener('keyup', handleSelectionWithDelay);
    };
  }, [handleTextSelection]);

  const handleSendToChat = useCallback((text: string) => {
    sendSelectedText(text);
    // Clear selection after sending
    setSelectedText(null);
  }, [sendSelectedText]);

  if (!editorState.currentFile) {
    return (
      <div className="editor-empty">
        <p>Select a file from the file browser to start editing</p>
      </div>
    );
  }

  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <div className="editor-file-info">
          <span className="file-name">{editorState.currentFile.name}</span>
          {editorState.isDirty && <span className="dirty-indicator">•</span>}
        </div>
        <div className="editor-actions">
          {selectedText && (
            <button
              className="send-selection-button"
              onClick={() => handleSendToChat(selectedText)}
              title="Send selected text to AI chat"
            >
              💬 Send Selection to Chat
            </button>
          )}
          <button
            className="mode-toggle"
            onClick={toggleMode}
            title={isEditMode ? 'Switch to Preview' : 'Switch to Edit'}
          >
            {isEditMode ? '👁️ Preview' : '✏️ Edit'}
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!editorState.isDirty || editorState.isLoading}
            title="Save (Ctrl+S)"
          >
            {editorState.isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="editor-content">
        {isEditMode ? (
          <MDEditor
            value={editorState.content}
            onChange={handleChange}
            preview="edit"
            height={600}
            data-color-mode="light"
          />
        ) : (
          <div className="markdown-preview-wrapper">
            <MDEditor.Markdown
              source={editorState.content}
              style={{ padding: 20, backgroundColor: '#fff' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};