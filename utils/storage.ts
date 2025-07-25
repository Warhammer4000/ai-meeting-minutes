import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Recording, AppSettings } from '@/types';

const RECORDINGS_KEY = 'recordings';
const SETTINGS_KEY = 'settings';
const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';
const METADATA_DIR = FileSystem.documentDirectory + 'documents/';

async function ensureDirExists(dir: string) {
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export const storageUtils = {
  async getRecordings(): Promise<Recording[]> {
    try {
      await ensureDirExists(RECORDINGS_DIR);
      await ensureDirExists(METADATA_DIR);
      const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
      const recordings: Recording[] = [];
      for (const file of files) {
        const metadataFile = METADATA_DIR + file + '.json';
        try {
          const metadata = await FileSystem.readAsStringAsync(metadataFile);
          const parsed = JSON.parse(metadata);
          // Parse date fields if needed
          if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
          recordings.push(parsed);
        } catch (e) {
          // If metadata missing/corrupt, skip
          console.warn('Missing/corrupt metadata for', file);
        }
      }
      return recordings;
    } catch (error) {
      console.error('Error getting recordings:', error);
      return [];
    }
  },

  async saveRecording(recording: Recording, audioUri: string): Promise<void> {
    try {
      await ensureDirExists(RECORDINGS_DIR);
      await ensureDirExists(METADATA_DIR);
      // Save audio file
      const audioDest = RECORDINGS_DIR + recording.id;
      await FileSystem.copyAsync({ from: audioUri, to: audioDest });
      // Save metadata
      const metadataDest = METADATA_DIR + recording.id + '.json';
      await FileSystem.writeAsStringAsync(metadataDest, JSON.stringify(recording));
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  },

  async updateRecording(id: string, updates: Partial<Recording>): Promise<void> {
    try {
      const metadataFile = METADATA_DIR + id + '.json';
      const metadata = await FileSystem.readAsStringAsync(metadataFile);
      const recording = JSON.parse(metadata);
      const updated = { ...recording, ...updates };
      await FileSystem.writeAsStringAsync(metadataFile, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating recording:', error);
    }
  },

  async deleteRecording(id: string): Promise<void> {
    try {
      const audioFile = RECORDINGS_DIR + id;
      const metadataFile = METADATA_DIR + id + '.json';
      // Delete audio file
      await FileSystem.deleteAsync(audioFile, { idempotent: true });
      // Delete metadata
      await FileSystem.deleteAsync(metadataFile, { idempotent: true });
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await AsyncStorage.getItem(SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  async getTheme(): Promise<'light' | 'dark'> {
    try {
      const theme = await AsyncStorage.getItem('theme');
      return theme === 'dark' ? 'dark' : 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  },

  async saveTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      await AsyncStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }
};