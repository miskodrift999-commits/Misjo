export interface SelfieAnalysis {
  mood: string;
  styleFeedback: string;
  confidenceBooster: string;
  dominantColors: string[]; // hex codes
  outfitDescription: string;
  vibesRating: number; // percentage (e.g. 98%)
  tags: string[];
}

export interface SelfiePhoto {
  id: string;
  url: string; // Base64 data URL
  timestamp: number;
  note: string;
  analysis?: SelfieAnalysis;
  isAnalyzing?: boolean;
  error?: string;
}
