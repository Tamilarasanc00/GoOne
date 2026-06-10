import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

import { storage, StorageKeys } from '../services/storage';

import { useAppDispatch } from '../redux/hooks';
import { checkProfileStatus, setProfileRole } from '../redux/slices/profileSlice';
import { setRole } from '../redux/slices/appSlice';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const theme = useTheme();
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const dispatch = useAppDispatch();
  
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

    // Check auth and auto-login after 2.5 seconds
    const timer = setTimeout(async () => {
      const token = storage.getString('APP_JWT_TOKEN');
      const hasSelectedLanguage = storage.getString(StorageKeys.LANGUAGE) !== undefined;

      if (!hasSelectedLanguage) {
        navigation.replace('LanguageSelection');
        return;
      }

      if (token) {
        try {
          // Verify user auth & profile status on backend
          const resultAction = await dispatch(checkProfileStatus());
          
          if (checkProfileStatus.fulfilled.match(resultAction)) {
            const { is_profile_completed, role: backendRole } = resultAction.payload;
            const savedRole = storage.getString(StorageKeys.USER_ROLE);
            const role = backendRole || savedRole;

            if (role) {
              storage.set(StorageKeys.USER_ROLE, role);
              dispatch(setRole(role));
              dispatch(setProfileRole(role));
            }
            
            if (is_profile_completed) {
              if (role === 'Retailer' || role === 'retail_shop') {
                navigation.replace('RetailerDashboard');
              } else {
                navigation.replace('MainTabs');
              }
            } else {
              // Profile not complete, route to setup if role chosen, else role selection
              if (role) {
                navigation.replace('CreateProfile');
              } else {
                navigation.replace('RoleSelection');
              }
            }
            return;
          }
        } catch (err) {
          console.error('Auto-login error:', err);
        }
      }

      // Default to Login Screen if not logged in or validation fails
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation, dispatch]);

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
          source={require('../assets/images/logo.png.png')} 
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
