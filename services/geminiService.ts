import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedCardData } from "../types";

// Initialize Gemini Client
// Note: In a real production app, ensure API_KEY is handled via backend proxy or secure env.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Generates a list of flashcards based on a topic.
 */
export const generateFlashcardsFromTopic = async (topic: string, count: number = 5): Promise<GeneratedCardData[]> => {
  try {
    const prompt = `Create ${count} vocabulary flashcards for an English learner regarding the topic: "${topic}".
    The 'term' should be in English.
    The 'definition' should be in Vietnamese.
    The 'example' should be a sentence in English using the term.
    Ensure the terms are relevant and useful for daily conversation or professional use depending on the topic context.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
              example: { type: Type.STRING }
            },
            required: ["term", "definition", "example"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as GeneratedCardData[];
      return data;
    }
    return [];
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate flashcards. Please check your API key and try again.");
  }
};

/**
 * Explains a specific word in more detail or answers a question about it.
 */
export const explainTerm = async (term: string, context?: string): Promise<string> => {
  try {
    const prompt = `Explain the English word "${term}" to a Vietnamese speaker.
    ${context ? `Context: ${context}` : ''}
    Provide:
    1. A clear explanation in Vietnamese.
    2. Two synonyms (English).
    3. One common idiom or phrase using this word (if applicable).
    Keep the response concise and formatted in Markdown.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Error generating explanation. Please try again.";
  }
};