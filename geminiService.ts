
import { GoogleGenAI, Type } from "@google/genai";
import { LibraryItem, SearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const performVisualSearch = async (
  queryImageBase64: string,
  libraryItems: LibraryItem[]
): Promise<SearchResult> => {
  if (libraryItems.length === 0) {
    return { matchFound: false, reason: "Bibliotēka ir tukša." };
  }

  // We'll send the query image and a subset of candidates to compare.
  // For simplicity and efficiency, we compare against up to 10 most relevant/recent.
  const candidates = libraryItems.slice(0, 15);

  const queryPart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: queryImageBase64.split(',')[1] || queryImageBase64,
    },
  };

  const galleryParts = candidates.map((item, index) => ({
    text: `Gallery Item ${index} (ID: ${item.id}, Name: ${item.name}, Code: ${item.collectionCode}):`,
    inlineData: {
      mimeType: 'image/jpeg',
      data: item.imageData.split(',')[1] || item.imageData,
    }
  }));

  const prompt = `
    I have a "Target Image" and a gallery of "Reference Images". 
    Determine if any of the Reference Images matches the object or document shown in the Target Image.
    Return the result in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          { text: "TARGET IMAGE:" },
          queryPart,
          { text: "GALLERY OF REFERENCE IMAGES:" },
          ...galleryParts.flatMap(p => [ {text: p.text}, p.inlineData ? { inlineData: p.inlineData } : {text: ''} ])
        ] as any
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchFound: { type: Type.BOOLEAN },
            itemId: { type: Type.STRING, description: "The ID of the matching gallery item" },
            confidence: { type: Type.NUMBER, description: "Score from 0 to 1" },
            reason: { type: Type.STRING }
          },
          required: ["matchFound"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    return JSON.parse(resultText) as SearchResult;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return { matchFound: false, reason: "Kļūda apstrādājot attēlu." };
  }
};
