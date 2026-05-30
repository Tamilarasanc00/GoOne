import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type NearbyHelpNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NearbyHelp'>;

const EMERGENCY_REQUESTS = [
  { id: 'electrician', title: 'Need Electrician', icon: 'lightning-bolt', color: '#FF9800', description: 'Power failure, short circuit' },
  { id: 'tractor', title: 'Need Tractor', icon: 'tractor', color: '#4CAF50', description: 'Urgent plowing, towing' },
  { id: 'workers', title: 'Need Workers', icon: 'account-hard-hat', color: '#2196F3', description: 'Harvesting, loading, construction' },
  { id: 'plumber', title: 'Need Plumber', icon: 'pipe-wrench', color: '#9C27B0', description: 'Pipe burst, water leakage' },
];

export default function NearbyHelpScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NearbyHelpNavigationProp>();
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleRequest = (id: string, title: string) => {
    // Simulate one-tap request with location sharing and notification trigger
    setRequestingId(id);
    
    setTimeout(() => {
      setRequestingId(null);
      Alert.alert(
        "Request Sent!",
        `Your location and "${title}" request have been broadcasted to nearby providers. They will contact you shortly.`,
        [{ text: "OK" }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Emergency Help</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top Info Banner */}
        <Surface style={styles.infoBanner} elevation={0}>
          <MaterialCommunityIcons name="broadcast" size={32} color="#D32F2F" />
          <View style={styles.infoTextContainer}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#D32F2F' }}>
              One-Tap Broadcast
            </Text>
            <Text variant="bodyMedium" style={{ color: '#5D4037', marginTop: 4 }}>
              Tap a button below to instantly share your current location and notify nearby providers.
            </Text>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.gridContainer}>
          {EMERGENCY_REQUESTS.map((req) => (
            <TouchableOpacity
              key={req.id}
              activeOpacity={0.8}
              onPress={() => handleRequest(req.id, req.title)}
              disabled={requestingId !== null}
              style={styles.cardWrapper}
            >
              <Surface style={[styles.actionCard, { borderColor: req.color }]} elevation={2}>
                {requestingId === req.id ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={req.color} size="large" />
                    <Text style={[styles.loadingText, { color: req.color }]}>Broadcasting...</Text>
                  </View>
                ) : (
                  <>
                    <View style={[styles.iconCircle, { backgroundColor: req.color + '20' }]}>
                      <MaterialCommunityIcons name={req.icon} size={48} color={req.color} />
                    </View>
                    <Text variant="titleMedium" style={styles.actionTitle}>
                      {req.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.actionDescription} numberOfLines={2}>
                      {req.description}
                    </Text>
                  </>
                )}
              </Surface>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#D32F2F', // Red for emergency
  },
  scrollContent: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  actionCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 2,
    minHeight: 180,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    textAlign: 'center',
    color: '#757575',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130, // To match the height of content
  },
  loadingText: {
    marginTop: 16,
    fontWeight: 'bold',
  },
});
