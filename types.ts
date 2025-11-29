export interface Flashcard {
  id: string;
  front: string; // The English term
  back: string;  // The Vietnamese definition
  example: string; // An example sentence
  mastered: boolean;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  createdAt: number;
}

export type ViewState = 'DASHBOARD' | 'DECK_VIEW' | 'STUDY_MODE';

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

// For Gemini Generation
export interface GeneratedCardData {
  term: string;
  definition: string;
  example: string;
}