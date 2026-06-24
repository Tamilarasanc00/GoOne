import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import Colors from '../constants/colors';
import { voiceService } from '../services/voiceService';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    voiceService.setCallbacks(
      (text) => {
        // We could show the recognized text briefly before closing
      },
      (listening) => {
        setIsListening(listening);
      }
    );
  }, []);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  if (!isListening) return null;

  return (
    <Modal transparent visible={isListening} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>GoOne Voice Assistant</Text>
          <Text style={styles.subtitle}>Listening to your command...</Text>
          
          <View style={styles.micWrapper}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
            <TouchableOpacity 
              style={styles.micBtn} 
              onPress={() => voiceService.stopListening()}
            >
              <Text style={styles.micEmoji}>🎙️</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cancelTxt}>Tap mic to stop</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 30,
  },
  micWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.blueSoft,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  micEmoji: {
    fontSize: 36,
  },
  cancelTxt: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 20,
  }
});
