import * as FileSystem from 'expo-file-system';

// Gemini API utility for audio transcription and summarization

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';
const GEMINI_UPLOAD_PATH = '/upload/v1beta/files';
const GEMINI_MODEL_PATH = '/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_PROMPT = `Please analyze this audio recording and create comprehensive meeting minutes. Include:\n\n1. **Meeting Summary**: Brief overview of the main topics discussed\n2. **Key Discussion Points**: Main topics and decisions made\n3. **Action Items**: Any tasks, assignments, or follow-ups mentioned\n4. **Important Notes**: Critical information or deadlines\n5. **Participants**: If mentioned, list who was involved\n6. **Next Steps**: Any planned future actions or meetings\n\nFormat the response in a clear, professional manner suitable for sharing with colleagues.`;

interface FileInfo {
  exists: boolean;
  size?: number;
}

interface GeminiUploadResponse {
  file?: { uri?: string };
}

interface GeminiGenerateResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export class GeminiAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Transcribes and summarizes an audio file using Gemini API
   * @param audioUri URI of the audio file
   * @param mimeType MIME type of the audio file
   */
  async transcribeAndSummarize(audioUri: string, mimeType: string = 'audio/aac'): Promise<string> {
    try {
      const fileInfo = await this.getFileInfo(audioUri);
      if (!fileInfo.exists) throw new Error('Audio file does not exist');
      const displayName = audioUri.split('/').pop() || 'audio';
      const uploadUrl = await this.startResumableUpload(fileInfo.size || 0, mimeType, displayName);
      const fileBlob = await this.readFileBlob(audioUri, mimeType);
      const fileUri = await this.uploadFile(uploadUrl, fileBlob, fileInfo.size || 0, mimeType);
      return await this.generateContent(fileUri, mimeType);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini REST API error: ${error.message}`);
      }
      throw new Error('Unknown error in Gemini REST API');
    }
  }

  // --- Private helpers ---

  private async getFileInfo(uri: string): Promise<FileInfo> {
    return await FileSystem.getInfoAsync(uri);
  }

  private async startResumableUpload(fileSize: number, mimeType: string, displayName: string): Promise<string> {
    const url = `${GEMINI_API_BASE}${GEMINI_UPLOAD_PATH}?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(fileSize),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
    });
    if (!res.ok) {
      let errorText = '';
      try { errorText = await res.text(); } catch {};
      throw new Error(`Failed to start resumable upload: ${res.status} ${errorText}`);
    }
    const uploadUrl = res.headers.get('X-Goog-Upload-Url');
    if (!uploadUrl) throw new Error('No upload URL received from Gemini API');
    return uploadUrl;
  }

  private async readFileBlob(uri: string, mimeType: string): Promise<Blob> {
    try {
      // Preferred: fetch-blob method
      return await (await fetch(uri)).blob();
    } catch (e) {
      // Fallback: base64 to Blob
      const fileBuffer = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const byteCharacters = atob(fileBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    }
  }

  private async uploadFile(uploadUrl: string, fileBlob: Blob, fileSize: number, mimeType: string): Promise<string> {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(fileSize),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
        'Content-Type': mimeType,
      },
      body: fileBlob,
    });
    if (!res.ok) {
      let errorText = '';
      try { errorText = await res.text(); } catch {};
      throw new Error(`Failed to upload audio data: ${res.status} ${errorText}`);
    }
    const uploadJson: GeminiUploadResponse = await res.json();
    const fileUri = uploadJson?.file?.uri;
    if (!fileUri) throw new Error('No file URI returned from upload');
    return fileUri;
  }

  private async generateContent(fileUri: string, mimeType: string): Promise<string> {
    const url = `${GEMINI_API_BASE}${GEMINI_MODEL_PATH}?key=${this.apiKey}`;
    const contentBody = {
      contents: [
        {
          parts: [
            { text: GEMINI_PROMPT },
            { file_data: { mime_type: mimeType, file_uri: fileUri } }
          ]
        }
      ]
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentBody),
    });
    if (!res.ok) {
      let errorText = '';
      try { errorText = await res.text(); } catch {};
      throw new Error(`Failed to generate content: ${res.status} ${errorText}`);
    }
    const genJson: GeminiGenerateResponse = await res.json();
    const text = genJson?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim();
    return text || 'No summary generated';
  }
}