import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface SummaryMarkdownProps {
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
  isDark: boolean;
}

export const SummaryMarkdown: React.FC<SummaryMarkdownProps> = ({
  summary,
  expanded,
  onToggle,
  colors,
  isDark,
}) => (
  <TouchableOpacity 
    style={styles.summaryContainer}
    onPress={onToggle}
  >
    <Text style={[styles.summaryLabel, { color: colors.primary }]}>📝 AI Meeting Summary</Text>
    <View style={[styles.markdownContainer, !expanded && styles.collapsedMarkdown]}>
      <Markdown style={createMarkdownStyles(colors, isDark)}>
        {summary}
      </Markdown>
    </View>
    {!expanded && summary.length > 150 && (
      <Text style={[styles.expandText, { color: colors.primary }]}>Tap to read more...</Text>
    )}
  </TouchableOpacity>
);

// You may want to move this to a utils file if reused
function createMarkdownStyles(colors: any, isDark: boolean) {
  return {
    body: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    heading1: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
      marginTop: 8,
    },
    heading2: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 6,
      marginTop: 6,
    },
    bullet_list: {
      marginLeft: 12,
    },
    list_item: {
      fontSize: 15,
      color: colors.text,
    },
    code_inline: {
      backgroundColor: isDark ? '#222' : '#f4f4f4',
      color: colors.text,
      borderRadius: 4,
      padding: 2,
    },
    blockquote: {
      color: colors.textSecondary,
      borderLeftColor: colors.primary,
      borderLeftWidth: 3,
      paddingLeft: 8,
      marginVertical: 8,
    },
    strong: {
      fontWeight: 'bold',
      color: colors.text,
    },
  };
}

const styles = StyleSheet.create({
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
    marginTop: 6,
    textAlign: 'right',
  },
});
