import React, { useState, useEffect, useMemo } from 'react';
import { Todo, FilterType } from './types';
import { InputBar } from './components/InputBar';
import { TaskItem } from './components/TaskItem';
import { FilterTabs } from './components/FilterTabs';
import { GroupingTabs, GroupingType } from './components/GroupingTabs';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { SummaryModal } from './components/SummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { generateSubtasks, summarizeGroupTasks } from './services/geminiService';
import { CheckCircle2, ListTodo, AlertCircle, Calendar, Sparkles, Loader2, User } from 'lucide-react';

const STORAGE_KEY = 'gemini-todo-app-v1';

// Mock data generator for development/demo
const generateMockTodos = (): Todo[] => {
  const getRelativeDate = (diffDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + diffDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = Date.now();

  return [
    {
      id: 'mock-1',
      text: 'Prepare project documentation',
      completed: true,
      createdAt: now - 172800000, // 2 days ago
      dueDate: getRelativeDate(-1), // Yesterday
      description: 'Include the following sections:\n- Overview\n- Tech Stack\n- Installation Guide',
      order: 0,
    },
    {
      id: 'mock-2',
      text: 'Review pull requests',
      completed: false,
      createdAt: now - 3600000, // 1 hour ago
      dueDate: getRelativeDate(0), // Today
      isImportant: true,
      order: 1,
    },
    {
      id: 'mock-3',
      text: 'Design system meeting',
      completed: false,
      createdAt: now - 7200000, // 2 hours ago
      dueDate: getRelativeDate(0), // Today
      order: 2,
    },
    {
      id: 'mock-4',
      text: 'Optimize database queries',
      completed: false,
      createdAt: now,
      dueDate: getRelativeDate(1), // Tomorrow
      isAiGenerated: true,
      order: 3,
    },
    {
      id: 'mock-5',
      text: 'Plan Q3 roadmap',
      completed: false,
      createdAt: now - 86400000, // 1 day ago
      dueDate: getRelativeDate(7), // Next week
      order: 4,
    }
  ];
};

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all todos have an order field
        return parsed.map((t: any, i: number) => ({
          ...t,
          order: typeof t.order === 'number' ? t.order : i
        }));
      } catch (e) {
        return generateMockTodos();
      }
    }
    return generateMockTodos();
  });
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [grouping, setGrouping] = useState<GroupingType>('day');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Modal
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

  // State for Summary
  const [summaryResult, setSummaryResult] = useState<{ title: string, content: string } | null>(null);
  const [summarizingKey, setSummarizingKey] = useState<string | null>(null);

  // State for Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string, avatar?: string } | null>(null);

  // Drag and drop state
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);

  // Load user on mount
  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user_info');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTask = (text: string, dueDate?: string, isAiGenerated = false) => {
    // Determine new order: lowest existing order - 1 to put at top
    const minOrder = todos.length > 0 ? Math.min(...todos.map(t => t.order)) : 0;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
      dueDate,
      isAiGenerated,
      order: minOrder - 1,
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const handleMagicAdd = async (goal: string, dueDate?: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const subtasks = await generateSubtasks(goal);

      if (!subtasks || subtasks.length === 0) {
        addTask(goal, dueDate);
      } else {
        const minOrder = todos.length > 0 ? Math.min(...todos.map(t => t.order)) : 0;
        const newTodos = subtasks.map((text, index) => ({
          id: crypto.randomUUID(),
          text,
          completed: false,
          createdAt: Date.now(),
          dueDate,
          isAiGenerated: true,
          order: minOrder - (subtasks.length - index), // maintain order of subtasks
        })).reverse();

        setTodos(prev => [...newTodos, ...prev]);
      }
    } catch (err) {
      setError("Failed to generate tasks via AI. Added as plain task instead.");
      addTask(goal, dueDate);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    if (selectedTodoId === id) setSelectedTodoId(null);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, ...updates } : todo
      )
    );
  };

  const selectedTodo = useMemo(() =>
    todos.find(t => t.id === selectedTodoId) || null
    , [todos, selectedTodoId]);

  const filteredTodos = useMemo(() => {
    let result = todos;
    switch (filter) {
      case FilterType.ACTIVE:
        result = todos.filter((t) => !t.completed);
        break;
      case FilterType.COMPLETED:
        result = todos.filter((t) => t.completed);
        break;
      default:
        result = todos;
    }

    // Sort logic: Completed last, then by Manual Order
    return result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Ascending order
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [todos, filter]);

  const getWeekKey = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
  };

  const groupedTodos = useMemo(() => {
    // We now enable grouping for ALL filter types
    const groups: Record<string, Todo[]> = {};
    const noDateKey = 'no-date';

    filteredTodos.forEach(todo => {
      let key = noDateKey;

      if (todo.dueDate) {
        if (grouping === 'day') {
          key = todo.dueDate;
        } else if (grouping === 'week') {
          key = getWeekKey(todo.dueDate);
        } else if (grouping === 'month') {
          key = todo.dueDate.substring(0, 7);
        } else if (grouping === 'year') {
          key = todo.dueDate.substring(0, 4);
        }
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(todo);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === noDateKey) return 1;
      if (b === noDateKey) return -1;
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => {
      const tasks = groups[key];
      // Tasks are already sorted in filteredTodos, which respects 'order'.
      return { key, tasks };
    });
  }, [filteredTodos, grouping]);

  const getGroupTitle = (key: string) => {
    if (key === 'no-date') return 'No Due Date';

    if (grouping === 'day') {
      const [y, m, d] = key.split('-').map(Number);
      const taskDate = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = taskDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';

      return taskDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    if (grouping === 'week') {
      const [y, m, d] = key.split('-').map(Number);
      const startDate = new Date(y, m - 1, d);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const today = new Date();
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
      const todayDay = String(today.getDate()).padStart(2, '0');
      const todayKey = getWeekKey(`${today.getFullYear()}-${todayMonth}-${todayDay}`);
      const label = key === todayKey ? " (This Week)" : "";
      return `Week of ${startStr} - ${endStr}${label}`;
    }

    if (grouping === 'month') {
      const [y, m] = key.split('-').map(Number);
      const date = new Date(y, m - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (grouping === 'year') {
      return key;
    }

    return key;
  };

  const handleSummarizeGroup = async (key: string, tasks: Todo[]) => {
    const title = getGroupTitle(key);
    setSummarizingKey(key);
    try {
      const summary = await summarizeGroupTasks(title, tasks);
      setSummaryResult({ title, content: summary });
    } catch (e) {
      setError("Failed to summarize tasks.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSummarizingKey(null);
    }
  };

  const counts = useMemo(() => ({
    all: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length
  }), [todos]);

  const handleUserUpdate = () => {
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTodoId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTodoId || draggedTodoId === targetId) {
      setDraggedTodoId(null);
      return;
    }

    // Identify which group the target belongs to
    const targetGroup = groupedTodos.find(g => g.tasks.find(t => t.id === targetId));

    if (targetGroup) {
      // Ensure dragged item is in the same visual group (optional, but good for UX stability)
      const isDraggedInSameGroup = targetGroup.tasks.find(t => t.id === draggedTodoId);

      if (isDraggedInSameGroup) {
        const taskIds = targetGroup.tasks.map(t => t.id);
        const fromIndex = taskIds.indexOf(draggedTodoId);
        const toIndex = taskIds.indexOf(targetId);

        if (fromIndex !== -1 && toIndex !== -1) {
          // Reorder logic
          const newTasks = [...targetGroup.tasks];
          const [movedItem] = newTasks.splice(fromIndex, 1);
          newTasks.splice(toIndex, 0, movedItem);

          // Update orders in the main todos list
          // We create a map of id -> newOrder
          // Note: we can't just use index because other groups exist.
          // We need to swap the 'order' values of the affected items, or re-assign.
          // To support global stability, we can just assign new orders based on position.
          // But we must respect the fact that `filteredTodos` might not be ALL todos.
          // Simpler approach: 
          // 1. Get all todos.
          // 2. Find the items involved in the move.
          // 3. Just swap them if adjacent? No, drag drop can be anywhere.

          // Robust approach:
          // Extract all valid 'order' values from the current group.
          // Assign these values to the items in their new positions.
          const existingOrders = targetGroup.tasks.map(t => t.order).sort((a, b) => a - b);
          const updates = newTasks.map((t, i) => ({
            id: t.id,
            order: existingOrders[i] // Assign existing order values to new positions
          }));

          setTodos(prev => prev.map(t => {
            const update = updates.find(u => u.id === t.id);
            return update ? { ...t, order: update.order } : t;
          }));
        }
      }
    }

    setDraggedTodoId(null);
  };

  return (
    <div className="min-h-screen bg-background text-gray-900 flex flex-col items-center py-10 px-4 sm:px-6 relative">

      <div className="w-full max-w-2xl pb-40">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-indigo-200">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                SmartDo
              </h1>
              <p className="text-gray-500 font-medium">Smart Task Management</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`rounded-full transition-all duration-200 ${currentUser
                ? 'p-0.5 border-2 border-primary hover:scale-105'
                : 'p-2.5 bg-white shadow-sm border border-gray-100 hover:shadow-md hover:bg-gray-50 text-gray-600 hover:text-primary'
              }`}
            title={currentUser ? currentUser.name : "Settings & Login"}
          >
            {currentUser && currentUser.avatar ? (
              <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full bg-gray-100" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>
        </div>

        {todos.length > 0 && (
          <div className="flex flex-row flex-wrap items-end justify-between gap-2 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <FilterTabs
              currentFilter={filter}
              setFilter={setFilter}
              counts={counts}
            />

            <GroupingTabs
              currentGrouping={grouping}
              setGrouping={setGrouping}
            />
          </div>
        )}

        <div className="space-y-1">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-20 text-gray-400 animate-fade-in">
              {filter === FilterType.ALL && todos.length === 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <ListTodo className="w-8 h-8 text-gray-300" />
                  </div>
                  <p>No tasks yet. Start by adding one!</p>
                </div>
              ) : (
                <p>No tasks found in this filter.</p>
              )}
            </div>
          ) : (
            groupedTodos.map(({ key, tasks }) => (
              <div key={key} className="mb-6 animate-fade-in">
                <div className="flex items-center justify-between mb-2 px-1 mt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {getGroupTitle(key)}
                    <span className="text-xs font-normal bg-gray-100 px-2 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSummarizeGroup(key, tasks)}
                    disabled={summarizingKey === key}
                    className={`p-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-xs font-medium ${summarizingKey === key
                        ? 'bg-secondary/10 text-secondary'
                        : 'text-gray-400 hover:text-secondary hover:bg-secondary/10'
                      }`}
                    title="Summarize these tasks with AI"
                  >
                    {summarizingKey === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className={summarizingKey === key ? 'inline' : 'hidden sm:inline'}>
                      {summarizingKey === key ? 'Summarizing...' : 'Summarize'}
                    </span>
                  </button>
                </div>
                <div className="space-y-1">
                  {tasks.map(todo => (
                    <TaskItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onUpdate={updateTodo}
                      onOpenDetails={(t) => setSelectedTodoId(t.id)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      isDragging={draggedTodoId === todo.id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 text-center text-xs text-gray-400">
          <p>Powered by Google Gemini • React • Tailwind</p>
        </div>
      </div>

      <TaskDetailsModal
        todo={selectedTodo}
        isOpen={!!selectedTodoId}
        onClose={() => setSelectedTodoId(null)}
        onUpdate={updateTodo}
      />

      <SummaryModal
        isOpen={!!summaryResult}
        title={summaryResult?.title || ''}
        content={summaryResult?.content || ''}
        onClose={() => setSummaryResult(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUserUpdate={handleUserUpdate}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 sm:px-6 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 z-50 pointer-events-none flex flex-col items-center justify-end">
        <div className="w-full max-w-2xl pointer-events-auto flex flex-col gap-2">
          {error && (
            <div className="mb-2 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm animate-fade-in shadow-lg border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <InputBar
            onAdd={addTask}
            onMagicAdd={handleMagicAdd}
            isGenerating={isGenerating}
          />
        </div>
      </div>

    </div>
  );
};

export default App;