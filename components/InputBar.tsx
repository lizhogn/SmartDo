import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Sparkles, Calendar, ArrowUp } from 'lucide-react';

interface InputBarProps {
  onAdd: (text: string, dueDate?: string) => void;
  onMagicAdd: (text: string, dueDate?: string) => Promise<void>;
  isGenerating: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onAdd, onMagicAdd, isGenerating }) => {
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [inputValue, setInputValue] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDate());
  const dateInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Max height of ~120px (about 4-5 lines)
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter inserts new line (default behavior, so do nothing)
    // Enter alone submits the task
    if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
      e.preventDefault();
      handleAddClick();
    }
  };

  const handleAddClick = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim(), dueDate || undefined);
      setInputValue('');
      setDueDate(getTodayDate());
    }
  };

  const handleMagicClick = async () => {
    if (inputValue.trim()) {
      await onMagicAdd(inputValue.trim(), dueDate || undefined);
      setInputValue('');
      setDueDate(getTodayDate());
    }
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return 'No Date';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    if (dateObj.getTime() === today.getTime()) return 'Today';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // Force the picker to open on click anywhere on the input
    // This fixes the issue where clicking the text part only focuses the input on desktop
    try {
      if ('showPicker' in e.currentTarget) {
        e.currentTarget.showPicker();
      }
    } catch (err) {
      // Fallback or ignore if not supported
    }
  };

  return (
    <div className="w-full bg-white p-2 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 transition-all duration-200 hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)] flex items-end gap-2 relative z-20">
      {/* Input Field - Now a textarea for multi-line support */}
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task or goal..."
        className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-base sm:text-lg font-medium border-none px-4 py-2 focus:ring-0 focus:outline-none min-w-0 resize-none overflow-hidden leading-relaxed"
        style={{ minHeight: '40px', maxHeight: '120px' }}
        disabled={isGenerating}
        autoFocus
        rows={1}
      />

      {/* Right Side Actions Group */}
      <div className="flex items-center gap-2 pr-2 shrink-0 pb-1">

        {/* Date Pill - Increased Size & Hit Area */}
        <div className="relative group/date h-10">
          <input
            ref={dateInputRef}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            onClick={handleDateClick}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            disabled={isGenerating}
            aria-label="Set deadline"
          />
          <button
            type="button"
            className={`h-full flex items-center gap-2 px-4 rounded-full text-sm font-medium transition-all duration-200 select-none ${dueDate
              ? 'bg-indigo-50 text-primary'
              : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200'
              }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap">{formatDateShort(dueDate)}</span>
          </button>
        </div>

        {/* Magic Button - Consistent 40px Size */}
        <button
          onClick={handleMagicClick}
          disabled={!inputValue.trim() || isGenerating}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${inputValue.trim() && !isGenerating
            ? 'text-secondary hover:bg-purple-50 hover:text-purple-600'
            : 'text-gray-300 cursor-not-allowed'
            }`}
          title="Break down with AI"
        >
          <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>

        {/* Add Button - Consistent 40px Size */}
        <button
          onClick={handleAddClick}
          disabled={!inputValue.trim() || isGenerating}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 shadow-sm transform ${inputValue.trim() && !isGenerating
            ? 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 active:scale-95'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          title="Add Task"
        >
          <ArrowUp className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};