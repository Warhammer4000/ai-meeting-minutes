import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Share, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface SummaryCardActionsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onShare: () => void;
  onMore: () => void;
  colors: any;
}

export const SummaryCardActions: React.FC<SummaryCardActionsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onShare,
  onMore,
  colors,
}) => (
  <View style={styles.primaryActions}>
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
      onPress={isPlaying ? onPause : onPlay}
    >
      {isPlaying ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
      onPress={onShare}
    >
      <Share size={20} color="#fff" />
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.moreButton, { backgroundColor: colors.surface }]}
      onPress={onMore}
    >
      <MoreHorizontal size={20} color={colors.text} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
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
});
