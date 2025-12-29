import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Calendar, CalendarClock } from 'lucide-react';
import { Todo } from '../types';

interface TaskDetailsModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ todo, isOpen, onClose, onUpdate }) => {
  const [description, setDescription] = useState('');
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const lastTodoIdRef = useRef<string | null>(null);

  // Convert description to HTML for display with inline images
  const descriptionToHtml = (desc: string, images: Record<string, string>) => {
    if (!desc) return '';
    let html = desc
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    html = html.replace(/!\[(.*?)\]\(image:([a-zA-Z0-9-]+)\)/g, (match, alt, id) => {
      const base64 = images[id];
      if (base64) {
        return `<img src="${base64}" alt="${alt}" class="inline-block max-w-full rounded-lg shadow-md my-2" style="max-height: 300px; object-fit: contain;" data-image-id="${id}" />`;
      }
      return match;
    });

    return html;
  };

  // Initialize editor content when todo changes (not on every description change)
  useEffect(() => {
    if (todo && todo.id !== lastTodoIdRef.current) {
      lastTodoIdRef.current = todo.id;
      setDescription(todo.description || '');
      setLocalImages(todo.images || {});
      setStartDate(todo.startDate || '');
      setDueDate(todo.dueDate || '');

      // Set editor HTML only when switching to a new todo
      if (editorRef.current) {
        editorRef.current.innerHTML = descriptionToHtml(todo.description || '', todo.images || {});
      }
    }
  }, [todo]);

  // Also set editor content after ref is available (on first render)
  useEffect(() => {
    if (editorRef.current && todo && lastTodoIdRef.current === todo.id) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml === '' && todo.description) {
        editorRef.current.innerHTML = descriptionToHtml(todo.description, todo.images || {});
      }
    }
  });

  if (!isOpen || !todo) return null;

  const handleBlur = () => {
    onUpdate(todo.id, { description, images: localImages });
  };

  const handleDateChange = (type: 'start' | 'due', value: string) => {
    if (type === 'start') {
      setStartDate(value);
      onUpdate(todo.id, { startDate: value || undefined });
    } else {
      setDueDate(value);
      onUpdate(todo.id, { dueDate: value || undefined });
    }
  };

  // Extract text content from editor, preserving image markdown
  const extractTextFromEditor = (element: HTMLElement): string => {
    let result = '';
    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'BR') {
          result += '\n';
        } else if (el.tagName === 'IMG') {
          const imageId = el.getAttribute('data-image-id');
          const alt = el.getAttribute('alt') || 'Pasted Image';
          if (imageId) {
            result += `![${alt}](image:${imageId})`;
          }
        } else if (el.tagName === 'DIV' || el.tagName === 'P') {
          // Handle div/p elements that browsers insert for line breaks
          const innerText = extractTextFromEditor(el);
          if (result && !result.endsWith('\n')) {
            result += '\n';
          }
          result += innerText;
        } else {
          result += extractTextFromEditor(el);
        }
      }
    });
    return result;
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const newDescription = extractTextFromEditor(editorRef.current);
      setDescription(newDescription);
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const imageId = crypto.randomUUID();

            // Insert image at cursor position
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();

              const img = document.createElement('img');
              img.src = base64;
              img.alt = 'Pasted Image';
              img.setAttribute('data-image-id', imageId);
              img.className = 'inline-block max-w-full rounded-lg shadow-md my-2';
              img.style.maxHeight = '300px';
              img.style.objectFit = 'contain';

              range.insertNode(img);
              range.setStartAfter(img);
              range.setEndAfter(img);
              selection.removeAllRanges();
              selection.addRange(range);
            }

            // Update state
            setLocalImages(prevImages => {
              const newImages = { ...prevImages, [imageId]: base64 };

              // Extract new description after image insertion
              setTimeout(() => {
                if (editorRef.current) {
                  const newDescription = extractTextFromEditor(editorRef.current);
                  setDescription(newDescription);
                  onUpdate(todo.id, { description: newDescription, images: newImages });
                }
              }, 0);

              return newImages;
            });
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
          <h2 className="text-lg font-bold text-gray-800 truncate pr-4">{todo.text}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar with Dates */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0 flex-wrap gap-2">
          {/* Date Inputs */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">开始:</span>
              <div className="relative flex items-center">
                <CalendarClock className="w-4 h-4 text-blue-400 absolute left-2 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="pl-8 pr-2 py-1.5 text-xs border rounded-lg text-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">截止:</span>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDateChange('due', e.target.value)}
                  className="pl-8 pr-2 py-1.5 text-xs border rounded-lg text-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Paste hint */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ImageIcon className="w-3 h-3" />
            Paste images (Ctrl+V)
          </div>
        </div>

        {/* Content Area - Editor Only */}
        <div className="flex-1 overflow-y-auto">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onBlur={handleBlur}
            onPaste={handleEditorPaste}
            className="w-full h-full p-6 focus:outline-none text-gray-700 leading-relaxed text-sm bg-transparent whitespace-pre-wrap"
            style={{ minHeight: '100%' }}
            data-placeholder="Add notes... Paste images to attach them."
          />
          <style>{`
            [contenteditable]:empty:before {
              content: attr(data-placeholder);
              color: #9ca3af;
              pointer-events: none;
            }
            [contenteditable] img {
              display: block;
              margin: 8px 0;
            }
          `}</style>
        </div>

      </div>
    </div>
  );
};