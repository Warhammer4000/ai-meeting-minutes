import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFocusEffect } from '@react-navigation/native';
import SummaryCard from '@/components/SummaryCard';
import ImportButton from '@/components/ImportButton';
import { useTheme } from '@/contexts/ThemeContext';
import { storageUtils } from '@/utils/storage';
import { AudioManager } from '@/utils/audio';
import { GeminiAPI } from '@/utils/gemini';
import { Recording } from '@/types';

const audioManager = new AudioManager();

export default function SummariesTab() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [generatingSummaryId, setGeneratingSummaryId] = useState<string | null>(null);

  const { colors, isDark } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
    }, [])
  );

  const loadRecordings = async () => {
    try {
      const savedRecordings = await storageUtils.getRecordings();
      console.log('Loaded recordings:', savedRecordings.length);
      setRecordings(savedRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecordings();
    setRefreshing(false);
  };

  const handlePlay = async (uri: string, recordingId: string) => {
    try {
      if (playingId) {
        await audioManager.stopSound();
      }
      
      await audioManager.playSound(uri);
      setPlayingId(recordingId);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleStop = async () => {
    try {
      await audioManager.stopSound();
      setPlayingId(null);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (playingId === id) {
        await handleStop();
      }
      
      await storageUtils.deleteRecording(id);
      await loadRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  const handleGenerateSummary = async (recordingId: string) => {
    try {
      setGeneratingSummaryId(recordingId);
      
      // Get settings to check for API key
      const settings = await storageUtils.getSettings();
      if (!settings.geminiApiKey) {
        Alert.alert(
          'API Key Required',
          'Please add your Gemini API key in Settings to generate summaries.'
        );
        return;
      }

      // Find the recording
      const recording = recordings.find(r => r.id === recordingId);
      if (!recording) {
        Alert.alert('Error', 'Recording not found.');
        return;
      }

      // Update recording to show processing state
      await storageUtils.updateRecording(recordingId, { isProcessing: true });
      await loadRecordings();

      console.log('Starting manual Gemini processing for:', recording.title);
      
      // Determine MIME type from file extension
      let mimeType = 'audio/aac';
      if (recording.uri.includes('.mp3')) mimeType = 'audio/mp3';
      else if (recording.uri.includes('.wav')) mimeType = 'audio/wav';
      else if (recording.uri.includes('.m4a') || recording.uri.includes('.aac')) mimeType = 'audio/aac';
      else if (recording.uri.includes('.ogg')) mimeType = 'audio/ogg';
      else if (recording.uri.includes('.flac')) mimeType = 'audio/flac';
      else if (recording.uri.includes('.aiff')) mimeType = 'audio/aiff';
      
      const geminiAPI = new GeminiAPI(settings.geminiApiKey);
      const summary = await geminiAPI.transcribeAndSummarize(recording.uri, mimeType);
      console.log('Summary generated successfully, length:', summary.length);
      
      await storageUtils.updateRecording(recordingId, {
        summary,
        isProcessing: false,
      });
      
      await loadRecordings();
      
      Alert.alert(
        'Success!', 
        'AI meeting minutes generated successfully!'
      );
    } catch (error) {
      console.error('Manual summary generation error:', error);
      
      // Update recording to remove processing state
      await storageUtils.updateRecording(recordingId, { isProcessing: false });
      await loadRecordings();
      
      let errorMessage = 'Failed to generate summary.';
      if (error instanceof Error) {
        errorMessage += `\n\nError: ${error.message}`;
      }
      
      Alert.alert('Processing Error', errorMessage);
    } finally {
      setGeneratingSummaryId(null);
    }
  };

  const renderRecording = ({ item }: { item: Recording }) => (
    <SummaryCard
      recording={item}
      onPlay={(uri) => handlePlay(uri, item.id)}
      onStop={handleStop}
      onDelete={handleDelete}
      onGenerateSummary={handleGenerateSummary}
      isPlaying={playingId === item.id}
      isGeneratingSummary={generatingSummaryId === item.id}
    />
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#30D158', '#32D74B'] : ['#34C759', '#30D158']}
        style={styles.header}
      >
        <Text style={styles.title}>Meeting Summaries</Text>
        <Text style={styles.subtitle}>
          {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={styles.importButtonContainer}>
          <ImportButton onImportComplete={loadRecordings} />
        </View>
        
        {recordings.length > 0 ? (
          <FlatList
            data={recordings}
            renderItem={renderRecording}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No recordings yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start recording to create your first meeting summary
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  importButtonContainer: {
    paddingTop: 20,
  },
  listContainer: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});