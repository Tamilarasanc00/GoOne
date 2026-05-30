import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { toggleTheme } from '../redux/slices/appSlice';
import { storage, StorageKeys } from '../services/storage';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.app.isDarkMode);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
    storage.set(StorageKeys.LANGUAGE, newLang);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          {t('changeLanguage')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
