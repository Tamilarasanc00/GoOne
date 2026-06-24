import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { storage, StorageKeys } from '../services/storage';
import { useAppDispatch } from '../redux/hooks';
import { checkProfileStatus, setProfileRole } from '../redux/slices/profileSlice';
import { setRole } from '../redux/slices/appSlice';
import Colors from '../constants/colors';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;
const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const dispatch = useAppDispatch();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 18, friction: 7, useNativeDriver: true }),
    ]).start();

    // Loading dots animation
    const dotLoop = Animated.loop(
      Animated.stagger(250, [
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    dotLoop.start();

    const timer = setTimeout(async () => {
      const token = storage.getString('APP_JWT_TOKEN');
      const hasSelectedLanguage = storage.getString(StorageKeys.LANGUAGE) !== undefined;

      if (!hasSelectedLanguage) {
        navigation.replace('LanguageSelection');
        return;
      }

      if (token) {
        try {
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
              navigation.replace(role ? 'CreateProfile' : 'RoleSelection');
            }
            return;
          }
        } catch (err) {
          console.error('Auto-login error:', err);
        }
      }

      navigation.replace('Login');
    }, 2800);

    return () => {
      clearTimeout(timer);
      dotLoop.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient simulation via layered views */}
      <View style={[StyleSheet.absoluteFill, styles.bgBlue]} />
      <View style={[StyleSheet.absoluteFill, styles.bgPurple]} />

      {/* Decorative circles */}
      <View style={[styles.circle, { width: 320, height: 320, top: -100, right: -80 }]} />
      <View style={[styles.circle, { width: 200, height: 200, bottom: -40, left: -60 }]} />
      <View style={[styles.circle, { width: 140, height: 140, top: '40%', left: '20%' }]} />

      {/* Logo + Brand */}
      <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCard}>
          <Image
            source={require('../assets/images/logo.png.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tagline}>Home & Community Hub</Text>
      </Animated.View>

      {/* Tagline & loading dots */}
      <Animated.View style={[styles.bottomWrap, { opacity: fadeAnim }]}>
        <Text style={styles.connectText}>Connecting Rural India</Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, styles.dotActive, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgBlue: {
    backgroundColor: Colors.bluePrimary,
  },
  bgPurple: {
    backgroundColor: Colors.purplePrimary,
    opacity: 0.55,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoCard: {
    width: 160,
    height: 160,
    borderRadius: 44,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 20,
    marginBottom: 24,
    padding: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  bottomWrap: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
  },
  connectText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
});
