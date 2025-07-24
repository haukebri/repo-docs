import React from 'react';

interface SelectionPopupProps {
  selectedText: string;
  position: { x: number; y: number };
  onSendToChat: (text: string) => void;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({ 
  selectedText, 
  position, 
  onSendToChat 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSendToChat(selectedText);
  };

  return (
    <div 
      className="selection-popup"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
        zIndex: 1000
      }}
    >
      <button 
        className="selection-popup-button"
        onClick={handleClick}
        title="Send selected text to AI chat"
      >
        💬 Send to Chat
      </button>
    </div>
  );
};