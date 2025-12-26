import { GoogleGenAI, Type } from "@google/genai";
import { Todo } from "../types";

// Helper to get the AI client with dynamic key
const getAiClient = () => {
  // Check local storage first for user custom key
  const customKey = localStorage.getItem('gemini_api_key');
  const apiKey = customKey || process.env.API_KEY || '';
  
  return new GoogleGenAI({ apiKey });
};

// Helper to check if we have ANY key available
const hasApiKey = () => {
    return !!(localStorage.getItem('gemini_api_key') || process.env.API_KEY);
};

export const generateSubtasks = async (goal: string): Promise<string[]> => {
  if (!hasApiKey()) {
    console.warn("No API Key found. Returning mock data for demonstration.");
    // Fallback if no key is provided in the environment or settings
    return [
      `Research ${goal}`,
      `Draft outline for ${goal}`,
      `Review and refine ${goal}`
    ];
  }

  try {
    const ai = getAiClient();
    const modelId = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are an expert project manager. Break down the following user goal into 3 to 5 concrete, actionable, short todo list items. Goal: "${goal}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(jsonText) as { tasks: string[] };
    return data.tasks || [];

  } catch (error) {
    console.error("Error generating tasks:", error);
    throw error;
  }
};

export const summarizeGroupTasks = async (groupName: string, tasks: Todo[]): Promise<string> => {
  if (!hasApiKey()) {
      return `**Mock Summary for ${groupName}**\n\nYou have ${tasks.length} tasks in this list. ${tasks.filter(t => t.completed).length} are completed. Keep up the good work!`;
  }

  try {
    const ai = getAiClient();
    const modelId = "gemini-3-flash-preview";
    
    // Prepare task list string
    const taskList = tasks.map(t => {
        const status = t.completed ? "[Completed]" : "[Pending]";
        const importance = t.isImportant ? "(Important)" : "";
        const due = t.dueDate ? `Due: ${t.dueDate}` : "";
        return `- ${status} ${t.text} ${importance} ${due}`;
    }).join("\n");

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are a helpful personal assistant.
      
      Review the following todo list for the group: "${groupName}".
      
      Tasks:
      ${taskList}
      
      Provide a concise, encouraging summary of these tasks in Markdown format. 
      - Mention how many are done vs pending.
      - Highlight any important tasks or immediate deadlines.
      - Give a brief encouraging closing remark.
      - Do not simply list the tasks again; summarize the situation.`,
    });

    return response.text || "Could not generate summary.";

  } catch (error) {
    console.error("Error summarizing tasks:", error);
    throw error;
  }
};