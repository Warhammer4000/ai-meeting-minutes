import { Audio, AVPlaybackStatus, Recording as ExpoRecording } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export class AudioManager {
  private recording: ExpoRecording | null = null;
  private sound: Audio.Sound | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Audio permission status:', status);
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    try {
      console.log('Setting up audio recording...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.aac',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.aac',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.MAX,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/aac',
            bitsPerSecond: 128000,
          },
        }
      );
      this.recording = recording;
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri: string; duration: number }> {
    try {
      console.log('Stopping recording...');
      if (!this.recording) {
        throw new Error('No active recording');
      }

      const status = await this.recording.getStatusAsync();
      console.log('Recording status before stop:', status);
      
      await this.recording.stopAndUnloadAsync();
      
      const uri = this.recording.getURI();
      const duration = status.durationMillis || 0;
      
      console.log('Recording stopped - URI:', uri, 'Duration:', duration);
      
      this.recording = null;

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      return { uri, duration };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async playSound(uri: string): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play sound:', error);
      throw error;
    }
  }

  async stopSound(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Failed to stop sound:', error);
    }
  }

  async convertToBase64(uri: string): Promise<{ data: string; mimeType: string }> {
    try {
      console.log('Converting audio to base64 from URI:', uri);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Determine MIME type based on file extension
      let mimeType = 'audio/aac'; // Default
      if (uri.includes('.mp3')) mimeType = 'audio/mp3';
      else if (uri.includes('.wav')) mimeType = 'audio/wav';
      else if (uri.includes('.m4a') || uri.includes('.aac')) mimeType = 'audio/aac';
      else if (uri.includes('.ogg')) mimeType = 'audio/ogg';
      else if (uri.includes('.flac')) mimeType = 'audio/flac';
      else if (uri.includes('.aiff')) mimeType = 'audio/aiff';
      
      console.log('Audio converted successfully, MIME type:', mimeType);
      return { data: base64Data, mimeType };
    } catch (error) {
      console.error('Failed to convert audio to base64:', error);
      throw error;
    }
  }

  getRecordingStatus() {
    return this.recording?.getStatusAsync();
  }

  isRecording(): boolean {
    return this.recording !== null;
  }
}