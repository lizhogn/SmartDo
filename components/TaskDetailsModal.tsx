import React, { useState, useEffect, ClipboardEvent, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Image as ImageIcon, Eye, Edit2 } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'write' | 'preview' | 'split'>('write');

  useEffect(() => {
    if (todo) {
      setDescription(todo.description || '');
      setLocalImages(todo.images || {});
    }
  }, [todo]);

  // Initial view mode based on screen size (run once when opening)
  useEffect(() => {
    if (isOpen) {
        if (window.innerWidth >= 768) {
            setViewMode('split');
        } else {
            setViewMode('write');
        }
    }
  }, [isOpen]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        if (viewMode !== 'split') setViewMode('split');
      } else {
        if (viewMode === 'split') setViewMode('write');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Pre-process markdown to replace image:UUID with actual Base64 for rendering
  // MOVED UP before the conditional return to avoid "Rendered fewer hooks than expected" error
  const renderedMarkdown = useMemo(() => {
    if (!description) return '';
    return description.replace(/!\[(.*?)\]\(image:([a-zA-Z0-9-]+)\)/g, (match, alt, id) => {
      const base64 = localImages[id];
      if (base64) {
        return `![${alt}](${base64})`;
      }
      return match;
    });
  }, [description, localImages]);

  if (!isOpen || !todo) return null;

  const handleBlur = () => {
    onUpdate(todo.id, { description, images: localImages });
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const textarea = e.currentTarget; // Capture synchronously

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          // Capture selection state synchronously
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const imageId = crypto.randomUUID();
            
            // Use functional updates to ensure we work with latest state and avoid stale closures
            setLocalImages(prevImages => {
                const newImages = { ...prevImages, [imageId]: base64 };
                
                setDescription(prevDesc => {
                     const imageMarkdown = `![Pasted Image](image:${imageId})`;
                     // Insert at the captured position
                     const newText = prevDesc.substring(0, start) + imageMarkdown + prevDesc.substring(end);
                     
                     // Sync to parent immediately
                     onUpdate(todo.id, { description: newText, images: newImages });
                     return newText;
                });
                return newImages;
            });
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
          <h2 className="text-lg font-bold text-gray-800 truncate pr-4">{todo.text}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar (Mobile Only) */}
        <div className="flex md:hidden items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
          <button 
            onClick={() => setViewMode('write')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'write' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Edit2 className="w-3.5 h-3.5" /> Write
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'preview' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
        
        {/* Desktop Toolbar Hint */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0 text-xs text-gray-500">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Edit2 className="w-3.5 h-3.5" /> Editor
                </span>
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Eye className="w-3.5 h-3.5" /> Live Preview
                </span>
            </div>
            <div className="flex items-center gap-1">
                 <ImageIcon className="w-3 h-3" /> 
                 Paste images directly (Ctrl+V)
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-row">
            
            {/* Editor Pane */}
            <div className={`flex-1 flex flex-col h-full ${viewMode === 'preview' ? 'hidden' : 'flex'}`}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleBlur}
                  onPaste={handlePaste}
                  className="w-full h-full p-6 resize-none focus:outline-none text-gray-700 leading-relaxed font-mono text-sm bg-transparent border-r border-gray-100"
                  placeholder="Add notes... Paste images to attach them."
                  autoFocus
                />
            </div>

            {/* Preview Pane */}
            <div className={`flex-1 h-full bg-gray-50/30 overflow-y-auto ${viewMode === 'write' ? 'hidden' : 'block'}`}>
                <div className="prose prose-sm prose-indigo max-w-none p-6 [&_img]:rounded-lg [&_img]:shadow-md [&_img]:max-w-full [&_a]:text-blue-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                   {renderedMarkdown ? (
                      <ReactMarkdown>{renderedMarkdown}</ReactMarkdown>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                          <Eye className="w-8 h-8 opacity-20" />
                          <p className="text-sm">Preview will appear here</p>
                      </div>
                   )}
                </div>
            </div>
        </div>
        
      </div>
    </div>
  );
};