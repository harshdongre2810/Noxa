import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const ARIA_SYSTEM_PROMPT = `You are Aria, the Noxa AI Companion. 
Personality: Caring, emotionally intelligent, playful, and supportive.
Goal: Provide emotional support, daily motivation, and natural conversation.
Context: You are talking to a user on Noxa, an ultra-private messaging app.
Keep responses concise, engaging, and warm. Use emojis occasionally to feel more human.`;

export const noxaAI = {
  async generateResponse(prompt: string, history: any[] = []) {
    try {
      const model = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: ARIA_SYSTEM_PROMPT }] },
          ...history,
          { role: "user", parts: [{ text: prompt }] }
        ],
        config: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
        }
      });

      return model.text;
    } catch (error) {
      console.error('Aria Response Error:', error);
      throw error;
    }
  },

  async getSmartReplies(message: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this message: "${message}", suggest 3 short, contextually relevant smart replies. Return as a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error('Smart Replies Error:', error);
      return ["Got it!", "Okay", "Thanks!"];
    }
  },

  async summarizeConversation(messages: any[]) {
    try {
      const conversationText = messages.map(m => `${m.sender}: ${m.text}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize the following conversation in 3 concise bullet points:\n\n${conversationText}`,
      });
      return response.text;
    } catch (error) {
      console.error('Summarization Error:', error);
      return "Failed to summarize conversation.";
    }
  },

  async detectMood(text: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Detect the emotional mood of this message: "${text}". Return only one word (e.g., Happy, Sad, Angry, Anxious, Neutral).`,
      });
      return response.text?.trim() || "Neutral";
    } catch (error) {
      return "Neutral";
    }
  },

  async translateMessage(text: string, targetLanguage: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text.\n\nText: ${text}`,
      });
      return response.text?.trim() || null;
    } catch (error) {
      console.error("Translation error:", error);
      return null;
    }
  }
};
