import React, { useState, useRef } from 'react';

// A simple local Markdown parser to display formatted text in the editor preview.
const parseMarkdown = (md) => {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Paragraphs & newlines
  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<block')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');

  return html;
};

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
  const textareaRef = useRef(null);

  const insertText = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || placeholder || '') + after;

    onChange(text.substring(0, start) + replacement + text.substring(end));
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || placeholder || '').length);
    }, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Editor Tabs and Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderBottom: 'none',
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
        padding: '0.5rem 1rem'
      }}>
        {/* Toggle Write / Preview */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
            onClick={() => setActiveTab('write')}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
          >
            Write
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
          >
            Preview
          </button>
        </div>

        {/* Text Styling tools */}
        {activeTab === 'write' && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertText('**', '**')}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertText('*', '*')}
              title="Italic"
              style={{ fontStyle: 'italic' }}
            >
              I
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertText('## ', '')}
              title="Header"
            >
              H2
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertText('> ', '')}
              title="Blockquote"
              style={{ fontFamily: 'serif' }}
            >
              ”
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write in Tamil or English... Use Markdown syntax or tools above.'}
          className="form-control"
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            minHeight: '200px',
            fontFamily: 'inherit'
          }}
        />
      ) : (
        <div
          className="reading-body"
          style={{
            border: '1px solid var(--border-color)',
            borderTop: 'none',
            borderBottomLeftRadius: '10px',
            borderBottomRightRadius: '10px',
            minHeight: '200px',
            padding: '1rem',
            backgroundColor: 'var(--bg-primary)',
            overflowY: 'auto'
          }}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
export { parseMarkdown };
