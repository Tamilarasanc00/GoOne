import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

import { storage, StorageKeys } from '../services/storage';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const theme = useTheme();
  const navigation = useNavigation<SplashScreenNavigationProp>();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();

    // Navigate to next screen after 2.5 seconds
    const timer = setTimeout(() => {
      const hasSelectedLanguage = storage.getBoolean('hasSelectedLanguage');
      if (hasSelectedLanguage) {
        navigation.replace('Login');
      } else {
        navigation.replace('LanguageSelection');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Image 
          source={require('../assets/images/logo.png.jpeg')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text variant="titleMedium" style={styles.tagline}>
          Home & Community Hub
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    width: width * 0.8,
  },
  logo: {
    width: '100%',
    height: 180,
    marginBottom: 16,
  },
  tagline: {
    fontWeight: 'bold',
    color: '#757575',
    letterSpacing: 1,
    marginTop: -20, // Adjust spacing from logo image
  },
});
