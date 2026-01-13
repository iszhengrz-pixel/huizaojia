
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askAI = async (prompt: string, category: string = 'General Cost Engineering') => {
  try {
    // Call generateContent with the specific model and formatted prompt.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert AI assistant for "Hui Zao Jia" (汇造价), a professional Chinese cost engineering platform. 
      Your expertise includes: 2024 lists (清单), quotas (定额), indicator data (指标数据), and policy files (政策文件).
      Current context category: ${category}.
      Please answer the following user question in professional Chinese:
      ${prompt}`,
    });
    // Extract text directly from the response object as a property.
    return response.text || "对不起，我现在无法回答这个问题。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "连接智能助手时发生错误，请稍后再试。";
  }
};
