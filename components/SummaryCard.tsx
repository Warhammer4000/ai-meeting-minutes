import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Play, Pause, Mail, Trash2, Clock, Brain, Loader as Loader2, Copy } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { Recording } from '@/types';
import * as MailComposer from 'expo-mail-composer';
import { useTheme } from '@/contexts/ThemeContext';

interface SummaryCardProps {
  recording: Recording;
  onPlay: (uri: string) => void;
  onStop: () => void;
  onDelete: (id: string) => void;
  onGenerateSummary: (id: string) => void;
  isPlaying: boolean;
  isGeneratingSummary: boolean;
}

export default function SummaryCard({
  recording,
  onPlay,
  onStop,
  onDelete,
  onGenerateSummary,
  isPlaying,
  isGeneratingSummary,
}: SummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      console.error('Copy error:', error);
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
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{recording.title}</Text>
          <View style={styles.metaContainer}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatDuration(recording.duration)}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatDate(recording.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
            onPress={() => isPlaying ? onStop() : onPlay(recording.uri)}
          >
            {isPlaying ? <Pause size={20} color="#007AFF" /> : <Play size={20} color="#007AFF" />}
          </TouchableOpacity>
          
          {recording.summary && (
            <TouchableOpacity style={[styles.controlButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]} onPress={handleShare}>
              <Mail size={20} color="#34C759" />
            </TouchableOpacity>
          )}
          
          {recording.summary && (
            <TouchableOpacity style={[styles.controlButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]} onPress={handleCopy}>
              <Copy size={20} color="#FF9500" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' },
              isGeneratingSummary && { backgroundColor: isDark ? '#4A3A00' : '#FFF3CD' }
            ]} 
            onPress={handleGenerateSummary}
            disabled={isGeneratingSummary}
          >
            {isGeneratingSummary ? (
              <Loader2 size={20} color="#FF9500" />
            ) : (
              <Brain size={20} color="#FF9500" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]} onPress={handleDelete}>
            <Trash2 size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {recording.isProcessing && (
        <View style={[styles.processingContainer, { backgroundColor: isDark ? '#4A3A00' : '#FFF3CD' }]}>
          <Text style={[styles.processingText, { color: isDark ? '#FF9F0A' : '#856404' }]}>🤖 Generating AI summary...</Text>
        </View>
      )}

      {recording.summary && (
        <TouchableOpacity 
          style={styles.summaryContainer}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>📝 AI Meeting Summary</Text>
          <View style={[styles.markdownContainer, !isExpanded && styles.collapsedMarkdown]}>
            <Markdown
              style={createMarkdownStyles(colors, isDark)}
            >
              {recording.summary}
            </Markdown>
          </View>
          {!isExpanded && recording.summary.length > 150 && (
            <Text style={[styles.expandText, { color: colors.primary }]}>Tap to read more...</Text>
          )}
        </TouchableOpacity>
      )}
      
      {!recording.summary && !recording.isProcessing && (
        <View style={[styles.noSummaryContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA' }]}>
          <Text style={[styles.noSummaryText, { color: colors.textSecondary }]}>No AI summary available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    textAlign: 'center',
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  markdownContainer: {
    flex: 1,
  },
  collapsedMarkdown: {
    maxHeight: 80,
    overflow: 'hidden',
  },
  expandText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  noSummaryContainer: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  noSummaryText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

const createMarkdownStyles = (colors: any, isDark: boolean) => ({
  body: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  heading1: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  heading3: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
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
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: isDark ? '#3A3A3C' : '#F5F5F5',
    color: colors.primary,
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  code_block: {
    backgroundColor: isDark ? '#3A3A3C' : '#F5F5F5',
    color: colors.text,
    fontSize: 13,
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    fontStyle: 'italic',
  },
});