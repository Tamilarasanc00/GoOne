import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, FlatList } from 'react-native';
import { Text, Surface, IconButton, useTheme, ActivityIndicator, Button, Card, Badge, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { socketClient } from '../services/socketClient';
import { requestLocationPermission, getCurrentLocation, LocationCoordinates } from '../utils/locationUtils';
import { storage } from '../services/storage';
import { API_URL } from '../config/apiConfig';
import { showToast } from '../utils/toast';
import { Linking } from 'react-native';

type NearbyHelpNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NearbyHelp'>;

interface HelpRequest {
  id: number;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  radius: number;
  status: string;
  created_at: string;
  requester_name: string;
  requester_phone?: string;
}

const QUICK_REQUESTS = [
  { id: 'electrician', title: 'Need Electrician Now', icon: 'lightning-bolt', color: '#FF9800', description: 'Immediate electrical repairs' },
  { id: 'tractor', title: 'Need Tractor Now', icon: 'tractor', color: '#4CAF50', description: 'Urgent plowing or transport' },
  { id: 'workers', title: 'Need 5 Workers Now', icon: 'account-group', color: '#2196F3', description: 'Daily wage field workers' },
  { id: 'tanker', title: 'Need Water Tanker Now', icon: 'water', color: '#00BCD4', description: 'Water supply emergency' },
];

export default function NearbyHelpScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NearbyHelpNavigationProp>();
  
  // Location & Loading
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'request' | 'helper'>('request');

  // Form State
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customRadius, setCustomRadius] = useState<string>('5');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Lists
  const [activeAlerts, setActiveAlerts] = useState<HelpRequest[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);
  const [myRequest, setMyRequest] = useState<any>(null);

  // Initialize Socket.IO connection and Location tracking
  useEffect(() => {
    socketClient.connect();

    // Setup Socket Listeners
    const handleNearbyAlert = (payload: any) => {
      // Add to local list of active alerts
      setActiveAlerts(prev => {
        if (prev.some(p => p.id === payload.requestId)) return prev;
        return [
          {
            id: payload.requestId,
            title: payload.title,
            description: payload.description,
            latitude: payload.latitude,
            longitude: payload.longitude,
            radius: payload.radius,
            status: 'Pending',
            created_at: new Date().toISOString(),
            requester_name: 'Nearby Resident',
          },
          ...prev,
        ];
      });

      showToast(`⚠️ HELP ALERT: ${payload.title}`);
      setActiveTab('helper');
    };

    const handleAlertAccepted = (payload: any) => {
      if (myRequest && myRequest.id === payload.requestId) {
        setMyRequest((prev: any) => prev ? { 
          ...prev, 
          status: 'Accepted', 
          helperName: payload.helperName,
          helperPhone: payload.helperPhone
        } : null);
      }
      showToast(`Help accepted by ${payload.helperName}!`);
    };

    socketClient.on('nearby_help_alert', handleNearbyAlert);
    socketClient.on('help_request_accepted', handleAlertAccepted);

    // Get and update location
    updateCoordinates();

    return () => {
      socketClient.off('nearby_help_alert', handleNearbyAlert);
      socketClient.off('help_request_accepted', handleAlertAccepted);
    };
  }, [myRequest]);

  const updateCoordinates = async () => {
    setLoadingLocation(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showToast('Location permission denied.');
      setLoadingLocation(false);
      return;
    }

    try {
      const coords = await getCurrentLocation();
      setCoordinates(coords);
      showToast('Location captured successfully!');
      
      // Update backend location
      const token = storage.getString('APP_JWT_TOKEN');
      if (token) {
        await fetch(`${API_URL}/help/location`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchActiveAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const token = storage.getString('APP_JWT_TOKEN');
      const response = await fetch(`${API_URL}/help/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setActiveAlerts(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching active alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'helper') {
      fetchActiveAlerts();
    }
  }, [activeTab]);

  const triggerBroadcast = async (title: string, description: string, radiusVal: number) => {
    if (!coordinates) {
      showToast('Unable to fetch current location.');
      return;
    }

    setSubmitting(true);
    try {
      const token = storage.getString('APP_JWT_TOKEN');
      const response = await fetch(`${API_URL}/help/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radius: radiusVal,
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMyRequest(data.request);
        showToast(`Nearby users notified! (${data.notifiedCount || 0} helpers in range)`);
        setCustomTitle('');
        setCustomDescription('');
      } else {
        showToast(data.message || 'Failed to create help request.');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      showToast('Unable to create help request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAlert = async (requestId: number) => {
    try {
      const token = storage.getString('APP_JWT_TOKEN');
      const response = await fetch(`${API_URL}/help/accept/${requestId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast('SOS request accepted successfully');
        // Refresh
        fetchActiveAlerts();
      } else {
        showToast(data.message || 'Could not accept request.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      showToast('Failed to accept SOS alert');
    }
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
        <Text variant="titleLarge" style={styles.headerTitle}>Nearby Help System</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={updateCoordinates}
          loading={loadingLocation}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Button 
          mode={activeTab === 'request' ? 'contained' : 'outlined'} 
          style={styles.tabButton} 
          onPress={() => setActiveTab('request')}
        >
          Request Help
        </Button>
        <Button 
          mode={activeTab === 'helper' ? 'contained' : 'outlined'} 
          style={styles.tabButton} 
          onPress={() => setActiveTab('helper')}
        >
          Be a Helper
        </Button>
      </View>

      {activeTab === 'request' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Request Card */}
          {myRequest && (
            <Card style={styles.activeRequestCard} mode="contained">
              <Card.Title 
                title="Your Active Broadcast" 
                subtitle={`Status: ${myRequest.status}`} 
                left={(props) => <Avatar.Icon {...props} icon="broadcast" style={{ backgroundColor: '#D32F2F' }} />}
              />
              <Card.Content>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{myRequest.title}</Text>
                {myRequest.helperName && (
                  <Text style={{ marginTop: 8, color: '#2E7D32', fontWeight: 'bold' }}>
                    ✅ Accepted by: {myRequest.helperName}
                  </Text>
                )}
              </Card.Content>
              <Card.Actions style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                {myRequest.helperPhone ? (
                  <Button 
                    icon="phone" 
                    onPress={() => {
                      showToast(`Calling helper ${myRequest.helperName}...`);
                      Linking.openURL(`tel:${myRequest.helperPhone}`);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Call Helper
                  </Button>
                ) : null}
                <Button onPress={() => setMyRequest(null)} textColor="#D32F2F">Dismiss Alert</Button>
              </Card.Actions>
            </Card>
          )}

          {/* Quick Request Section */}
          <Text variant="titleMedium" style={styles.sectionHeader}>Quick Help Broadcast</Text>
          <View style={styles.quickGrid}>
            {QUICK_REQUESTS.map(req => (
              <TouchableOpacity
                key={req.id}
                style={styles.quickCard}
                onPress={() => triggerBroadcast(req.title, req.description, parseInt(customRadius, 10))}
                disabled={submitting}
              >
                <Surface style={styles.quickSurface} elevation={1}>
                  <View style={[styles.iconBox, { backgroundColor: req.color + '15' }]}>
                    <MaterialCommunityIcons name={req.icon} size={36} color={req.color} />
                  </View>
                  <Text variant="titleSmall" style={styles.quickTitle}>{req.title}</Text>
                  <Text variant="bodySmall" style={styles.quickDesc} numberOfLines={2}>{req.description}</Text>
                </Surface>
              </TouchableOpacity>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* Custom Request Form */}
          <Surface style={styles.customForm} elevation={1}>
            <Text variant="titleMedium" style={styles.formTitle}>Custom Help Request</Text>
            
            <TextInput
              placeholder="What help do you need? (e.g., Need 5 Workers Now)"
              value={customTitle}
              onChangeText={setCustomTitle}
              style={styles.input}
            />

            <TextInput
              placeholder="Additional details (location, urgency, details)"
              value={customDescription}
              onChangeText={setCustomDescription}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
            />

            <View style={styles.radiusRow}>
              <Text variant="bodyMedium">Search Radius (km):</Text>
              <TextInput
                keyboardType="numeric"
                value={customRadius}
                onChangeText={setCustomRadius}
                style={styles.radiusInput}
              />
            </View>

            <Button
              mode="contained"
              onPress={() => triggerBroadcast(customTitle, customDescription, parseInt(customRadius, 10))}
              loading={submitting}
              disabled={submitting || !customTitle}
              style={styles.submitButton}
            >
              Broadcast Request
            </Button>
          </Surface>
        </ScrollView>
      ) : (
        // Helper Tab
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
            Active Nearby Alerts
          </Text>
          {loadingAlerts ? (
            <ActivityIndicator style={{ marginTop: 32 }} />
          ) : activeAlerts.length === 0 ? (
            <Text style={styles.noAlertsText}>No active alerts nearby right now. Keep listening!</Text>
          ) : (
            <FlatList
              data={activeAlerts}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Card style={styles.alertCard} mode="outlined">
                  <Card.Title 
                    title={item.title} 
                    subtitle={`Posted by: ${item.requester_name || 'Resident'}`}
                    right={() => <Badge style={{ backgroundColor: '#D32F2F', marginRight: 16 }}>SOS</Badge>}
                  />
                  <Card.Content>
                    <Text variant="bodyMedium" style={{ color: '#424242' }}>{item.description || 'No additional details provided.'}</Text>
                    <Text variant="bodySmall" style={{ marginTop: 8, color: '#757575' }}>
                      Range: {item.radius} km
                    </Text>
                  </Card.Content>
                  <Card.Actions style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    {item.requester_phone ? (
                      <Button 
                        icon="phone" 
                        onPress={() => {
                          showToast(`Calling requester ${item.requester_name || 'Resident'}...`);
                          Linking.openURL(`tel:${item.requester_phone}`);
                        }}
                        style={{ marginRight: 8 }}
                      >
                        Call SOS
                      </Button>
                    ) : null}
                    <Button 
                      mode="contained" 
                      onPress={() => handleAcceptAlert(item.id)}
                      style={{ backgroundColor: '#2E7D32' }}
                    >
                      Accept SOS
                    </Button>
                  </Card.Actions>
                </Card>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const Avatar = {
  Icon: ({ icon, style, size = 40 }: { icon: string, style?: any, size?: number }) => (
    <View style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, style]}>
      <MaterialCommunityIcons name={icon} size={size * 0.6} color="#FFF" />
    </View>
  )
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
    color: '#D32F2F',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '48%',
    marginBottom: 16,
  },
  quickSurface: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    minHeight: 150,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 4,
  },
  quickDesc: {
    color: '#757575',
    textAlign: 'center',
    fontSize: 11,
  },
  divider: {
    marginVertical: 16,
  },
  customForm: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    width: 60,
    textAlign: 'center',
    paddingVertical: 4,
  },
  submitButton: {
    borderRadius: 8,
    backgroundColor: '#D32F2F',
  },
  activeRequestCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
  },
  noAlertsText: {
    textAlign: 'center',
    marginTop: 64,
    color: '#757575',
    fontStyle: 'italic',
    paddingHorizontal: 32,
  },
  alertCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
});
