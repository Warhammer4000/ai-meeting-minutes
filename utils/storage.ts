import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, AppSettings } from '@/types';

const RECORDINGS_KEY = 'recordings';
const SETTINGS_KEY = 'settings';

export const storageUtils = {
  async getRecordings(): Promise<Recording[]> {
    try {
      const recordings = await AsyncStorage.getItem(RECORDINGS_KEY);
      return recordings ? JSON.parse(recordings).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt)
      })) : [];
    } catch (error) {
      console.error('Error getting recordings:', error);
      return [];
    }
  },

  async saveRecording(recording: Recording): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      recordings.unshift(recording);
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  },

  async updateRecording(id: string, updates: Partial<Recording>): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const index = recordings.findIndex(r => r.id === id);
      if (index !== -1) {
        recordings[index] = { ...recordings[index], ...updates };
        await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
      }
    } catch (error) {
      console.error('Error updating recording:', error);
    }
  },

  async deleteRecording(id: string): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const filtered = recordings.filter(r => r.id !== id);
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(filtered));
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