import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Tts from 'react-native-tts';
import { RootStackParamList } from '../navigation/types';
import { storage, StorageKeys } from '../services/storage';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { GoOneButton } from '../components/GoOneUI';

type LanguageSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LanguageSelection'>;

const LANGUAGES = [
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', accent: Colors.magentaPrimary },
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', accent: Colors.bluePrimary },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', accent: Colors.orangePrimary },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', accent: Colors.purplePrimary },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳', accent: Colors.greenPrimary },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', accent: Colors.amberPrimary },
];

export default function LanguageSelectionScreen() {
  const { i18n } = useTranslation();
  const navigation = useNavigation<LanguageSelectionNavigationProp>();
  const [selected, setSelected] = useState('ta');

  useEffect(() => {
    const saved = storage.getString(StorageKeys.LANGUAGE);
    if (saved) setSelected(saved);

    // Initialize TTS
    Tts.getInitStatus().then(() => {
      Tts.setDefaultRate(0.5);
    }).catch((err) => {
      if (err.code === 'no_engine') {
        Tts.requestInstallEngine();
      }
    });
  }, []);

  const playAudio = (langCode: string, langName: string) => {
    Tts.stop();
    // Map to TTS language codes (defaults to en-US if unsupported on device)
    const ttsCode = langCode === 'ta' ? 'ta-IN' : 
                    langCode === 'hi' ? 'hi-IN' : 
                    langCode === 'te' ? 'te-IN' : 
                    langCode === 'kn' ? 'kn-IN' : 
                    langCode === 'ml' ? 'ml-IN' : 'en-US';
    
    Tts.setDefaultLanguage(ttsCode).catch(() => Tts.setDefaultLanguage('en-US'));
    Tts.speak(langName);
  };

  const handleSelect = (code: string) => {
    setSelected(code);
    i18n.changeLanguage(code);
    storage.set(StorageKeys.LANGUAGE, code);
    
    const lang = LANGUAGES.find(l => l.code === code);
    if (lang) {
      playAudio(lang.code, lang.native);
      showToast(`✓ Language: ${lang.name}`);
    }
    // No auto-navigate — user must tap Continue
  };

  const handleContinue = () => {
    Tts.stop();
    navigation.canGoBack() ? navigation.goBack() : navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🌐</Text>
          </View>
          <Text style={styles.heroTitle}>Choose Language</Text>
          <Text style={styles.heroSub}>
            மொழி தேர்வு செய்யுங்கள்{'\n'}Select your preferred language
          </Text>
        </View>

        {/* Language Grid */}
        <View style={styles.grid}>
          {LANGUAGES.map(lang => {
            const isSelected = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langCard,
                  isSelected && { borderColor: lang.accent, borderWidth: 2.5, backgroundColor: lang.accent + '10' },
                ]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <TouchableOpacity 
                    style={styles.speakerBtn} 
                    onPress={(e) => {
                      e.stopPropagation();
                      playAudio(lang.code, lang.native);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.speakerIcon}>🔊</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.langNative, isSelected && { color: lang.accent }]}>
                  {lang.native}
                </Text>
                <Text style={[styles.langName, isSelected && { color: lang.accent }]}>
                  {lang.name}
                </Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: lang.accent }]}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueBtn,
            { backgroundColor: LANGUAGES.find(l => l.code === selected)?.accent || Colors.bluePrimary }
          ]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueTxt}>✓ Continue in {LANGUAGES.find(l => l.code === selected)?.name || 'Selected Language'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { flexGrow: 1, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },

  hero: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  heroSub: {
    fontSize: 13, color: Colors.textSecondary, marginTop: 8,
    textAlign: 'center', lineHeight: 20,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, marginBottom: Spacing.lg,
  },
  langCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 6 },
  langFlag: { fontSize: 28 },
  speakerBtn: { padding: 4, backgroundColor: Colors.bgLight, borderRadius: 12 },
  speakerIcon: { fontSize: 16 },
  langName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  langNative: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontSize: 11, fontWeight: '800', color: Colors.white },

  continueBtn: {
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
  },

  footer: { paddingTop: Spacing.md },
});
