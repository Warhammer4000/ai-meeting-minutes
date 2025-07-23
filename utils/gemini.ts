import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import * as FileSystem from 'expo-file-system';

export class GeminiAPI {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async transcribeAndSummarize(audioUri: string, mimeType: string = 'audio/aac'): Promise<string> {
    try {
      console.log('Starting Gemini 2.5 Flash API call...');
      console.log('Audio URI:', audioUri);
      console.log('MIME type:', mimeType);
      
      // Check file size to determine whether to use Files API or inline data
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      const fileSizeInMB = (fileInfo.size || 0) / (1024 * 1024);
      console.log('File size:', fileSizeInMB.toFixed(2), 'MB');

      const prompt = `
Please analyze this audio recording and create comprehensive meeting minutes. Include:

1. **Meeting Summary**: Brief overview of the main topics discussed
2. **Key Discussion Points**: Main topics and decisions made
3. **Action Items**: Any tasks, assignments, or follow-ups mentioned
4. **Important Notes**: Critical information or deadlines
5. **Participants**: If mentioned, list who was involved
6. **Next Steps**: Any planned future actions or meetings

Format the response in a clear, professional manner suitable for sharing with colleagues.
      `;

      let response;

      // Use Files API for files larger than 15MB to leave room for prompt and other data
      if (fileSizeInMB > 15) {
        console.log('Using Files API for large file...');
        
        // Upload file using Files API
        const uploadedFile = await this.ai.files.upload({
          file: audioUri,
          config: { mimeType: mimeType },
        });
        
        console.log('File uploaded successfully:', uploadedFile.uri);
        
        // Generate content using uploaded file
        response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: createUserContent([
            createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
            prompt
          ]),
        });
        
        console.log('Cleaning up uploaded file...');
        // Clean up the uploaded file
        try {
          await this.ai.files.delete(uploadedFile.name);
          console.log('Uploaded file cleaned up successfully');
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file:', cleanupError);
        }
      } else {
        console.log('Using inline data for smaller file...');
        
        // Convert to base64 for inline data
        const base64Data = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('Audio converted to base64, length:', base64Data.length);
        
        const contents = [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ];

        response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
        });
      }

      console.log('Gemini API Success Response received');
      const result = response.text;
      console.log('Generated summary length:', result.length);
      
      return result || 'No summary generated';
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
        } else if (error.message.includes('UNSUPPORTED_MEDIA_TYPE')) {
          throw new Error('Audio format not supported. Please try recording again.');
        } else if (error.message.includes('REQUEST_TOO_LARGE')) {
          throw new Error('Audio file too large. Please record a shorter audio clip.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          throw new Error('Permission denied. Please check your API key permissions.');
        }
      }
      
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}