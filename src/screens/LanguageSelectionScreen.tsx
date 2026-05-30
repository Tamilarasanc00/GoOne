import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, RadioButton, Button, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { storage, StorageKeys } from '../services/storage';

type LanguageSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LanguageSelection'>;

const LANGUAGES = [
  { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil', iconLetter: 'த', color: '#E91E63' },
  { code: 'kn', name: 'ಕನ್ನಡ', nativeName: 'Kannada', iconLetter: 'ಕ', color: '#9C27B0' },
  { code: 'te', name: 'తెలుగు', nativeName: 'Telugu', iconLetter: 'తె', color: '#FF9800' },
  { code: 'hi', name: 'हिन्दी', nativeName: 'Hindi', iconLetter: 'हि', color: '#4CAF50' },
  { code: 'en', name: 'English', nativeName: 'English', iconLetter: 'E', color: '#0066FF' },
];

const PRIMARY_COLOR = '#0066FF';

const LanguageSelectionScreen = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<LanguageSelectionNavigationProp>();
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ta');

  useEffect(() => {
    const savedLanguage = storage.getString(StorageKeys.LANGUAGE);
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    i18n.changeLanguage(code);
  };

  const handleContinue = () => {
    storage.set(StorageKeys.LANGUAGE, selectedLanguage);
    navigation.replace('Login');
  };

  const renderItem = ({ item }: { item: typeof LANGUAGES[0] }) => {
    const isSelected = selectedLanguage === item.code;
    return (
      <TouchableOpacity onPress={() => handleLanguageChange(item.code)} activeOpacity={0.8}>
        <Surface 
          style={[
            styles.languageCard, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: isSelected ? PRIMARY_COLOR : theme.colors.outlineVariant,
              borderWidth: isSelected ? 2.5 : 1,
            }
          ]} 
          elevation={isSelected ? 4 : 1}
        >
          <View style={styles.cardContent}>
            <View style={styles.leftSection}>
              <Avatar.Text 
                size={56} 
                label={item.iconLetter} 
                style={[styles.icon, { backgroundColor: isSelected ? item.color : theme.colors.surfaceVariant }]}
                color={isSelected ? '#FFF' : theme.colors.onSurface}
              />
              <View style={styles.textContainer}>
                <Text variant="headlineSmall" style={[styles.languageName, { color: isSelected ? PRIMARY_COLOR : theme.colors.onSurface }]}>
                  {item.name}
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.nativeName}
                </Text>
              </View>
            </View>
            <View style={styles.radioContainer}>
              <RadioButton
                value={item.code}
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => handleLanguageChange(item.code)}
                color={PRIMARY_COLOR}
              />
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: PRIMARY_COLOR }]}>
            <MaterialCommunityIcons name="translate" size={48} color="#FFFFFF" />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            {t('chooseLanguage', 'Choose Your Language')}
          </Text>
        </View>

        <FlatList
          data={LANGUAGES}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Button 
            mode="contained" 
            onPress={handleContinue} 
            style={[styles.continueButton, { backgroundColor: PRIMARY_COLOR }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {t('continue', 'Continue')}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  languageCard: {
    borderRadius: 20, // larger corners
    padding: 20,      // larger padding
    marginBottom: 16, // more space between cards
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    justifyContent: 'center',
  },
  languageName: {
    fontWeight: 'bold',
  },
  radioContainer: {
    justifyContent: 'center',
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  continueButton: {
    borderRadius: 16,
  },
  buttonContent: {
    height: 60,
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default LanguageSelectionScreen;
