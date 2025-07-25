import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Trash2, Clock, Brain, Loader as Loader2, Copy, CreditCard as Edit3, Check, X, Share } from 'lucide-react-native';
import { SummaryCardActions } from './SummaryCardActions';
import { SummaryMarkdown } from './SummaryMarkdown';
import { summaryCardStyles as styles } from './SummaryCard.styles';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Recording } from '@/types';

import { useTheme } from '@/contexts/ThemeContext';
import { MarkdownProcessor } from '@/utils/markdownProcessor';
import { storageUtils } from '@/utils/storage';

interface SummaryCardProps {
  recording: Recording;
  onPlay: (uri: string) => void;
  onStop: () => void;
  onDelete: (id: string) => void;
  onGenerateSummary: (id: string) => void;
  onUpdate: () => void;
  isPlaying: boolean;
  isGeneratingSummary: boolean;
}

export default function SummaryCard({
  recording,
  onPlay,
  onStop,
  onDelete,
  onGenerateSummary,
  onUpdate,
  isPlaying,
  isGeneratingSummary,
}: SummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(recording.title);
  const [showActions, setShowActions] = useState(false);
  const { colors, isDark } = useTheme();

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle.trim() !== recording.title) {
      try {
        await storageUtils.updateRecording(recording.id, { title: editTitle.trim() });
        onUpdate();
      } catch (error) {
        Alert.alert('Error', 'Failed to update recording title.');
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(recording.title);
    setIsEditing(false);
  };

  // Share audio file
  const handleShareAudio = async () => {
    try {
      // Try to use the actual recording.uri if available (should include extension)
      let audioFile = recording.uri;
      let mimeType = 'audio/aac'; // Default
      if (!audioFile) {
        // Fallback to old storage pattern
        audioFile = FileSystem.documentDirectory + 'recordings/' + recording.id;
      }
      // Guess MIME type from extension
      if (audioFile.endsWith('.mp3')) mimeType = 'audio/mp3';
      else if (audioFile.endsWith('.wav')) mimeType = 'audio/wav';
      else if (audioFile.endsWith('.m4a') || audioFile.endsWith('.aac')) mimeType = 'audio/aac';
      else if (audioFile.endsWith('.ogg')) mimeType = 'audio/ogg';
      else if (audioFile.endsWith('.flac')) mimeType = 'audio/flac';
      else if (audioFile.endsWith('.aiff')) mimeType = 'audio/aiff';

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(audioFile, {
        mimeType,
        dialogTitle: `Share ${recording.title}`,
      });
    } catch (error) {
      console.error('Audio share error:', error);
      Alert.alert('Share Failed', 'Failed to share the audio file. Please try again.');
    }
  };


  const handleCopy = async () => {
    if (!recording.summary) {
      Alert.alert('No Summary', 'This recording has not been processed yet.');
      return;
    }

    try {
      await Clipboard.setStringAsync(recording.summary);
      Alert.alert('Copied!', 'Meeting summary copied to clipboard.');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy summary to clipboard.');
    }
  };

  const handleNativeShare = async () => {
    if (!recording.summary) {
      Alert.alert('No Summary', 'This recording has not been processed yet.');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device.');
        return;
      }

      const shareMessage = MarkdownProcessor.createShareMessage(
        recording.title,
        recording.summary,
        recording.createdAt
      );

      // Create a temporary file for sharing
      const fileName = `meeting-summary-${Date.now()}.txt`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      // Write the share message to the temporary file
      await FileSystem.writeAsStringAsync(fileUri, shareMessage, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: `Share ${recording.title}`,
        UTI: 'public.plain-text',
      });
      
      // Clean up the temporary file
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }
    } catch (error) {
      console.error('Native share error:', error);
      Alert.alert('Share Failed', 'Failed to share the summary. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(recording.id) },
      ]
    );
  };

  const handleGenerateSummary = () => {
    if (recording.summary) {
      Alert.alert(
        'Regenerate Summary',
        'This recording already has a summary. Do you want to generate a new one?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', onPress: () => onGenerateSummary(recording.id) },
        ]
      );
    } else {
      onGenerateSummary(recording.id);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.titleInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Recording title"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                onSubmitEditing={handleSaveTitle}
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleSaveTitle} style={[styles.editButton, { backgroundColor: colors.success }]}>
                  <Check size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelEdit} style={[styles.editButton, { backgroundColor: colors.error }]}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {recording.title}
              </Text>
              <Edit3 size={16} color={colors.textSecondary} style={styles.editIcon} />
            </TouchableOpacity>
          )}
          
          <View style={styles.metaContainer}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatDuration(recording.duration)}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatDate(recording.createdAt)}</Text>
          </View>
        </View>

        {/* Primary Actions */}
        <SummaryCardActions
          isPlaying={isPlaying}
          onPlay={() => onPlay(recording.uri)}
          onPause={onStop}
          onShare={handleShareAudio}
          onMore={() => setShowActions(!showActions)}
          colors={colors}
        />
      </View>

      {/* Processing Indicator */}
      {recording.isProcessing && (
        <View style={[styles.processingContainer, { backgroundColor: isDark ? 'rgba(255, 159, 10, 0.1)' : '#FFF3CD' }]}>
          <Text style={[styles.processingText, { color: isDark ? '#FF9F0A' : '#856404' }]}>🤖 Generating AI summary...</Text>
        </View>
      )}

      {/* Action Menu */}
      {showActions && (
        <View style={[styles.actionMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => {
              handleGenerateSummary();
              setShowActions(false);
            }}
            disabled={isGeneratingSummary}
          >
            {isGeneratingSummary ? (
              <Loader2 size={18} color={colors.warning} />
            ) : (
              <Brain size={18} color={colors.warning} />
            )}
            <Text style={[styles.actionText, { color: colors.text }]}>
              {recording.summary ? 'Regenerate Summary' : 'Generate Summary'}
            </Text>
          </TouchableOpacity>

          {recording.summary && (
            <>
              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => {
                  handleCopy();
                  setShowActions(false);
                }}
              >
                <Copy size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>Copy Summary</Text>
              </TouchableOpacity>



              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => {
                  handleNativeShare();
                  setShowActions(false);
                }}
              >
                <Share size={18} color={colors.secondary} />
                <Text style={[styles.actionText, { color: colors.text }]}>Share Summary</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => {
              handleDelete();
              setShowActions(false);
            }}
          >
            <Trash2 size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Delete Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Section */}
      {recording.summary && (
        <SummaryMarkdown
          summary={recording.summary}
          expanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          colors={colors}
          isDark={isDark}
        />
      )}
      
      {!recording.summary && !recording.isProcessing && (
        <View style={[styles.noSummaryContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.noSummaryText, { color: colors.textSecondary }]}>No AI summary available</Text>
        </View>
      )}
    </View>
  );
}

