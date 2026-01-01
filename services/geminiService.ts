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

// Default prompts
const DEFAULT_TASK_PROMPT = `You are an expert project manager. Break down the following user goal into 3 to 5 concrete, actionable, short todo list items. Goal: "{{goal}}"`;

const DEFAULT_SUMMARY_PROMPT = `你是一个专业的工作报告撰写助手。

请根据以下时间段的任务生成工作报告: "{{groupName}}"

任务列表:
{{taskList}}

{{detailLevel}}，请使用中文输出，按以下格式生成专业的工作报告:

## � 工作概览
- 本期任务总数、已完成数量、完成率
- 重要任务完成情况

## ✅ 完成事项
- 按优先级或类别列出已完成的主要工作
- 简述完成情况和成果

## 🔄 进行中 / 待办事项
- 列出未完成的任务及当前进度
- 说明预计完成时间或阻塞原因

## 📈 工作亮点
- 突出本期的重要成果和亮点
- 值得分享的经验或改进

## � 下期计划
- 根据待办任务提出下期工作重点
- 需要关注或跟进的事项

## 💬 备注
- 其他需要说明的事项（如有）`;

// Get custom prompts from localStorage
export const getTaskPrompt = (): string => {
  return localStorage.getItem('custom_task_prompt') || DEFAULT_TASK_PROMPT;
};

export const getSummaryPrompt = (): string => {
  return localStorage.getItem('custom_summary_prompt') || DEFAULT_SUMMARY_PROMPT;
};

export const getDefaultTaskPrompt = (): string => DEFAULT_TASK_PROMPT;
export const getDefaultSummaryPrompt = (): string => DEFAULT_SUMMARY_PROMPT;

export const testApiConfiguration = async (
  provider: string,
  apiKey: string,
  baseUrl?: string,
  modelName?: string
): Promise<void> => {
  if (!apiKey) throw new Error("API Key is required");

  if (provider === 'openai') {
    const url = baseUrl || 'https://api.openai.com/v1';
    const model = modelName || 'gpt-3.5-turbo';

    const response = await fetch(`${url.replace(/\/+$/, '')} /chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey} `
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: "Hi" }
        ],
        max_tokens: 5,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      try {
        const errObj = JSON.parse(errText);
        throw new Error(errObj.error?.message || `Status ${response.status} `);
      } catch (e) {
        throw new Error(`Status ${response.status}: ${errText} `);
      }
    }
  } else {
    // Gemini Test
    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    await model.generateContent("Hi");
  }
};

// Generic OpenAI-compatible fetcher
const callOpenAI = async (userDetails: string) => {
  const apiKey = localStorage.getItem('gemini_api_key');
  const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1';
  const model = localStorage.getItem('openai_model_name') || 'gpt-3.5-turbo';

  const response = await fetch(`${baseUrl.replace(/\/+$/, '')} /chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey} `
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "You are a helpful assistant. Return ONLY a raw JSON object with a 'tasks' property containing an array of strings." },
        { role: "user", content: userDetails }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.statusText} `);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || "";

  // Clean up markdown code blocks if present
  content = content.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(content);
};


export const generateSubtasks = async (goal: string): Promise<string[]> => {
  if (!hasApiKey()) {
    console.warn("No API Key found. Returning mock data for demonstration.");
    return [
      `Research ${goal}`,
      `Draft outline for ${goal}`,
      `Review and refine ${goal}`
    ];
  }

  const provider = localStorage.getItem('api_provider');

  // Get custom prompt and replace placeholder
  const customPrompt = getTaskPrompt().replace(/\{\{goal\}\}/g, goal);

  try {
    if (provider === 'openai') {
      const prompt = customPrompt + ' Return JSON { "tasks": string[] }';
      const data = await callOpenAI(prompt);
      return data.tasks || [];
    }

    // Default to Gemini
    const ai = getAiClient();
    const modelId = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: customPrompt,
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

// Helper to remove image markdown from description
const removeImagesFromDescription = (desc?: string): string => {
  if (!desc) return '';
  // Remove markdown image syntax: ![alt](image:xxx)
  return desc.replace(/!\[.*?\]\(image:[a-zA-Z0-9-]+\)/g, '').trim();
};

export type GroupingType = 'day' | 'week' | 'month' | 'year';

export const summarizeGroupTasks = async (
  groupName: string,
  tasks: Todo[],
  groupingType: GroupingType = 'day'
): Promise<string> => {
  if (!hasApiKey()) {
    return `**${groupName} 摘要**\n\n该列表共有 ${tasks.length} 个任务，其中 ${tasks.filter(t => t.completed).length} 个已完成。继续加油！`;
  }

  try {


    // Prepare task list string based on grouping type
    const isDetailedView = groupingType === 'day' || groupingType === 'week';

    let taskList: string;

    if (isDetailedView) {
      // Day/Week: Include task names and notes (without images)
      taskList = tasks.map(t => {
        const status = t.completed ? "[已完成]" : "[待办]";
        const importance = t.isImportant ? "(重要)" : "";
        const due = t.dueDate ? `截止: ${t.dueDate}` : "";
        const start = t.startDate ? `开始: ${t.startDate}` : "";
        const dates = [start, due].filter(Boolean).join(" ");
        const note = removeImagesFromDescription(t.description);
        const noteText = note ? `\n  备注: ${note}` : "";
        return `- ${status} ${t.text} ${importance} ${dates}${noteText}`;
      }).join("\n");
    } else {
      // Month/Year: Only include task names
      taskList = tasks.map(t => {
        const status = t.completed ? "[已完成]" : "[待办]";
        const importance = t.isImportant ? "(重要)" : "";
        return `- ${status} ${t.text} ${importance}`;
      }).join("\n");
    }

    const detailLevel = isDetailedView
      ? "请根据任务内容和备注进行详细分析"
      : "请根据任务列表进行宏观总结";

    // Get custom prompt and replace placeholders
    const prompt = getSummaryPrompt()
      .replace(/\{\{groupName\}\}/g, groupName)
      .replace(/\{\{taskList\}\}/g, taskList)
      .replace(/\{\{detailLevel\}\}/g, detailLevel);

    // Check provider
    const provider = localStorage.getItem('api_provider');
    if (provider === 'openai') {
      const apiKey = localStorage.getItem('gemini_api_key');
      const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1';
      const model = localStorage.getItem('openai_model_name') || 'gpt-3.5-turbo';

      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ],
          stream: false
        })
      });

      if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "无法生成摘要。";
    }

    // Default to Gemini
    const ai = getAiClient();
    const modelId = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "无法生成摘要。";

  } catch (error) {
    console.error("Error summarizing tasks:", error);
    throw error;
  }
};