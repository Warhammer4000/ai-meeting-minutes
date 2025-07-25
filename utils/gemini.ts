import * as FileSystem from 'expo-file-system';

export class GeminiAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribeAndSummarize(audioUri: string, mimeType: string = 'audio/aac'): Promise<string> {
    try {
      // 1. Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      const fileSize = fileInfo.size ?? 0;
      const displayName = audioUri.split('/').pop() || 'audio';

      // 2. Start resumable upload
      console.log('[GeminiAPI] Starting resumable upload', {
        url: `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': String(fileSize),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: { display_name: displayName } })
      });
      let startRes;
      try {
        startRes = await fetch(
          `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'X-Goog-Upload-Protocol': 'resumable',
              'X-Goog-Upload-Command': 'start',
              'X-Goog-Upload-Header-Content-Length': String(fileSize),
              'X-Goog-Upload-Header-Content-Type': mimeType,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file: { display_name: displayName } }),
          }
        );
        console.log('[GeminiAPI] Resumable upload response', startRes.status, startRes.statusText, startRes.headers);
      } catch (err) {
        console.error('[GeminiAPI] Network error during start upload:', err);
        throw err;
      }
      if (!startRes.ok) {
        let errorText = '';
        try { errorText = await startRes.text(); } catch {};
        console.error('[GeminiAPI] Start upload failed', startRes.status, errorText);
        throw new Error('Failed to start resumable upload');
      }
      // 3. Get upload URL from headers
      const uploadUrl = startRes.headers.get('X-Goog-Upload-Url');
      console.log('[GeminiAPI] Upload URL:', uploadUrl);
      if (!uploadUrl) {
        throw new Error('No upload URL received from Gemini API');
      }

      // 4. Read file as Blob (preferred for React Native/Expo)
      let fileBlob: Blob | null = null;
      try {
        // Try fetch-blob method (works in Expo bare and many managed environments)
        fileBlob = await (await fetch(audioUri)).blob();
        console.log('[GeminiAPI] File Blob created via fetch:', fileBlob);
      } catch (e) {
        console.warn('[GeminiAPI] Could not create Blob via fetch, falling back to base64->Blob:', e);
      }
      if (!fileBlob) {
        // Fallback: convert base64 to Blob manually (for older Expo Go)
        const fileBuffer = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
        const byteCharacters = atob(fileBuffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        fileBlob = new Blob([byteArray], { type: mimeType });
        console.log('[GeminiAPI] File Blob created via base64 fallback:', fileBlob);
      }

      // 5. Upload the actual bytes
      console.log('[GeminiAPI] Uploading binary data as Blob', { uploadUrl, type: fileBlob.type, size: fileBlob.size });
      let uploadRes;
      try {
        uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Length': String(fileSize),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize',
            'Content-Type': mimeType,
          },
          body: fileBlob,
        });
        console.log('[GeminiAPI] Upload binary response', uploadRes.status, uploadRes.statusText);
      } catch (err) {
        console.error('[GeminiAPI] Network error during binary upload:', err);
        throw err;
      }
      if (!uploadRes.ok) {
        let errorText = '';
        try { errorText = await uploadRes.text(); } catch {};
        console.error('[GeminiAPI] Binary upload failed', uploadRes.status, errorText);
        throw new Error('Failed to upload audio data');
      }
      const uploadJson = await uploadRes.json();
      const fileUri = uploadJson?.file?.uri;
      console.log('[GeminiAPI] Uploaded file URI:', fileUri);
      if (!fileUri) {
        throw new Error('No file URI returned from upload');
      }

      // 6. Prepare prompt and request body
      const prompt = `Please analyze this audio recording and create comprehensive meeting minutes. Include:\n\n1. **Meeting Summary**: Brief overview of the main topics discussed\n2. **Key Discussion Points**: Main topics and decisions made\n3. **Action Items**: Any tasks, assignments, or follow-ups mentioned\n4. **Important Notes**: Critical information or deadlines\n5. **Participants**: If mentioned, list who was involved\n6. **Next Steps**: Any planned future actions or meetings\n\nFormat the response in a clear, professional manner suitable for sharing with colleagues.`;
      const contentBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              { file_data: { mime_type: mimeType, file_uri: fileUri } }
            ]
          }
        ]
      };

      // 7. Generate content
      console.log('[GeminiAPI] Generating content with file URI', fileUri);
      let genRes;
      try {
        genRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(contentBody),
          }
        );
        console.log('[GeminiAPI] Generate content response', genRes.status, genRes.statusText);
      } catch (err) {
        console.error('[GeminiAPI] Network error during generateContent:', err);
        throw err;
      }
      if (!genRes.ok) {
        let errorText = '';
        try { errorText = await genRes.text(); } catch {};
        console.error('[GeminiAPI] Generate content failed', genRes.status, errorText);
        throw new Error('Failed to generate content from Gemini API');
      }
      const genJson = await genRes.json();
      // Try to extract the summary text
      const text = genJson?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n').trim();
      console.log('[GeminiAPI] Final summary text:', text);
      return text || 'No summary generated';
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini REST API error: ${error.message}`);
      }
      throw new Error('Unknown error in Gemini REST API');
    }
  }
}