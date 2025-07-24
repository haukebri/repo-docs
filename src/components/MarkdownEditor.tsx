import React, { useState, useCallback, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useApp } from '../hooks/useApp';

interface MarkdownEditorProps {
  onSave?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ onSave }) => {
  const { editorState, setEditorState } = useApp();
  const [isEditMode, setIsEditMode] = useState(true);

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