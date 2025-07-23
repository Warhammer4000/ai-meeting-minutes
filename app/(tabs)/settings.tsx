import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, Linking, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Key, Mail, ExternalLink, Save, Info, Moon, Sun } from 'lucide-react-native';
import { storageUtils } from '@/utils/storage';
import { AppSettings } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  const { colors, isDark, toggleTheme } = useTheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await storageUtils.getSettings();
      setSettings(savedSettings);
      setTempApiKey(savedSettings.geminiApiKey || '');
      setTempEmail(savedSettings.userEmail || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const newSettings: AppSettings = {
        geminiApiKey: tempApiKey.trim(),
        userEmail: tempEmail.trim(),
      };
      
      await storageUtils.saveSettings(newSettings);
      setSettings(newSettings);
      
      Alert.alert('Settings Saved', 'Your settings have been saved successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
      console.error('Error saving settings:', error);
    }
  };

  const openGeminiDocs = () => {
    Linking.openURL('https://ai.google.dev/gemini-api/docs');
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1C1C1E', '#2C2C2E'] : ['#5856D6', '#AF52DE']}
        style={styles.header}
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your app preferences</Text>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            {isDark ? <Moon size={20} color="#FF9F0A" /> : <Sun size={20} color="#FF9F0A" />}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          </View>
          
          <View style={styles.themeToggleContainer}>
            <Text style={[styles.themeLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Key size={20} color="#5856D6" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gemini API Key</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={tempApiKey}
            onChangeText={setTempApiKey}
            placeholder="Enter your Gemini API key"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity style={styles.linkButton} onPress={openGeminiDocs}>
            <ExternalLink size={16} color="#5856D6" />
            <Text style={styles.linkText}>Get your API key from Google AI Studio</Text>
          </TouchableOpacity>
          
          <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(255, 159, 10, 0.1)' : '#FFF9E6' }]}>
            <Info size={16} color="#FF9500" />
            <Text style={[styles.infoText, { color: isDark ? '#FF9F0A' : '#856404' }]}>
              Your API key is stored locally on your device and never shared. It's required for generating meeting summaries.
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color="#34C759" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Email Address (Optional)</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={tempEmail}
            onChangeText={setTempEmail}
            placeholder="your.email@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Pre-fill your email when sharing meeting summaries
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={[styles.footer, { backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(255, 255, 255, 0.5)' }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            This app uses Google's Gemini 2.5 Flash to generate intelligent meeting summaries from your recordings.
          </Text>
        </View>
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
    paddingTop: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5856D6',
    marginLeft: 6,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 8,
    lineHeight: 16,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    marginLeft: 8,
  },
  footer: {
    marginTop: 30,
    padding: 20,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
});