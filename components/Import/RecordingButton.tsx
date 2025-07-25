import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Mic, Square, Loader as Loader2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

interface RecordingButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  duration: number;
}

export default function RecordingButton({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
  duration,
}: RecordingButtonProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(withTiming(1.1, { duration: 1000 }), -1, true);
    } else {
      scale.value = withTiming(1);
    }
  }, [isRecording, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (isProcessing) return;
    
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      )}
      
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.recordingButton,
            isProcessing && styles.processingButton,
          ]}
          onPress={handlePress}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 size={32} color="#fff" />
          ) : isRecording ? (
            <Square size={32} color="#fff" fill="#fff" />
          ) : (
            <Mic size={32} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.instruction}>
        {isProcessing 
          ? 'Processing recording...' 
          : isRecording 
            ? 'Tap to stop recording' 
            : 'Tap to start recording'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 20,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  processingButton: {
    backgroundColor: '#FF9500',
  },
  instruction: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});