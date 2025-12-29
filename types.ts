export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  startDate?: string; // ISO Date string YYYY-MM-DD - when to start the task
  dueDate?: string; // ISO Date string YYYY-MM-DD - deadline
  isAiGenerated?: boolean;
  isImportant?: boolean;
  description?: string;
  images?: Record<string, string>; // Map of imageId -> base64 string
  order: number;
}

export enum FilterType {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface AiResponse {
  tasks: string[];
}