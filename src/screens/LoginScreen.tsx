import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { GoOneButton, VoiceButton } from '../components/GoOneUI';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const ROLE_ICONS = [
  { icon: '🏪', label: 'Shops' },
  { icon: '🌾', label: 'Farmers' },
  { icon: '🔧', label: 'Services' },
  { icon: '👷', label: 'Workers' },
];

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode] = useState('+91');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (mobileNumber.length < 10) {
      showToast('Enter valid 10-digit number');
      return;
    }
    setLoading(true);
    showToast('Sending OTP...');
    try {
      const fullMobile = countryCode + mobileNumber;
      const res = await apiService.auth.sendOtp(fullMobile);
      showToast(res.message || 'OTP Sent!');
      navigation.navigate('OtpVerification', {
        mobileNumber: fullMobile,
        mockOtp: res.mock_otp,
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bluePrimary} />
      <ScrollView contentContainerStyle={styles.container} bounces={false} keyboardShouldPersistTaps="handled">

        {/* Hero Header */}
        <View style={styles.hero}>
          {/* Background circles */}
          <View style={[styles.circle, { width: 220, height: 220, top: -70, right: -70 }]} />
          <View style={[styles.circle, { width: 140, height: 140, bottom: -20, left: -30 }]} />

          <View style={styles.heroContent}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/images/logo.png.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heroTitle}>👋 Welcome to GoOne</Text>
            <Text style={styles.heroSub}>Login with your mobile number to get started</Text>
            {/* Role icon pills */}
            <View style={styles.roleRow}>
              {ROLE_ICONS.map(r => (
                <View key={r.label} style={styles.rolePill}>
                  <Text style={styles.roleEmoji}>{r.icon}</Text>
                  <Text style={styles.roleLabel}>{r.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formWrap}>
          <Text style={styles.formLabel}>📱 Mobile Number</Text>
          <View style={styles.phoneRow}>
            {/* Country code */}
            <View style={styles.countryCode}>
              <Text style={styles.countryFlag}>🇮🇳</Text>
              <Text style={styles.countryText}>{countryCode}</Text>
              <Text style={styles.caret}>▾</Text>
            </View>
            {/* Phone input */}
            <TextInput
              mode="flat"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="98765 43210"
              placeholderTextColor={Colors.textMuted}
              style={styles.phoneInput}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              outlineColor="transparent"
              activeOutlineColor="transparent"
            />
          </View>

          {/* Voice login hint */}
          <TouchableOpacity style={styles.voiceRow} onPress={() => showToast('Voice login activated')}>
            <VoiceButton onPress={() => showToast('Voice login activated')} size={32} />
            <Text style={styles.voiceHint}>Or use Voice Login</Text>
          </TouchableOpacity>

          <GoOneButton
            label="Send OTP →"
            onPress={handleSendOTP}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || mobileNumber.length < 10}
          />

          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OR</Text>
            <View style={styles.divLine} />
          </View>

          <GoOneButton
            label="Continue as Guest"
            onPress={handleGuest}
            variant="outline"
            size="md"
            fullWidth
          />

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text>{' '}
            &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgLight },
  container: { flexGrow: 1 },

  // Hero
  hero: {
    backgroundColor: Colors.bluePrimary,
    paddingBottom: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroContent: {
    padding: Spacing.md,
    paddingTop: 48,
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    width: 100, height: 100,
    backgroundColor: Colors.white,
    borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    padding: 6,
  },
  logo: { width: '100%', height: '100%' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  roleRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    padding: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  roleEmoji: { fontSize: 22 },
  roleLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginTop: 4 },

  // Form
  formWrap: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: Spacing.lg,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  formLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  countryFlag: { fontSize: 18 },
  countryText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  caret: { fontSize: 10, color: Colors.textMuted },
  phoneInput: {
    flex: 1,
    height: 50,
    backgroundColor: 'transparent',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  voiceHint: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { marginHorizontal: 16, fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
  terms: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: { color: Colors.bluePrimary, fontWeight: '700' },
});
