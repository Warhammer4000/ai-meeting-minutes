import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, RefreshControl, Alert, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Calendar, Filter, X } from 'lucide-react-native';
import SummaryCard from '@/components/Summary/SummaryCard';
import ImportButton from '@/components/Import/ImportButton';
import { useTheme } from '@/contexts/ThemeContext';
import { storageUtils } from '@/utils/storage';
import { AudioManager } from '@/utils/audio';
import { GeminiAPI } from '@/utils/gemini';
import { Recording } from '@/types';

const audioManager = new AudioManager();

export default function SummariesTab() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [generatingSummaryId, setGeneratingSummaryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

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
      applyFilters(savedRecordings, searchQuery, dateFilter);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const applyFilters = (recordingsList: Recording[], query: string, filter: string) => {
    let filtered = [...recordingsList];

    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(recording =>
        recording.title.toLowerCase().includes(query.toLowerCase()) ||
        (recording.summary && recording.summary.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        filtered = filtered.filter(recording => recording.createdAt >= today);
        break;
      case 'week':
        filtered = filtered.filter(recording => recording.createdAt >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(recording => recording.createdAt >= monthAgo);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredRecordings(filtered);
  };

  useEffect(() => {
    applyFilters(recordings, searchQuery, dateFilter);
  }, [recordings, searchQuery, dateFilter]);

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
        setGeneratingSummaryId(null);
        return;
      }

      // Find the recording
      const recording = recordings.find(r => r.id === recordingId);
      if (!recording) {
        Alert.alert('Error', 'Recording not found.');
        setGeneratingSummaryId(null);
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
      
      Alert.alert('Success!', 'AI meeting minutes generated successfully!');
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
      onUpdate={loadRecordings}
      isPlaying={playingId === item.id}
      isGeneratingSummary={generatingSummaryId === item.id}
    />
  );

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

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
          {filteredRecordings.length} of {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Search and Filter Section */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search recordings or summaries..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Calendar size={16} color={colors.primary} />
              <Text style={[styles.filterButtonText, { color: colors.primary }]}>
                {getFilterLabel(dateFilter)}
              </Text>
              <Filter size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={[styles.filterOptions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {['all', 'today', 'week', 'month'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    dateFilter === filter && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setDateFilter(filter as any);
                    setShowFilters(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: dateFilter === filter ? colors.primary : colors.text }
                  ]}>
                    {getFilterLabel(filter)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.importButtonContainer}>
          <ImportButton onImportComplete={loadRecordings} />
        </View>
        
        {filteredRecordings.length > 0 ? (
          <FlatList
            data={filteredRecordings}
            renderItem={renderRecording}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {recordings.length === 0 ? 'No recordings yet' : 'No recordings found'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {recordings.length === 0 
                ? 'Start recording to create your first meeting summary'
                : 'Try adjusting your search or filter criteria'
              }
            </Text>
          </View>
        )}
        
        {generatingSummaryId && (
          <View style={[styles.globalProcessingOverlay, { backgroundColor: colors.background }]}>
            <View style={[styles.globalProcessingContainer, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.globalProcessingText, { color: colors.text }]}>🤖 Generating AI Summary</Text>
              <Text style={[styles.globalProcessingSubtext, { color: colors.textSecondary }]}>
                This may take a few moments...
              </Text>
            </View>
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
  searchSection: {
    paddingTop: 20,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    marginRight: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  importButtonContainer: {
    paddingTop: 10,
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
  globalProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  globalProcessingContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  globalProcessingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  globalProcessingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});