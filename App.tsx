import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Todo, FilterType } from './types';
import { InputBar } from './components/InputBar';
import { TaskItem } from './components/TaskItem';
import { FilterTabs } from './components/FilterTabs';
import { GroupingTabs, GroupingType } from './components/GroupingTabs';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { SummaryModal } from './components/SummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { generateSubtasks, summarizeGroupTasks, GroupingType as SummaryGroupingType } from './services/geminiService';
import { CheckCircle2, ListTodo, AlertCircle, Calendar, Sparkles, Loader2, User } from 'lucide-react';

import { db } from './services/database';

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
      createdAt: now - 172800000,
      dueDate: getRelativeDate(-1),
      description: 'Include the following sections:\n- Overview\n- Tech Stack\n- Installation Guide',
      order: 0,
    },
    {
      id: 'mock-2',
      text: 'Review pull requests',
      completed: false,
      createdAt: now - 3600000,
      dueDate: getRelativeDate(0),
      isImportant: true,
      order: 1,
    },
    {
      id: 'mock-3',
      text: 'Design system meeting',
      completed: false,
      createdAt: now - 7200000,
      dueDate: getRelativeDate(0),
      order: 2,
    },
    {
      id: 'mock-4',
      text: 'Optimize database queries',
      completed: false,
      createdAt: now,
      dueDate: getRelativeDate(1),
      isAiGenerated: true,
      order: 3,
    },
    {
      id: 'mock-5',
      text: 'Plan Q3 roadmap',
      completed: false,
      createdAt: now - 86400000,
      dueDate: getRelativeDate(7),
      order: 4,
    }
  ];
};

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [grouping, setGrouping] = useState<GroupingType>('day');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Load from DB on mount
  useEffect(() => {
    const loadTodos = async () => {
      try {
        await db.init();
        const savedTodos = await db.getAllTodos();
        if (savedTodos.length > 0) {
          setTodos(savedTodos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        } else {
          // Seed mock data if empty
          const mocks = generateMockTodos();
          setTodos(mocks);
          for (const t of mocks) {
            await db.saveTodo(t);
          }
        }
      } catch (e) {
        console.error("Failed to load todos", e);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    loadTodos();
  }, []);

  const addTask = (text: string, dueDate?: string, isAiGenerated = false) => {
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
    db.saveTodo(newTodo).catch(e => console.error(e));
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
        newTodos.forEach(t => db.saveTodo(t)); // Save all generated tasks
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
    let updatedTodo: Todo | undefined;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          updatedTodo = { ...todo, completed: !todo.completed };
          return updatedTodo;
        }
        return todo;
      })
    );
    if (updatedTodo) db.saveTodo(updatedTodo);
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    if (selectedTodoId === id) setSelectedTodoId(null);
    db.deleteTodo(id);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    let updatedTodo: Todo | undefined;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          updatedTodo = { ...todo, ...updates };
          return updatedTodo;
        }
        return todo;
      })
    );
    if (updatedTodo) db.saveTodo(updatedTodo);
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

    // Get today's date key for comparison
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayKey = `${todayYear}-${todayMonth}-${todayDay}`;

    // Separate keys into categories: today, future, past, no-date
    const allKeys = Object.keys(groups);
    const todayKeys: string[] = [];
    const futureKeys: string[] = [];
    const pastKeys: string[] = [];
    const noDateKeys: string[] = [];

    allKeys.forEach(key => {
      if (key === noDateKey) {
        noDateKeys.push(key);
      } else if (key === todayKey) {
        todayKeys.push(key);
      } else if (key > todayKey) {
        futureKeys.push(key);
      } else {
        pastKeys.push(key);
      }
    });

    // Sort all dates ascending (Oldest -> Newest)
    // This places Past before Today in the DOM, so "scrolling up" (swiping down) reveals them.
    futureKeys.sort((a, b) => a.localeCompare(b));
    pastKeys.sort((a, b) => a.localeCompare(b));

    // Order: Past -> Today -> Future -> No Date
    const sortedKeys = [...pastKeys, ...todayKeys, ...futureKeys, ...noDateKeys];

    // Find the key to scroll to (Today, or first Future, or first No Date, or just first item)
    // We want to scroll to Today if exists, else first future.
    let scrollAnchorKey = todayKeys[0];
    if (!scrollAnchorKey && futureKeys.length > 0) scrollAnchorKey = futureKeys[0];
    if (!scrollAnchorKey && noDateKeys.length > 0) scrollAnchorKey = noDateKeys[0];
    // If no future/today, maybe we just stay at top (past). But user wants 'default show today'.

    return sortedKeys.map(key => {
      const tasks = groups[key];
      // Tasks are already sorted in filteredTodos, which respects 'order'.
      return { key, tasks, isScrollAnchor: key === scrollAnchorKey };
    });
  }, [filteredTodos, grouping]);

  // Scroll to Today logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Scroll to today on initial load or when grouping changes
    if (!hasScrolled && todayRef.current && scrollContainerRef.current) {
      // Use a small timeout to ensure layout is done
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
        setHasScrolled(true);
      }, 100);
    }
  }, [groupedTodos, hasScrolled]);

  // Reset hasScrolled when grouping changes so we re-snap
  useEffect(() => {
    setHasScrolled(false);
  }, [grouping]);

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
      const summary = await summarizeGroupTasks(title, tasks, grouping as SummaryGroupingType);
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

  // Get the dueDate for a given group key
  const getGroupDueDate = (key: string): string | undefined => {
    if (key === 'no-date') return undefined;

    if (grouping === 'day') {
      return key; // Already in YYYY-MM-DD format
    } else if (grouping === 'week') {
      // Week key is the Monday, use that as the due date
      return key;
    } else if (grouping === 'month') {
      // Month key is YYYY-MM, set to first day of month
      return `${key}-01`;
    } else if (grouping === 'year') {
      // Year key is YYYY, set to first day of year
      return `${key}-01-01`;
    }
    return key;
  };

  // Handle drop on group header (allows dropping to change date group)
  const handleGroupDrop = (e: React.DragEvent, groupKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTodoId) {
      setDraggedTodoId(null);
      return;
    }

    const newDueDate = getGroupDueDate(groupKey);
    const draggedTodo = todos.find(t => t.id === draggedTodoId);

    if (draggedTodo) {
      // Update the dragged task's due date to match the target group
      // Also set order to be at the top of the target group
      const targetGroup = groupedTodos.find(g => g.key === groupKey);
      const minOrderInGroup = targetGroup && targetGroup.tasks.length > 0
        ? Math.min(...targetGroup.tasks.map(t => t.order))
        : 0;

      const updatedTodo = { ...draggedTodo, dueDate: newDueDate, order: minOrderInGroup - 1 };

      setTodos(prev => prev.map(t =>
        t.id === draggedTodoId
          ? updatedTodo
          : t
      ));
      db.saveTodo(updatedTodo);
    }

    setDraggedTodoId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTodoId || draggedTodoId === targetId) {
      setDraggedTodoId(null);
      return;
    }

    // Identify which group the target belongs to
    const targetGroup = groupedTodos.find(g => g.tasks.find(t => t.id === targetId));
    const sourceGroup = groupedTodos.find(g => g.tasks.find(t => t.id === draggedTodoId));

    if (targetGroup) {
      // Check if dragging across groups
      const isCrossGroupDrag = !sourceGroup || sourceGroup.key !== targetGroup.key;

      if (isCrossGroupDrag) {
        // Cross-group drag: update dueDate and position
        const newDueDate = getGroupDueDate(targetGroup.key);
        const targetTaskIndex = targetGroup.tasks.findIndex(t => t.id === targetId);

        // Calculate new order to insert at target position
        let newOrder: number;
        if (targetTaskIndex === 0) {
          // Insert before first item
          newOrder = targetGroup.tasks[0].order - 1;
        } else {
          // Insert at target position
          const prevOrder = targetGroup.tasks[targetTaskIndex - 1].order;
          const currentOrder = targetGroup.tasks[targetTaskIndex].order;
          newOrder = (prevOrder + currentOrder) / 2;
        }

        const draggedTodo = todos.find(t => t.id === draggedTodoId);
        if (draggedTodo) {
          const updatedTodo = { ...draggedTodo, dueDate: newDueDate, order: newOrder };
          setTodos(prev => prev.map(t =>
            t.id === draggedTodoId
              ? updatedTodo
              : t
          ));
          db.saveTodo(updatedTodo);
        }
      } else {
        // Same group drag: just reorder
        const taskIds = targetGroup.tasks.map(t => t.id);
        const fromIndex = taskIds.indexOf(draggedTodoId);
        const toIndex = taskIds.indexOf(targetId);

        if (fromIndex !== -1 && toIndex !== -1) {
          // Reorder logic
          const newTasks = [...targetGroup.tasks];
          const [movedItem] = newTasks.splice(fromIndex, 1);
          newTasks.splice(toIndex, 0, movedItem);

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
            if (update) {
              // Side effect in map is bad but we will save later
              const updated = { ...t, order: update.order };
              db.saveTodo(updated); // Async save
              return updated;
            }
            return t;
          }));
        }
      }
    }

    setDraggedTodoId(null);
  };

  return (
    <div className="h-screen w-full bg-slate-50 text-gray-900 flex flex-col overflow-hidden relative">
      {/* Fixed Header */}
      <div className="shrink-0 px-4 sm:px-6 pt-10 pb-2 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-gray-100/50">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-indigo-200">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                  SmartDo
                </h1>
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
            <div className="flex flex-row flex-nowrap items-center justify-between gap-1 overflow-x-auto no-scrollbar animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
        </div>
      </div>

      {/* Scrollable Task List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-4 sm:px-6 pb-32"
      >
        <div className="w-full max-w-2xl mx-auto pt-2">
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
            groupedTodos.map(({ key, tasks, isScrollAnchor }) => (
              <div
                key={key}
                ref={isScrollAnchor ? todayRef : null}
                className="mb-6 animate-fade-in"
              >
                <div
                  className="flex items-center justify-between mb-2 px-1 mt-4 rounded-lg transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-primary/10');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-primary/10');
                  }}
                  onDrop={(e) => {
                    e.currentTarget.classList.remove('bg-primary/10');
                    handleGroupDrop(e, key);
                  }}
                >
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