import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Upload } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { styles } from './ImportButton.styles';
import { useImportRecording } from './useImportRecording';

interface ImportButtonProps {
  onImportComplete: () => void;
}

export default function ImportButton({ onImportComplete }: ImportButtonProps) {
  const { isDark } = useTheme();
  const { handleImport } = useImportRecording({ onImportComplete });

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 122, 255, 0.1)', 
          borderColor: isDark ? 'rgba(136, 106, 106, 0.3)' : '#007AFF' 
        }
      ]} 
      onPress={handleImport}
    >
      <Upload size={20} color={isDark ? '#FFFFFF' : '#007AFF'} />
      <Text style={[styles.buttonText, { color: isDark ? '#FFFFFF' : '#007AFF' }]}>Import Recording</Text>
    </TouchableOpacity>
  );
}