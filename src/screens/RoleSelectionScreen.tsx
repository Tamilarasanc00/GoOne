import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../redux/hooks';
import { setRole } from '../redux/slices/appSlice';
import { setProfileRole } from '../redux/slices/profileSlice';
import { storage, StorageKeys } from '../services/storage';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { GoOneButton, PullTab } from '../components/GoOneUI';
import Tts from 'react-native-tts';

type RoleSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;
type RoleSelectionRouteProp = RouteProp<RootStackParamList, 'RoleSelection'>;

const ROLES = [
  {
    id: 'retail_shop',
    name: 'Retail Shop',
    emoji: '🏪',
    desc: 'List your shop, products & offers',
    accent: Colors.bluePrimary,
    bg: Colors.blueSoft,
  },
  {
    id: 'farmer',
    name: 'Farmer',
    emoji: '🌾',
    desc: 'Sell crops & farm produce',
    accent: Colors.greenPrimary,
    bg: Colors.greenSoft,
  },
  {
    id: 'service_worker',
    name: 'Service Worker',
    emoji: '🔧',
    desc: 'Offer skilled services to locals',
    accent: Colors.purplePrimary,
    bg: Colors.purpleSoft,
  },
  {
    id: 'rental_owner',
    name: 'Rental Owner',
    emoji: '🚜',
    desc: 'Rent out tools & equipment',
    accent: Colors.amberPrimary,
    bg: Colors.amberSoft,
  },
  {
    id: 'customer',
    name: 'Customer',
    emoji: '🛒',
    desc: 'Browse shops, book services',
    accent: Colors.magentaPrimary,
    bg: Colors.magentaSoft,
  },
];

const VOICE_PHRASES = [
  { phrase: 'I am a Farmer', roleId: 'farmer', emoji: '🌾' },
  { phrase: 'I run a Retail Shop', roleId: 'retail_shop', emoji: '🏪' },
  { phrase: 'I offer Services', roleId: 'service_worker', emoji: '🔧' },
  { phrase: 'I lease machinery', roleId: 'rental_owner', emoji: '🚜' },
  { phrase: 'I am a Customer', roleId: 'customer', emoji: '🛒' },
];

