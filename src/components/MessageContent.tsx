import React from 'react';

interface MessageContentProps {
  content: string;
}

interface ContentSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  // Parse content into segments of text and code blocks
  const parseContent = (text: string): ContentSegment[] => {
    const segments: ContentSegment[] = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add code block
      segments.push({
        type: 'code',
        content: match[2].trim(),
        language: match[1] || 'plaintext'
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return segments;
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const segments = parseContent(content);

  return (
    <div className="message-content">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <span key={index} className="message-text">
              {segment.content}
            </span>
          );
        } else {
          return (
            <div key={index} className="code-block">
              <div className="code-block-header">
                <span className="code-language">{segment.language}</span>
                <button
                  className="code-copy-btn"
                  onClick={() => handleCopyCode(segment.content)}
                  title="Copy code"
                >
                  Copy
                </button>
              </div>
              <pre className="code-block-content">
                <code>{segment.content}</code>
              </pre>
            </div>
          );
        }
      })}
    </div>
  );
};