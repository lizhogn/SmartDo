import React, { useState, useRef, useEffect } from 'react';
import { Check, Trash2, Sparkles, Calendar, CalendarClock, Save, X, Clock, Star, Edit3, AlignLeft, GripVertical } from 'lucide-react';
import { Todo } from '../types';

interface TaskItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onOpenDetails: (todo: Todo) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onUpdate,
  onOpenDetails,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editStartDate, setEditStartDate] = useState(todo.startDate || '');
  const [editDueDate, setEditDueDate] = useState(todo.dueDate || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(todo.id, {
        text: editText.trim(),
        startDate: editStartDate || undefined,
        dueDate: editDueDate || undefined
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditStartDate(todo.startDate || '');
    setEditDueDate(todo.dueDate || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDate = (dateStr?: string, isStart = false) => {
    if (!dateStr) return null;
    // Parse YYYY-MM-DD manually to avoid timezone issues
    const [y, m, d] = dateStr.split('-').map(Number);
    const taskDate = new Date(y, m - 1, d);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = !isStart && today.getTime() > taskDate.getTime();

    const IconComponent = isStart ? CalendarClock : Calendar;
    const colorClass = isOverdue && !todo.completed ? 'text-red-500' : (isStart ? 'text-blue-500' : 'text-gray-500');

    return (
      <span className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
        <IconComponent className="w-3 h-3" />
        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(taskDate)}
      </span>
    );
  };

  const formatDateRange = () => {
    if (!todo.startDate && !todo.dueDate) return null;

    return (
      <span className="flex items-center gap-1 text-xs">
        {todo.startDate && formatDate(todo.startDate, true)}
        {todo.startDate && todo.dueDate && <span className="text-gray-400 mx-0.5">→</span>}
        {todo.dueDate && formatDate(todo.dueDate, false)}
      </span>
    );
  };

  const formatCreationTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 mb-3 bg-white rounded-xl border-2 border-primary/20 shadow-sm animate-fade-in">
        <div className="flex-1 flex flex-col gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-base font-medium text-gray-900 border-b border-gray-200 focus:border-primary focus:outline-none py-1 bg-transparent"
            placeholder="Task name"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">开始:</span>
              <div className="relative flex items-center">
                <CalendarClock className="w-4 h-4 text-blue-400 absolute left-2 pointer-events-none" />
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="pl-8 pr-2 py-1 text-xs border rounded-md text-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-gray-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">截止:</span>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2 pointer-events-none" />
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="pl-8 pr-2 py-1 text-xs border rounded-md text-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, todo.id)}
      className={`group flex items-center justify-between p-4 mb-3 bg-white rounded-xl border transition-all duration-200 animate-slide-up ${todo.completed
        ? 'border-gray-100 bg-gray-50/50'
        : todo.isImportant
          ? 'border-amber-200 bg-amber-50/10 shadow-sm'
          : 'border-gray-100 hover:border-primary/30 hover:shadow-md'
        } ${isDragging ? 'opacity-50 border-dashed border-gray-300' : ''}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="hidden md:block cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4" />
        </div>

        <button
          onClick={() => onToggle(todo.id)}
          className={`relative flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${todo.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-primary'
            }`}
        >
          {todo.completed && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="flex flex-col min-w-0 flex-1 ml-2">
          <span
            onClick={() => onOpenDetails(todo)}
            className={`text-base font-medium truncate transition-all duration-200 cursor-pointer select-none ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700 hover:text-primary'
              }`}
            title="Click to view details"
          >
            {todo.text}
          </span>

          <div className="flex items-center gap-3 mt-1 h-4">
            {todo.isAiGenerated && (
              <span className="text-[10px] text-secondary flex items-center gap-1 font-medium">
                <Sparkles className="w-2.5 h-2.5" /> Gemini
              </span>
            )}

            {formatDateRange()}

            <span className="text-[10px] text-gray-400 flex items-center gap-0.5" title="Added time">
              <Clock className="w-2.5 h-2.5" />
              {formatCreationTime(todo.createdAt)}
            </span>

            {todo.description && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <AlignLeft className="w-2.5 h-2.5" /> Notes
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-3">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Rename task"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onUpdate(todo.id, { isImportant: !todo.isImportant })}
          className={`p-2 rounded-lg transition-colors ${todo.isImportant
            ? 'text-amber-400 hover:bg-amber-50'
            : 'text-gray-300 hover:text-amber-400 hover:bg-gray-50 opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
          title={todo.isImportant ? "Unmark importance" : "Mark as important"}
        >
          <Star className={`w-4 h-4 ${todo.isImportant ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={() => onDelete(todo.id)}
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};