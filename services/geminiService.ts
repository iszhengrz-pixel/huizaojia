
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

const getClient = () => {
  if (!apiKey || apiKey === 'undefined') return null;
  if (!ai) ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const askAI = async (prompt: string, category: string = 'General Cost Engineering') => {
  try {
    const client = getClient();
    if (!client) {
      return "未配置智能助手密钥，暂时无法使用该功能。";
    }
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert AI assistant for "Hui Zao Jia" (汇造价), a professional Chinese cost engineering platform. 
        Your expertise includes: 2024 lists (清单), quotas (定额), indicator data (指标数据), and policy files (政策文件).
        Current context category: ${category}.
        Please answer user questions in professional Chinese.`,
      },
    });
    return response.text || "对不起，我现在无法回答这个问题。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "连接智能助手时发生错误，请稍后再试。";
  }
};
