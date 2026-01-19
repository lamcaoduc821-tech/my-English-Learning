
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Article, VocabularyWord, Headline } from "../types.ts";

// Safe API Key retrieval
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
  } catch {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const ARTICLE_GENERATION_PROMPT = `Generate a comprehensive, high-quality long-form news report. 
The article must be approximately 1000 words long, written in a sophisticated journalistic style (like The Economist or NYT).
Structure it with multiple sections. Include a catchy headline and a 2-sentence summary.
After the English content, provide a full professional Chinese translation of the article.`;

export const generateArticleForTopic = async (topic: string): Promise<Article> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${ARTICLE_GENERATION_PROMPT}\nTopic: ${topic}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          summary: { type: Type.STRING },
          translation: { type: Type.STRING },
        },
        required: ["title", "content", "summary", "translation"]
      },
    },
  });

  const data = JSON.parse(response.text || '{}');
  return {
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    topic,
    title: data.title,
    content: data.content,
    summary: data.summary,
    translation: data.translation,
  };
};

export const generateArticleFromHeadline = async (headline: Headline): Promise<Article> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${ARTICLE_GENERATION_PROMPT}\nBased on this specific news headline: "${headline.title}" from ${headline.source}. 
    Analyze the context, implications, and broader story behind this headline.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          summary: { type: Type.STRING },
          translation: { type: Type.STRING },
        },
        required: ["title", "content", "summary", "translation"]
      },
    },
  });

  const data = JSON.parse(response.text || '{}');
  return {
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    topic: headline.source,
    title: data.title,
    content: data.content,
    summary: data.summary,
    translation: data.translation,
  };
};

export const fetchNewsHeadlines = async (): Promise<Headline[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: "Find the top 5 trending news headlines from CNN and BBC for today. Return them as a list with title, source, and URL.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            url: { type: Type.STRING },
          },
          required: ["title", "source", "url"]
        }
      }
    },
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse headlines", e);
    return [];
  }
};

export const generateAudioNarration = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this long-form news report formally, clearly and at a steady pace: ${text.substring(0, 3000)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, 
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || '';
};

export const getWordDefinition = async (word: string): Promise<Partial<VocabularyWord>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide linguistic details for the English word: "${word}".
    Return details in JSON format including:
    - partOfSpeech: Common abbreviation like n., v., adj., adv., etc.
    - chinese: Precise Chinese translation
    - english: Clear English definition
    - example: A natural example sentence
    - phrases: List of 3 common collocations or phrases
    - deformations: List of word forms (plural, tense, etc.)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          partOfSpeech: { type: Type.STRING },
          chinese: { type: Type.STRING },
          english: { type: Type.STRING },
          example: { type: Type.STRING },
          phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
          deformations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["partOfSpeech", "chinese", "english", "example", "phrases", "deformations"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      partOfSpeech: '',
      chinese: '解析失败',
      english: 'Definition could not be parsed.',
      example: '',
      phrases: [],
      deformations: []
    };
  }
};

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
