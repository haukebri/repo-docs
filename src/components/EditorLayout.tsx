import React from 'react';

export const EditorLayout: React.FC = () => {
  return (
    <div className="editor-layout">
      <div className="sidebar">
        <h2>Files</h2>
        {/* File browser will go here */}
      </div>
      <div className="editor-panel">
        <h2>Editor</h2>
        {/* Markdown editor will go here */}
      </div>
      <div className="ai-panel">
        <h2>AI Assistant</h2>
        {/* AI chat will go here */}
      </div>
    </div>
  );
};