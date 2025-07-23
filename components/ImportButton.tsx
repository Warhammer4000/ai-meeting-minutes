import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { storageUtils } from '@/utils/storage';
import { Recording } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface ImportButtonProps {
  onImportComplete: () => void;
}

export default function ImportButton({ onImportComplete }: ImportButtonProps) {
  const { colors, isDark } = useTheme();

  const handleImport = async () => {
    try {
      console.log('Starting document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('Import cancelled by user');
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);

      // Validate file type
      const supportedTypes = [
        'audio/wav', 'audio/mp3', 'audio/aiff', 
        'audio/aac', 'audio/ogg', 'audio/flac',
        'audio/mpeg', 'audio/mp4', 'audio/m4a'
      ];

      if (!supportedTypes.includes(file.mimeType || '')) {
        Alert.alert(
          'Unsupported Format',
          'Please select a valid audio file (WAV, MP3, AAC, M4A, FLAC, OGG, or AIFF).'
        );
        return;
      }

      // Check file size (20MB limit for Gemini API)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size && file.size > maxSize) {
        Alert.alert(
          'File Too Large',
          'Audio file must be smaller than 20MB for AI processing.'
        );
        return;
      }

      // Copy file to app's document directory
      const fileName = `imported_${Date.now()}_${file.name}`;
      const destinationUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('Copying file from:', file.uri);
      console.log('Copying file to:', destinationUri);
      
      await FileSystem.copyAsync({
        from: file.uri,
        to: destinationUri,
      });

      // Estimate duration (we can't get exact duration without native audio APIs)
      // For now, we'll set a placeholder duration
      const estimatedDuration = 60000; // 1 minute placeholder

      const recording: Recording = {
        id: Date.now().toString(),
        uri: destinationUri,
        duration: estimatedDuration,
        createdAt: new Date(),
        title: file.name || `Imported ${new Date().toLocaleDateString()}`,
        isProcessing: false,
      };

      await storageUtils.saveRecording(recording);
      console.log('Imported recording saved:', recording);

      Alert.alert(
        'Import Successful',
        `"${recording.title}" has been imported successfully. You can now generate AI summaries for this recording.`
      );

      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Failed',
        'Failed to import the audio file. Please try again.'
      );
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 122, 255, 0.1)', 
          borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#007AFF' 
        }
      ]} 
      onPress={handleImport}
    >
      <Upload size={20} color={isDark ? '#FFFFFF' : '#007AFF'} />
      <Text style={[styles.buttonText, { color: isDark ? '#FFFFFF' : '#007AFF' }]}>Import Recording</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});