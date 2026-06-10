import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Animated, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Text, Surface, Button, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../redux/hooks';
import { setRole } from '../redux/slices/appSlice';
import { setProfileRole } from '../redux/slices/profileSlice';
import { storage, StorageKeys } from '../services/storage';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type RoleSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;

const ROLES = [
  { id: 'retail_shop', name: 'Retail Shop', icon: 'storefront-outline' },
  { id: 'farmer', name: 'Farmer', icon: 'tractor' },
  { id: 'service_worker', name: 'Service Worker', icon: 'wrench-outline' },
  { id: 'rental_owner', name: 'Rental Owner', icon: 'key-outline' },
  { id: 'customer', name: 'Customer', icon: 'account-outline' },
];

const PRIMARY_COLOR = '#0066FF';
const { height } = Dimensions.get('window');

const RoleSelectionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<RoleSelectionNavigationProp>();
  const dispatch = useAppDispatch();
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Voice Selection State
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'recognizing' | 'success'>('idle');
  const [recognizedText, setRecognizedText] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation loop for the microphone
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (voiceModalVisible && voiceStatus === 'listening') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [voiceModalVisible, voiceStatus]);

  const handleContinue = async () => {
    if (selectedRole) {
      setLoading(true);
      try {
        // 1. Save to Database
        await apiService.profile.updateRole(selectedRole);

        // 2. Save to MMKV
        storage.set(StorageKeys.USER_ROLE, selectedRole);

        // 3. Save to Redux (appSlice and profileSlice)
        dispatch(setRole(selectedRole));
        dispatch(setProfileRole(selectedRole));

        showToast('Role updated successfully!');
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'CreateProfile' }],
        });
      } catch (err: any) {
        showToast(err.message || 'Failed to save role');
      } finally {
        setLoading(false);
      }
    }
  };

  const startVoiceSelection = () => {
    setVoiceModalVisible(true);
    setVoiceStatus('listening');
    setRecognizedText('');
  };

  const handleSimulateSpeech = (phrase: string, roleId: string) => {
    setVoiceStatus('recognizing');
    setRecognizedText(phrase);
    
    // Simulate thinking/transcribing delay
    setTimeout(async () => {
      setVoiceStatus('success');
      showToast(`Recognized role: ${phrase}`);
      
      try {
        // 1. Save to database
        await apiService.profile.updateRole(roleId);
        // 2. Save to MMKV
        storage.set(StorageKeys.USER_ROLE, roleId);
        // 3. Save to Redux
        dispatch(setRole(roleId));
        dispatch(setProfileRole(roleId));
        
        // Wait briefly for user to see success UI, then dismiss and navigate
        setTimeout(() => {
          setVoiceModalVisible(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'CreateProfile' }],
          });
        }, 1200);
      } catch (err: any) {
        showToast(err.message || 'Failed to save role');
        setVoiceStatus('listening');
      }
    }, 1500);
  };

  const renderItem = ({ item }: { item: typeof ROLES[0] }) => {
    const isSelected = selectedRole === item.id;
    return (
      <TouchableOpacity onPress={() => setSelectedRole(item.id)} activeOpacity={0.8} style={styles.cardWrapper}>
        <Surface 
          style={[
            styles.roleCard, 
            { 
              backgroundColor: isSelected ? PRIMARY_COLOR : theme.colors.surface,
              borderColor: isSelected ? PRIMARY_COLOR : theme.colors.outlineVariant,
              borderWidth: 2,
            }
          ]} 
          elevation={isSelected ? 4 : 1}
        >
          <MaterialCommunityIcons 
            name={item.icon} 
            size={48} 
            color={isSelected ? '#FFFFFF' : PRIMARY_COLOR} 
            style={styles.icon}
          />
          <Text 
            variant="titleMedium" 
            style={[
              styles.roleName, 
              { color: isSelected ? '#FFFFFF' : theme.colors.onSurface }
            ]}
          >
            {item.name}
          </Text>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftContainer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }
            }}
            style={styles.backButton}
          />
          <Text variant="titleLarge" style={styles.headerRowTitle}>Select Role</Text>
        </View>
        
        {/* Floating Voice Search Trigger */}
        <IconButton
          icon="microphone"
          iconColor={PRIMARY_COLOR}
          size={24}
          onPress={startVoiceSelection}
          style={styles.voiceTriggerButton}
        />
      </View>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Choose Your Role
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Select how you want to use the app
          </Text>
        </View>

        <FlatList
          data={ROLES}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Button 
            mode="contained" 
            onPress={handleContinue} 
            disabled={!selectedRole || loading}
            loading={loading}
            style={[styles.continueButton, selectedRole ? { backgroundColor: PRIMARY_COLOR } : undefined]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Continue
          </Button>
        </View>
      </View>

      {/* Voice Assistant Modal */}
      <Modal
        visible={voiceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissTrigger} 
            activeOpacity={1} 
            onPress={() => setVoiceModalVisible(false)}
          />
          <Surface style={styles.bottomSheet} elevation={5}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.dragIndicator} />
              <IconButton 
                icon="close" 
                size={22} 
                onPress={() => setVoiceModalVisible(false)} 
                style={styles.closeModalButton} 
              />
            </View>

            <View style={styles.voiceAssistantContent}>
              <Text variant="titleMedium" style={styles.voiceAssistantTitle}>
                Voice Role Assistant
              </Text>

              {/* Pulsing Audio Wave Microphone Container */}
              <View style={styles.micAnimationContainer}>
                {voiceStatus === 'listening' && (
                  <Animated.View 
                    style={[
                      styles.pulseWaveCircle, 
                      { 
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.4],
                          outputRange: [0.6, 0]
                        })
                      }
                    ]} 
                  />
                )}
                
                <Surface 
                  style={[
                    styles.micButtonSurface, 
                    voiceStatus === 'success' ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#F0F4FF' }
                  ]} 
                  elevation={2}
                >
                  {voiceStatus === 'recognizing' ? (
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  ) : (
                    <MaterialCommunityIcons 
                      name={voiceStatus === 'success' ? 'check' : 'microphone'} 
                      size={36} 
                      color={voiceStatus === 'success' ? '#FFFFFF' : PRIMARY_COLOR} 
                    />
                  )}
                </Surface>
              </View>

              {/* Dynamic Status Text */}
              <Text 
                variant="bodyLarge" 
                style={[
                  styles.statusText, 
                  voiceStatus === 'success' ? { color: '#4CAF50', fontWeight: 'bold' } : { color: theme.colors.onSurface }
                ]}
              >
                {voiceStatus === 'listening' && 'Listening... Speak now'}
                {voiceStatus === 'recognizing' && 'Analyzing Voice Command...'}
                {voiceStatus === 'success' && 'Role Recognized & Saved!'}
              </Text>

              {/* Speech bubble showing recognized text */}
              {recognizedText ? (
                <View style={styles.speechBubble}>
                  <Text style={styles.speechBubbleText}>"{recognizedText}"</Text>
                </View>
              ) : (
                <Text style={styles.instructionSubtext}>
                  Tap a phrase below to simulate speaking to the assistant:
                </Text>
              )}

              {/* Preset Phrases container */}
              <View style={styles.phrasesContainer}>
                <TouchableOpacity 
                  disabled={voiceStatus === 'recognizing' || voiceStatus === 'success'}
                  onPress={() => handleSimulateSpeech('I am a Farmer', 'farmer')} 
                  style={styles.phraseChip}
                >
                  <MaterialCommunityIcons name="tractor" size={16} color={PRIMARY_COLOR} />
                  <Text style={styles.phraseChipText}>"I am a Farmer"</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  disabled={voiceStatus === 'recognizing' || voiceStatus === 'success'}
                  onPress={() => handleSimulateSpeech('I run a Retail Shop', 'retail_shop')} 
                  style={styles.phraseChip}
                >
                  <MaterialCommunityIcons name="storefront-outline" size={16} color={PRIMARY_COLOR} />
                  <Text style={styles.phraseChipText}>"I run a Retail Shop"</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  disabled={voiceStatus === 'recognizing' || voiceStatus === 'success'}
                  onPress={() => handleSimulateSpeech('I want to offer Services', 'service_worker')} 
                  style={styles.phraseChip}
                >
                  <MaterialCommunityIcons name="wrench-outline" size={16} color={PRIMARY_COLOR} />
                  <Text style={styles.phraseChipText}>"I offer Services"</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  disabled={voiceStatus === 'recognizing' || voiceStatus === 'success'}
                  onPress={() => handleSimulateSpeech('I lease machinery', 'rental_owner')} 
                  style={styles.phraseChip}
                >
                  <MaterialCommunityIcons name="key-outline" size={16} color={PRIMARY_COLOR} />
                  <Text style={styles.phraseChipText}>"I lease machinery"</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  disabled={voiceStatus === 'recognizing' || voiceStatus === 'success'}
                  onPress={() => handleSimulateSpeech('I am a Customer', 'customer')} 
                  style={styles.phraseChip}
                >
                  <MaterialCommunityIcons name="account-outline" size={16} color={PRIMARY_COLOR} />
                  <Text style={styles.phraseChipText}>"I am a Customer"</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Surface>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    margin: 0,
  },
  headerRowTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  voiceTriggerButton: {
    margin: 0,
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    width: '48%',
  },
  roleCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  icon: {
    marginBottom: 12,
  },
  roleName: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  continueButton: {
    borderRadius: 16,
  },
  buttonContent: {
    height: 60,
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Voice Modal / Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissTrigger: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingBottom: 36,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  closeModalButton: {
    position: 'absolute',
    right: 12,
    top: 0,
  },
  voiceAssistantContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  voiceAssistantTitle: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  micAnimationContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulseWaveCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0066FF',
  },
  micButtonSurface: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 16,
    textAlign: 'center',
  },
  speechBubble: {
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    maxWidth: '90%',
  },
  speechBubbleText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#0066FF',
    fontWeight: '500',
  },
  phrasesContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  phraseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  phraseChipText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
});

export default RoleSelectionScreen;
