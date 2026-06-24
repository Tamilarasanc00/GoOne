import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { toggleTheme } from '../redux/slices/appSlice';
import { storage, StorageKeys } from '../services/storage';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader } from '../components/GoOneUI';

const LANGUAGES = [
  { code: 'ta', name: 'தமிழ்', emoji: '🔤' },
  { code: 'en', name: 'English', emoji: '🅰️' },
  { code: 'kn', name: 'ಕನ್ನಡ', emoji: '🔤' },
  { code: 'te', name: 'తెలుగు', emoji: '🔤' },
  { code: 'hi', name: 'हिन्दी', emoji: '🔤' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state: any) => state.app.isDarkMode);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    storage.set(StorageKeys.LANGUAGE, code);
    showToast(`Language changed to ${LANGUAGES.find(l => l.code === code)?.name}`);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear app cache? This will not delete your account data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => showToast('Cache cleared successfully') }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={{ fontSize: 24 }}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings', 'Settings')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}><Text style={{ fontSize: 20 }}>🌙</Text></View>
            <View style={styles.settingTxtWrap}>
              <Text style={styles.settingTitle}>{t('toggleTheme', 'Dark Mode')}</Text>
              <Text style={styles.settingSub}>Switch to dark theme</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={() => dispatch(toggleTheme())} color={Colors.bluePrimary} />
          </View>
        </View>

        {/* Language */}
        <SectionHeader title={t('common.changeLanguage', 'Language')} />
        <View style={styles.card}>
          {LANGUAGES.map((lang, index) => {
            const isActive = i18n.language === lang.code;
            return (
              <React.Fragment key={lang.code}>
                <TouchableOpacity style={styles.langRow} onPress={() => changeLanguage(lang.code)}>
                  <View style={styles.langIconWrap}><Text style={{ fontSize: 20 }}>{lang.emoji}</Text></View>
                  <Text style={[styles.langTxt, isActive && styles.langTxtActive]}>{lang.name}</Text>
                  {isActive && <Text style={{ fontSize: 20, color: Colors.bluePrimary }}>✓</Text>}
                </TouchableOpacity>
                {index < LANGUAGES.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* App Data */}
        <SectionHeader title="App Data" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
            <View style={[styles.settingIconWrap, { backgroundColor: Colors.redSoft }]}><Text style={{ fontSize: 20 }}>🗑️</Text></View>
            <View style={styles.settingTxtWrap}>
              <Text style={[styles.settingTitle, { color: Colors.redPrimary }]}>Clear Cache</Text>
              <Text style={styles.settingSub}>Free up local storage space</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRow} onPress={() => showToast('Opening help center...')}>
            <View style={[styles.settingIconWrap, { backgroundColor: Colors.greenSoft }]}><Text style={{ fontSize: 20 }}>📞</Text></View>
            <View style={styles.settingTxtWrap}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingSub}>Contact our support team</Text>
            </View>
            <Text style={{ fontSize: 20, color: Colors.textMuted }}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => showToast('Opening privacy policy...')}>
            <View style={styles.settingIconWrap}><Text style={{ fontSize: 20 }}>🔒</Text></View>
            <View style={styles.settingTxtWrap}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <Text style={{ fontSize: 20, color: Colors.textMuted }}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionTxt}>App Version 1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { paddingRight: Spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },

  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingTxtWrap: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  settingSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  langIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  langTxt: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  langTxtActive: { fontWeight: '800', color: Colors.bluePrimary },

  versionTxt: { textAlign: 'center', fontSize: 13, color: Colors.textMuted, marginTop: Spacing.lg, marginBottom: Spacing.xl },
});