export default function RoleSelectionScreen() {
  const navigation = useNavigation<RoleSelectionNavigationProp>();
  const route = useRoute<RoleSelectionRouteProp>();
  const isEdit = route.params?.isEdit;
  const dispatch = useAppDispatch();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'recognizing' | 'success'>('listening');
  const [recognizedText, setRecognizedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Setup TTS
  useEffect(() => {
    Tts.addEventListener('tts-start', () => setIsSpeaking(true));
    Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));

    return () => {
      Tts.stop();
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []);

  const handleSpeakerPressEn = () => {
    if (isSpeaking) {
      Tts.stop();
      setIsSpeaking(false);
      return;
    }

    Tts.setDefaultLanguage('en-IN');
    const textToSpeak = "Welcome to Go One. Thank you for choosing us. Please select your role and choose how you would like to use Go One.";
    //const textToSpeak = "ThankYou For Choosing Go One Ramya Choose Your Role. Select how you want to use Go One. " +
    ROLES.map(r => `${r.name}, ${r.desc}.`).join(" ");

    Tts.speak(textToSpeak);
  };

  const handleSpeakerPressTa = () => {
    if (isSpeaking) {
      Tts.stop();
      setIsSpeaking(false);
      return;
    }

    Tts.setDefaultLanguage('ta-IN');
    const tamilText = "உங்கள் பங்கைத் தேர்ந்தெடுக்கவும். Go One செயலியை எவ்வாறு பயன்படுத்த விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும். சிறு வணிகம், உங்கள் கடை மற்றும் பொருட்களைப் பட்டியலிடவும். விவசாயி, விளைபொருட்களை விற்கவும். சேவை வழங்குபவர், உங்கள் திறமைகளை உள்ளூரில் வழங்கவும். வாடகை உரிமையாளர், இயந்திரங்கள் மற்றும் கருவிகளை வாடகைக்கு விடவும். வாடிக்கையாளர், கடைகளைத் தேடவும், சேவைகளைப் பதிவு செய்யவும்.";

    Tts.speak(tamilText);
  };

  useEffect(() => {
    if (!voiceVisible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [voiceVisible]);

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await apiService.profile.updateRole(selectedRole);
      storage.set(StorageKeys.USER_ROLE, selectedRole);
      dispatch(setRole(selectedRole));
      dispatch(setProfileRole(selectedRole));
      showToast('Role updated!');
      navigation.reset({ index: 0, routes: [{ name: 'CreateProfile', ...(isEdit !== undefined ? { params: { isEdit } } : {}) }] });
    } catch (err: any) {
      showToast(err.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePhrase = (phrase: string, roleId: string) => {
    setVoiceStatus('recognizing');
    setRecognizedText(phrase);
    setTimeout(async () => {
      setVoiceStatus('success');
      try {
        await apiService.profile.updateRole(roleId);
        storage.set(StorageKeys.USER_ROLE, roleId);
        dispatch(setRole(roleId));
        dispatch(setProfileRole(roleId));
        setTimeout(() => {
          setVoiceVisible(false);
          navigation.reset({ index: 0, routes: [{ name: 'CreateProfile', ...(isEdit !== undefined ? { params: { isEdit } } : {}) }] });
        }, 1200);
      } catch (err: any) {
        showToast(err.message || 'Failed');
        setVoiceStatus('listening');
      }
    }, 1500);
  };

  const selected = ROLES.find(r => r.id === selectedRole);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bluePrimary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.circle, { width: 160, height: 160, top: -40, right: -40 }]} />
        <View style={[styles.circle, { width: 80, height: 80, bottom: -10, left: 60 }]} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.voiceBtn} onPress={handleSpeakerPressTa}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.white }}>தமிழ் 🔊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.voiceBtn} onPress={handleSpeakerPressEn}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.white }}>EN 🔊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.voiceBtn} onPress={() => { setVoiceVisible(true); setVoiceStatus('listening'); setRecognizedText(''); }}>
              <Text style={{ fontSize: 20 }}>🎙️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerTitle}>Choose Your Role</Text>
        <Text style={styles.headerSub}>Select how you want to use GoOne</Text>
      </View>

      {/* Role cards */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {ROLES.map(role => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  isSelected && {
                    borderColor: role.accent,
                    borderWidth: 2.5,
                    backgroundColor: role.bg,
                  },
                ]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.selectedCheck, { backgroundColor: role.accent }]}>
                    <Text style={styles.checkTxt}>✓</Text>
                  </View>
                )}
                {/* Icon */}
                <View style={[styles.roleIconWrap, { backgroundColor: isSelected ? role.accent + '20' : Colors.bgLight }]}>
                  <Text style={styles.roleEmoji}>{role.emoji}</Text>
                </View>
                <Text style={[styles.roleName, isSelected && { color: role.accent }]}>{role.name}</Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
                {isSelected && (
                  <View style={[styles.accentBar, { backgroundColor: role.accent }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <GoOneButton
            label={selectedRole ? `Continue as ${selected?.name} ${selected?.emoji}` : 'Select a Role to Continue'}
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!selectedRole || loading}
          />
        </View>
      </ScrollView>

      {/* Voice Modal */}
      <Modal
        visible={voiceVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVoiceVisible(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setVoiceVisible(false)} />
          <Surface style={styles.bottomSheet} elevation={5}>
            <PullTab />
            <Text style={styles.voiceTitle}>🎙️ Voice Role Assistant</Text>
            <Text style={styles.voiceSub}>Tap a phrase to simulate speaking</Text>

            {/* Mic animation */}
            <View style={styles.micWrap}>
              {voiceStatus === 'listening' && (
                <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]} />
              )}
              <View style={[styles.micCircle, voiceStatus === 'success' && { backgroundColor: Colors.greenPrimary }]}>
                {voiceStatus === 'recognizing' ? (
                  <ActivityIndicator size="large" color={Colors.white} />
                ) : (
                  <Text style={styles.micEmoji}>
                    {voiceStatus === 'success' ? '✅' : '🎙️'}
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.voiceStatus}>
              {voiceStatus === 'listening' && 'Listening... Say your role'}
              {voiceStatus === 'recognizing' && `"${recognizedText}"`}
              {voiceStatus === 'success' && 'Role recognized! Redirecting...'}
            </Text>

            <View style={styles.phrasesWrap}>
              {VOICE_PHRASES.map(p => (
                <TouchableOpacity
                  key={p.roleId}
                  style={styles.phraseChip}
                  onPress={() => handleVoicePhrase(p.phrase, p.roleId)}
                  disabled={voiceStatus !== 'listening'}
                >
                  <Text>{p.emoji}</Text>
                  <Text style={styles.phraseText}>"{p.phrase}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    backgroundColor: Colors.bluePrimary,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, zIndex: 1 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  backTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },
  voiceBtn: {
    height: 44, borderRadius: 22, paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, zIndex: 1 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, zIndex: 1 },

  scroll: { padding: Spacing.md, paddingTop: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roleCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  checkTxt: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  roleIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  roleEmoji: { fontSize: 32 },
  roleName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  roleDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  accentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  footer: { marginTop: Spacing.lg, paddingBottom: Spacing.lg },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  voiceTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  voiceSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginBottom: 20 },
  micWrap: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100, marginBottom: 16 },
  pulse: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.bluePrimary + '30',
  },
  micCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.bluePrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  micEmoji: { fontSize: 30 },
  voiceStatus: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  phrasesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingBottom: Spacing.xl },
  phraseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  phraseText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
});
