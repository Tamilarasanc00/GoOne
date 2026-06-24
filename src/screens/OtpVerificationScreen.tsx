import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { storage, StorageKeys } from '../services/storage';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { GoOneButton } from '../components/GoOneUI';

type OtpVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>;
type OtpVerificationRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

const OTP_LENGTH = 4;
const RESEND_TIMEOUT = 30;

export default function OtpVerificationScreen() {
  const navigation = useNavigation<OtpVerificationNavigationProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  const mobileNumber = route.params?.mobileNumber || 'your number';
  const mockOtp = route.params?.mockOtp;

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (mockOtp) setOtp(mockOtp.toString().padEnd(OTP_LENGTH, '0').split('').slice(0, OTP_LENGTH));
  }, [mockOtp]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    setError('');
    if (!text) {
      setActiveIndex(Math.max(0, index - 1));
    } else {
      setActiveIndex(Math.min(OTP_LENGTH - 1, index + 1));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      setActiveIndex(index - 1);
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setError('Please enter complete OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    showToast('Verifying OTP...');
    try {
      const result = await apiService.auth.verifyOtp(mobileNumber, otpValue);
      if (result?.token) {
        storage.set('APP_JWT_TOKEN', result.token);
        showToast('Login successful!');
        const statusRes = await apiService.profile.checkStatus();
        const { is_profile_completed, role } = statusRes;
        if (role) storage.set(StorageKeys.USER_ROLE, role);
        if (is_profile_completed) {
          navigation.reset({
            index: 0,
            routes: [{ name: role === 'Retailer' || role === 'retail_shop' ? 'RetailerDashboard' : 'MainTabs' }],
          });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
        }
      } else {
        setError('Invalid OTP code');
        showToast('Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
      showToast(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const filledCount = otp.filter(d => d !== '').length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.purplePrimary} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.circle, { width: 200, height: 200, top: -60, right: -60 }]} />
        <View style={[styles.circle, { width: 120, height: 120, bottom: 0, left: 20 }]} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🔑</Text></View>
        <Text style={styles.heroTitle}>Enter OTP</Text>
        <Text style={styles.heroSub}>Sent to {mobileNumber}</Text>
      </View>

      {/* Form */}
      <View style={styles.formWrap}>
        <Text style={styles.formHint}>Enter 4-digit OTP sent to your number</Text>

        {mockOtp && (
          <Surface style={styles.mockBadge} elevation={0}>
            <Text style={styles.mockText}>🔑 Test OTP: <Text style={{ fontWeight: 'bold' }}>{mockOtp}</Text></Text>
          </Surface>
        )}

        {/* OTP Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => {
            const isFilled = digit !== '';
            const isActive = activeIndex === i;
            return (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  isActive && styles.otpBoxActive,
                  isFilled && styles.otpBoxFilled,
                ]}
              >
                <RNTextInput
                  ref={activeIndex === i ? inputRef : null}
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={text => handleChange(text, i)}
                  onKeyPress={e => handleKeyPress(e, i)}
                  onFocus={() => setActiveIndex(i)}
                  autoFocus={i === 0}
                  selectionColor={Colors.bluePrimary}
                />
              </View>
            );
          })}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(filledCount / OTP_LENGTH) * 100}%` }]} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <GoOneButton
          label="✓ Verify OTP"
          onPress={handleVerify}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading || filledCount < OTP_LENGTH}
          style={{ marginTop: Spacing.lg }}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendHint}>Didn't receive? </Text>
          <TouchableOpacity
            onPress={() => {
              if (resendTimer <= 0) {
                setResendTimer(RESEND_TIMEOUT);
                setOtp(new Array(OTP_LENGTH).fill(''));
                setActiveIndex(0);
                setError('');
              }
            }}
            disabled={resendTimer > 0}
          >
            <Text style={[styles.resendBtn, resendTimer > 0 && styles.resendDisabled]}>
              {resendTimer > 0 ? `Resend in 0:${String(resendTimer).padStart(2, '0')}` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.changeRow} onPress={() => navigation.goBack()}>
          <Text style={styles.changeText}>✕ Change Number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgLight },

  hero: {
    backgroundColor: Colors.purplePrimary,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.white },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  formWrap: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: Spacing.lg,
    flex: 1,
  },
  formHint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  mockBadge: {
    backgroundColor: Colors.amberSoft,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: 16,
    alignItems: 'center',
  },
  mockText: { color: Colors.amberPrimary, fontSize: 13 },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  otpBox: {
    width: 60, height: 64,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: Colors.bluePrimary,
    backgroundColor: Colors.blueSoft,
  },
  otpBoxFilled: {
    borderColor: Colors.greenPrimary,
    backgroundColor: Colors.greenSoft,
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },

  progressBar: {
    height: 4, borderRadius: 2, backgroundColor: Colors.border,
    marginBottom: 8, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: Colors.bluePrimary,
  },

  errorText: {
    color: Colors.redPrimary, fontSize: 13, fontWeight: '600',
    textAlign: 'center', marginTop: 4,
  },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  resendHint: { fontSize: 13, color: Colors.textMuted },
  resendBtn: { fontSize: 13, fontWeight: '700', color: Colors.bluePrimary },
  resendDisabled: { color: Colors.textMuted },

  changeRow: { alignItems: 'center', marginTop: 10 },
  changeText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
});
