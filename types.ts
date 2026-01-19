
export interface Article {
  id: string;
  date: string;
  topic: string;
  title: string;
  content: string;
  summary: string;
  translation?: string;
}

export interface Headline {
  title: string;
  source: string;
  url: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  partOfSpeech: string;
  chinese: string;
  english: string;
  example: string;
  phrases: string[];
  deformations: string[];
  addedAt: string;
}

export interface StudySession {
  date: string;
  articleId: string;
  title: string;
}

export enum AppState {
  PICKING_TOPIC = 'PICKING_TOPIC',
  LOADING_ARTICLE = 'LOADING_ARTICLE',
  READING = 'READING',
}

export const TOPIC_OPTIONS = [
  "Technology & Innovation",
  "Global Economics",
  "Culture & Arts",
  "Scientific Discovery",
  "Environmental Policy",
  "Modern Sociology"
];
