import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, Button, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { toggleTheme } from '../redux/slices/appSlice';
import { storage, StorageKeys } from '../services/storage';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.app.isDarkMode);

  const toggleLanguage = () => {
    const langs = ['ta', 'en', 'kn', 'te', 'hi'];
    // Default to 'ta' if current language is not in the list
    const currentIndex = langs.indexOf(i18n.language);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % langs.length;
    const newLang = langs[nextIndex];
    i18n.changeLanguage(newLang);
    storage.set(StorageKeys.LANGUAGE, newLang);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.row}>
          <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
            {t('toggleTheme')} (Dark Mode)
          </Text>
          <Switch value={isDarkMode} onValueChange={() => { dispatch(toggleTheme()); }} />
        </View>

        <View style={[styles.row, { marginTop: 20 }]}>
          <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
            Language: {i18n.language.toUpperCase()}
          </Text>
          <Button mode="contained-tonal" onPress={toggleLanguage}>
            {t('common.changeLanguage', 'Change Language')}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(128,128,128,0.1)',
    padding: 16,
    borderRadius: 8,
  },
});
