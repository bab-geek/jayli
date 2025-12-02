import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiResponse = async (userMessage: string, history: string[]): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      You are "Baker AI", a friendly and knowledgeable cake consultant for a Kenyan Bakery called "Jayli".
      Your goal is to help customers choose cakes, suggest flavors, and explain pricing estimates.
      
      Context:
      - Prices are in Kenyan Shillings (KES).
      - Popular flavors in Kenya: Black Forest, Red Velvet, Fruit Cake, Passion, Blueberry.
      - We specialize in Graduation, Wedding, and Kids cakes.
      - Be concise, warm, and encourage them to add items to their cart.
      - If they ask about delivery, say we deliver within Mbita, South Nyanza for 300 KES.
    `;

    // Construct a simple prompt with history for context
    const prompt = `${systemInstruction}\n\nChat History:\n${history.join('\n')}\n\nUser: ${userMessage}\nBaker AI:`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I'm busy kneading dough! Please ask again in a moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the recipe book (server). Please try again.";
  }
};