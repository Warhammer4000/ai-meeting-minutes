import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import RecordingButton from '@/components/RecordingButton';
import ImportButton from '@/components/ImportButton';
import { useTheme } from '@/contexts/ThemeContext';
import { AudioManager } from '@/utils/audio';
import { GeminiAPI } from '@/utils/gemini';
import { storageUtils } from '@/utils/storage';
import { Recording, AppSettings } from '@/types';

const audioManager = new AudioManager();

export default function RecordTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({});

  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(async () => {
        const status = await audioManager.getRecordingStatus();
        if (status && status.durationMillis) {
          setRecordingDuration(status.durationMillis);
        }
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const loadSettings = async () => {
    const savedSettings = await storageUtils.getSettings();
    setSettings(savedSettings);
  };

  const handleImportComplete = () => {
    // Refresh any necessary data after import
    console.log('Import completed successfully');
  };
  const startRecording = async () => {
    // Check for API key first
    if (!settings.geminiApiKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Gemini API key in Settings to enable AI-powered meeting summaries.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    try {
      const hasPermission = await audioManager.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please enable microphone permission to record audio.');
        return;
      }

      await audioManager.startRecording();
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      const { uri, duration } = await audioManager.stopRecording();
      
      const recording: Recording = {
        id: Date.now().toString(),
        uri,
        duration,
        createdAt: new Date(),
        title: `Recording ${new Date().toLocaleDateString()}`,
        isProcessing: true,
      };

      await storageUtils.saveRecording(recording);
      console.log('Recording saved:', recording);

      // Process with Gemini if API key is available
      if (settings.geminiApiKey) {
        try {
          console.log('Starting Gemini processing...');
          Alert.alert('Processing', 'Generating meeting minutes with AI...');
          
          const { data: base64Audio, mimeType } = await audioManager.convertToBase64(uri);
          console.log('Processing with Gemini API...');
          
          const geminiAPI = new GeminiAPI(settings.geminiApiKey);
          const summary = await geminiAPI.transcribeAndSummarize(uri, mimeType);
          console.log('Summary generated successfully, length:', summary.length);
          console.log('Summary generated:', summary.substring(0, 100) + '...');
          
          await storageUtils.updateRecording(recording.id, {
            summary,
            isProcessing: false,
          });
          
          Alert.alert('Success!', 'Recording saved and meeting minutes generated successfully. Check the Summaries tab to view the results.');
        } catch (error) {
          console.error('Gemini processing error:', error);
          await storageUtils.updateRecording(recording.id, { isProcessing: false });
          
          let errorMessage = 'Recording saved, but failed to generate summary.';
          if (error instanceof Error) {
            errorMessage += `\n\nError: ${error.message}`;
          }
          
          Alert.alert('Processing Error', errorMessage);
        }
      } else {
        await storageUtils.updateRecording(recording.id, { isProcessing: false });
        Alert.alert(
          'Recording Saved',
          'Recording saved successfully. Add your Gemini API key in Settings to enable automatic summarization.'
        );
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1C1C1E', '#000000'] : colors.gradient}
        style={styles.gradient}
      >
        <View style={[styles.content, { backgroundColor: 'transparent' }]}>
          <Text style={styles.title}>Voice Recorder</Text>
          <Text style={styles.subtitle}>
            Record your meetings and get AI-powered summaries
          </Text>

          <View style={styles.recordingContainer}>
            <RecordingButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              duration={recordingDuration}
            />
          </View>

          <View style={styles.importContainer}>
            <ImportButton onImportComplete={handleImportComplete} />
          </View>

          {!settings.geminiApiKey && (
            <View style={styles.apiKeyPrompt}>
              <Text style={styles.apiKeyText}>
                🔑 API Key Required
              </Text>
              <Text style={styles.apiKeySubtext}>
                Add your Gemini API key to enable AI-powered meeting summaries
              </Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <Settings size={20} color="#fff" />
                <Text style={styles.settingsButtonText}>Go to Settings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 60,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  apiKeyPrompt: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    alignItems: 'center',
  },
  apiKeyText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  apiKeySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
});