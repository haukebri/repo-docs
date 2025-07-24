import React from 'react';
import { FileBrowser } from './FileBrowser';
import { MarkdownEditor } from './MarkdownEditor';
import { useFileLoader } from '../hooks/useFileLoader';

export const EditorLayout: React.FC = () => {
  const { saveFile } = useFileLoader();

  return (
    <div className="editor-layout">
      <div className="sidebar">
        <FileBrowser />
      </div>
      <div className="editor-panel">
        <MarkdownEditor onSave={saveFile} />
      </div>
      <div className="ai-panel">
        <h2>AI Assistant</h2>
        {/* AI chat will go here */}
      </div>
    </div>
  );
};