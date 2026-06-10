import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { Alert } from 'react-native';
import { showToast } from '../utils/toast';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const LoginScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
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
        mockOtp: res.mock_otp 
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} bounces={false}>

          {/* Header Illustration / Logo */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../assets/images/logo.png.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Login Form */}
          <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
              Welcome
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Enter your mobile number to get started
            </Text>

            <View style={styles.inputContainer}>
              {/* Country Code Picker (Mock) */}
              <View style={[styles.countryCodeButton, { borderColor: theme.colors.outline }]}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{countryCode}</Text>
                <IconButton icon="menu-down" size={20} style={styles.dropdownIcon} />
              </View>

              {/* Mobile Number Input */}
              <TextInput
                mode="outlined"
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                style={styles.mobileInput}
                outlineStyle={styles.inputOutline}
                maxLength={10}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSendOTP}
              style={styles.sendButton}
              contentStyle={styles.buttonContent}
              loading={loading}
              disabled={loading || mobileNumber.length < 10}
            >
              Send OTP
            </Button>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
              <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>OR</Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            </View>

            <Button
              mode="outlined"
              onPress={handleGuest}
              style={styles.guestButton}
              contentStyle={styles.buttonContent}
            >
              Continue as Guest
            </Button>
          </Surface>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  illustrationContainer: {
    flex: 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Changed to white to match the JPEG logo background
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  logoImage: {
    width: '85%',
    height: 180,
  },
  formContainer: {
    flex: 0.55,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingLeft: 12,
    paddingRight: 4,
    height: 50,
    marginRight: 12,
    marginTop: 6, // Align with the outlined TextInput visually
    backgroundColor: 'transparent',
  },
  dropdownIcon: {
    margin: 0,
  },
  mobileInput: {
    flex: 1,
    height: 50,
  },
  inputOutline: {
    borderRadius: 4,
  },
  sendButton: {
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonContent: {
    height: 50,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  guestButton: {
    borderRadius: 8,
  },
});

export default LoginScreen;
