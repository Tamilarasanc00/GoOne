import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Surface, useTheme, HelperText, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

import { apiService } from '../services/apiService';
import { storage, StorageKeys } from '../services/storage';
import { Alert } from 'react-native';
import { showToast } from '../utils/toast';

type OtpVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>;
type OtpVerificationRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

const OTP_LENGTH = 4;
const RESEND_TIMEOUT = 30; // seconds

const OtpVerificationScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<OtpVerificationNavigationProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  
  // Get mobile number and mockOtp from params
  const mobileNumber = route.params?.mobileNumber || 'your number';
  const mockOtp = route.params?.mockOtp;

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [activeOTPIndex, setActiveOTPIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(RESEND_TIMEOUT);

  const inputRef = useRef<RNTextInput>(null);

  // Auto focus first input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Autofill OTP if mockOtp is present in route params
  useEffect(() => {
    if (mockOtp) {
      setOtp(mockOtp.split(''));
    }
  }, [mockOtp]);

  // Timer for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.substring(text.length - 1); // Only take the last character
    setOtp(newOtp);
    setError(''); // Clear error on typing

    if (!text) {
      setActiveOTPIndex(index - 1 >= 0 ? index - 1 : 0);
    } else {
      setActiveOTPIndex(index + 1 < OTP_LENGTH ? index + 1 : OTP_LENGTH - 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      setActiveOTPIndex(index - 1);
    }
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(RESEND_TIMEOUT);
      setOtp(new Array(OTP_LENGTH).fill(''));
      setActiveOTPIndex(0);
      setError('');
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setError('Please enter complete OTP');
      showToast('Enter complete OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    showToast('Verifying OTP...');

    try {
      // 1. Call verification API
      const result = await apiService.auth.verifyOtp(mobileNumber, otpValue);
      
      if (result && result.token) {
        showToast('Login successful!');
        // 2. Persist Access Token
        storage.set('APP_JWT_TOKEN', result.token);

        // 3. Fetch profile completion status
        const statusRes = await apiService.profile.checkStatus();
        const { is_profile_completed, role } = statusRes;

        if (role) {
          storage.set(StorageKeys.USER_ROLE, role);
        }

        if (is_profile_completed) {
          showToast('Welcome back!');
          if (role === 'Retailer' || role === 'retail_shop') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'RetailerDashboard' }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }
        } else {
          showToast('Complete your profile details');
          // If role chosen, navigate to CreateProfile, else let them select role
          if (role) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'CreateProfile' }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection' }],
            });
          }
        }
      } else {
        setError('Invalid OTP code.');
        showToast('Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
      showToast(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerRowTitle}>Login</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Verify OTP
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }, mockOtp ? { marginBottom: 16 } : null]}>
            Code has been sent to {mobileNumber}
          </Text>
          {mockOtp && (
            <Surface style={styles.testBadge} elevation={0}>
              <Text style={styles.testBadgeText}>
                🔑 Test OTP: <Text style={{ fontWeight: 'bold' }}>{mockOtp}</Text>
              </Text>
            </Surface>
          )}

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpInputContainer,
                  {
                    borderColor: activeOTPIndex === index ? theme.colors.primary : theme.colors.outline,
                    backgroundColor: theme.colors.background,
                  }
                ]}
              >
                <RNTextInput
                  ref={activeOTPIndex === index ? inputRef : null}
                  style={[styles.otpInput, { color: theme.colors.onSurface }]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setActiveOTPIndex(index)}
                  autoFocus={index === 0}
                  selectionColor={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          <HelperText type="error" visible={!!error} style={styles.errorText}>
            {error}
          </HelperText>

          <Button 
            mode="contained" 
            onPress={handleVerify} 
            loading={isLoading}
            disabled={isLoading || otp.join('').length < OTP_LENGTH}
            style={styles.verifyButton}
            contentStyle={styles.buttonContent}
          >
            Verify
          </Button>

          <View style={styles.resendContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Didn't receive code?{' '}
            </Text>
            <Button 
              mode="text" 
              onPress={handleResend} 
              disabled={resendTimer > 0}
              compact
              labelStyle={[
                styles.resendButtonLabel,
                { color: resendTimer > 0 ? theme.colors.onSurfaceVariant : theme.colors.primary }
              ]}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Button>
          </View>
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerRowTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 240,
    alignSelf: 'center',
    marginBottom: 8,
  },
  otpInputContainer: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonContent: {
    height: 50,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendButtonLabel: {
    fontWeight: 'bold',
  },
  testBadge: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    alignSelf: 'center',
  },
  testBadgeText: {
    color: '#FF8F00',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OtpVerificationScreen;
