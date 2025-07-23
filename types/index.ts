export interface Recording {
  id: string;
  uri: string;
  duration: number;
  createdAt: Date;
  title: string;
  summary?: string;
  isProcessing?: boolean;
}

export interface AppSettings {
  geminiApiKey?: string;
  userEmail?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}