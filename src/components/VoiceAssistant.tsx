import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/colors';
import { voiceService } from '../services/voiceService';

export default function VoiceAssistant() {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    voiceService.setCallbacks(
      (text) => {
        setRecognizedText(text);
      },
      (listening) => {
        setIsListening(listening);
        if (!listening) setRecognizedText('');
      }
    );

    // Cleanup listeners on unmount
    return () => {
      animRef.current?.stop();
      voiceService.stopListening();
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      animRef.current = null;
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  if (!isListening) return null;

  return (
    <Modal transparent visible={isListening} animationType="fade" onRequestClose={() => voiceService.stopListening()}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => voiceService.stopListening()}
      >
        <View style={styles.container}>
          <Text style={styles.title}>GoOne Voice</Text>
          <Text style={styles.subtitle}>{t('voice.listening', 'Listening...')}</Text>

          <View style={styles.micWrapper}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => voiceService.stopListening()}
            >
              <Text style={styles.micEmoji}>🎙️</Text>
            </TouchableOpacity>
          </View>

          {recognizedText ? (
            <View style={styles.recognizedBox}>
              <Text style={styles.recognizedTxt}>"{recognizedText}"</Text>
            </View>
          ) : null}

          <Text style={styles.cancelTxt}>{t('voice.tapToStop', 'Tap mic or anywhere to stop')}</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    width: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 28,
  },
  micWrapper: {
    position: 'relative',
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.blueSoft,
    opacity: 0.7,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bluePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: Colors.bluePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  micEmoji: { fontSize: 36 },
  recognizedBox: {
    backgroundColor: Colors.bgLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
    maxWidth: '100%',
  },
  recognizedTxt: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cancelTxt: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
});
