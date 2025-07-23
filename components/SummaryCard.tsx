import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { Play, Pause, Mail, Trash2, Clock, Brain, Loader as Loader2, Copy, Share, CreditCard as Edit3, Check, X, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Recording } from '@/types';
import * as MailComposer from 'expo-mail-composer';
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

  const handleShare = async () => {
    if (!recording.summary) {
      Alert.alert('No Summary', 'This recording has not been processed yet.');
      return;
    }

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Email Not Available', 'Email is not configured on this device.');
      return;
    }

    await MailComposer.composeAsync({
      subject: `Meeting Minutes - ${recording.title}`,
      body: `Meeting Minutes\n\n${recording.summary}\n\nGenerated on ${formatDate(recording.createdAt)}`,
    });
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
        <View style={styles.primaryActions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => isPlaying ? onStop() : onPlay(recording.uri)}
          >
            {isPlaying ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.moreButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowActions(!showActions)}
          >
            <MoreHorizontal size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
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
                  handleShare();
                  setShowActions(false);
                }}
              >
                <Mail size={18} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.text }]}>Email Summary</Text>
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
        <TouchableOpacity 
          style={styles.summaryContainer}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>📝 AI Meeting Summary</Text>
          <View style={[styles.markdownContainer, !isExpanded && styles.collapsedMarkdown]}>
            <Markdown style={createMarkdownStyles(colors, isDark)}>
              {recording.summary}
            </Markdown>
          </View>
          {!isExpanded && recording.summary.length > 150 && (
            <Text style={[styles.expandText, { color: colors.primary }]}>Tap to read more...</Text>
          )}
        </TouchableOpacity>
      )}
      
      {!recording.summary && !recording.isProcessing && (
        <View style={[styles.noSummaryContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.noSummaryText, { color: colors.textSecondary }]}>No AI summary available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    lineHeight: 24,
  },
  editIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  editContainer: {
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  processingContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  markdownContainer: {
    flex: 1,
  },
  collapsedMarkdown: {
    maxHeight: 100,
    overflow: 'hidden',
  },
  expandText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  noSummaryContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noSummaryText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

const createMarkdownStyles = (colors: any, isDark: boolean) => ({
  body: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  strong: {
    fontWeight: '600',
    color: colors.text,
  },
  em: {
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  list_item: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 10,
  },
  ordered_list: {
    marginBottom: 10,
  },
  code_inline: {
    backgroundColor: isDark ? '#3A3A3C' : '#F5F5F5',
    color: colors.primary,
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: isDark ? '#3A3A3C' : '#F5F5F5',
    color: colors.text,
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  blockquote: {
    backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 10,
    fontStyle: 'italic',
  },
});