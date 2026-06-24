import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { socketClient } from '../services/socketClient';
import { requestLocationPermission, getCurrentLocation, LocationCoordinates } from '../utils/locationUtils';
import { storage } from '../services/storage';
import { API_URL } from '../config/apiConfig';
import { showToast } from '../utils/toast';
import { Linking } from 'react-native';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader } from '../components/GoOneUI';

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

const SOS_ACTIONS = [
  { id: 'electrician', title: 'Electrician', emoji: '⚡', color: Colors.amberPrimary, bg: Colors.amberSoft, desc: 'Electrical emergency' },
  { id: 'tractor', title: 'Tractor', emoji: '🚜', color: Colors.greenPrimary, bg: Colors.greenSoft, desc: 'Farm emergency' },
  { id: 'workers', title: '5 Workers', emoji: '👷', color: Colors.bluePrimary, bg: Colors.blueSoft, desc: 'Labor needed now' },
  { id: 'tanker', title: 'Water Tanker', emoji: '🚰', color: '#00BCD4', bg: '#E0F7FA', desc: 'Water supply SOS' },
  { id: 'medical', title: 'Medical Help', emoji: '🏥', color: Colors.redPrimary, bg: Colors.redSoft, desc: 'Health emergency' },
  { id: 'police', title: 'Police', emoji: '🚔', color: Colors.dark, bg: Colors.bgLight, desc: 'Law enforcement' },
];

export default function NearbyHelpScreen() {
  const navigation = useNavigation<NearbyHelpNavigationProp>();
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [activeTab, setActiveTab] = useState<'request' | 'helper'>('request');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [radius, setRadius] = useState('5');
  const [submitting, setSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<HelpRequest[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [myRequest, setMyRequest] = useState<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing SOS animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    socketClient.connect();
    const handleNearby = (payload: any) => {
      setAlerts(prev => prev.some(p => p.id === payload.requestId) ? prev : [
        {
          id: payload.requestId, title: payload.title, description: payload.description,
          latitude: payload.latitude, longitude: payload.longitude, radius: payload.radius,
          status: 'Pending', created_at: new Date().toISOString(), requester_name: 'Nearby Resident',
        },
        ...prev,
      ]);
      showToast(`⚠️ SOS: ${payload.title}`);
      setActiveTab('helper');
    };
    const handleAccepted = (payload: any) => {
      if (myRequest?.id === payload.requestId) {
        setMyRequest((p: any) => p ? { ...p, status: 'Accepted', helperName: payload.helperName, helperPhone: payload.helperPhone } : null);
      }
      showToast(`✅ Help accepted by ${payload.helperName}!`);
    };
    socketClient.on('nearby_help_alert', handleNearby);
    socketClient.on('help_request_accepted', handleAccepted);
    updateCoords();
    return () => {
      socketClient.off('nearby_help_alert', handleNearby);
      socketClient.off('help_request_accepted', handleAccepted);
    };
  }, [myRequest]);

  useEffect(() => {
    if (activeTab === 'helper') fetchAlerts();
  }, [activeTab]);

  const updateCoords = async () => {
    setLoadingLoc(true);
    const ok = await requestLocationPermission();
    if (!ok) { showToast('Location permission denied'); setLoadingLoc(false); return; }
    try {
      const coords = await getCurrentLocation();
      setCoordinates(coords);
      const token = storage.getString('APP_JWT_TOKEN');
      if (token) {
        await fetch(`${API_URL}/help/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
        });
      }
    } catch {}
    finally { setLoadingLoc(false); }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const token = storage.getString('APP_JWT_TOKEN');
      const res = await fetch(`${API_URL}/help/active`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAlerts(data.requests || []);
    } catch {}
    finally { setLoadingAlerts(false); }
  };

  const broadcast = async (title: string, description: string, radiusVal: number) => {
    if (!coordinates) { showToast('Location not available'); return; }
    setSubmitting(true);
    try {
      const token = storage.getString('APP_JWT_TOKEN');
      const res = await fetch(`${API_URL}/help/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, latitude: coordinates.latitude, longitude: coordinates.longitude, radius: radiusVal }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyRequest(data.request);
        showToast(`✅ Alert sent to ${data.notifiedCount || 0} nearby helpers!`);
        setCustomTitle(''); setCustomDesc('');
      } else {
        showToast(data.message || 'Failed to broadcast');
      }
    } catch { showToast('Unable to broadcast SOS'); }
    finally { setSubmitting(false); }
  };

  const handleAccept = async (requestId: number) => {
    const token = storage.getString('APP_JWT_TOKEN');
    const res = await fetch(`${API_URL}/help/accept/${requestId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok && data.success) { showToast('✅ SOS Accepted!'); fetchAlerts(); }
    else showToast(data.message || 'Error');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.redPrimary} />

      {/* Red SOS Header */}
      <View style={styles.header}>
        <View style={[styles.circle, { width: 200, height: 200, top: -60, right: -60 }]} />
        <View style={[styles.circle, { width: 120, height: 120, bottom: -20, left: 30 }]} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={updateCoords} style={styles.locBtn}>
            <Text style={styles.locTxt}>{loadingLoc ? '📡 Locating...' : '📍 GPS Active'}</Text>
          </TouchableOpacity>
        </View>

        {/* SOS Hero */}
        <View style={styles.sosHero}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.sosCircle}>
            <Text style={styles.sosEmoji}>🆘</Text>
          </View>
          <Text style={styles.sosTitle}>Emergency SOS</Text>
          <Text style={styles.sosSub}>Tap a button below to alert nearby people instantly</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'request' && styles.tabActive]} onPress={() => setActiveTab('request')}>
          <Text style={[styles.tabTxt, activeTab === 'request' && styles.tabTxtActive]}>🚨 Request Help</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'helper' && styles.tabActive]} onPress={() => setActiveTab('helper')}>
          <Text style={[styles.tabTxt, activeTab === 'helper' && styles.tabTxtActive]}>🤝 Be a Helper</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'request' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Active Request */}
          {myRequest && (
            <View style={styles.activeCard}>
              <Text style={styles.activeTitle}>📡 Your Active Broadcast</Text>
              <Text style={styles.activeReqTitle}>{myRequest.title}</Text>
              <Text style={styles.activeStatus}>Status: {myRequest.status}</Text>
              {myRequest.helperName && (
                <Text style={styles.helperText}>✅ Accepted by: {myRequest.helperName}</Text>
              )}
              <View style={styles.activeActions}>
                {myRequest.helperPhone && (
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${myRequest.helperPhone}`)}>
                    <Text style={styles.callBtnTxt}>📞 Call Helper</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.dismissBtn} onPress={() => setMyRequest(null)}>
                  <Text style={styles.dismissTxt}>✕ Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <SectionHeader title="⚡ Quick SOS Broadcast" />
          <View style={styles.sosGrid}>
            {SOS_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.sosCard, { backgroundColor: action.bg, borderColor: action.color }]}
                onPress={() => broadcast(`Need ${action.title} Now`, action.desc, parseInt(radius, 10))}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.sosCardEmoji}>{action.emoji}</Text>
                <Text style={[styles.sosCardTitle, { color: action.color }]}>{action.title}</Text>
                <Text style={styles.sosCardDesc}>{action.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alert All Button */}
          <TouchableOpacity
            style={styles.alertAllBtn}
            onPress={() => {
              Alert.alert('⚠️ Alert All Nearby', 'This will broadcast a general emergency alert to all nearby users. Continue?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Alert Now!', style: 'destructive', onPress: () => broadcast('GENERAL EMERGENCY ALERT', 'I need immediate help at my location', 10) },
              ]);
            }}
          >
            <Text style={styles.alertAllTxt}>🚨 Alert All Nearby People</Text>
          </TouchableOpacity>

          {/* Custom Request */}
          <SectionHeader title="📝 Custom Help Request" />
          <View style={styles.customForm}>
            <TextInput
              placeholder="What help do you need?"
              value={customTitle}
              onChangeText={setCustomTitle}
              style={styles.input}
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              placeholder="Additional details (location, urgency...)"
              value={customDesc}
              onChangeText={setCustomDesc}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.radiusRow}>
              <Text style={styles.radiusLabel}>Search Radius: {radius} km</Text>
              <View style={styles.radiusBtns}>
                {['2', '5', '10', '20'].map(r => (
                  <TouchableOpacity key={r} style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]} onPress={() => setRadius(r)}>
                    <Text style={[styles.radiusBtnTxt, radius === r && styles.radiusBtnTxtActive]}>{r}km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.broadcastBtn, (!customTitle || submitting) && styles.broadcastBtnDisabled]}
              onPress={() => broadcast(customTitle, customDesc, parseInt(radius, 10))}
              disabled={!customTitle || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.broadcastBtnTxt}>📡 Broadcast Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          <Text style={styles.alertsTitle}>📍 Active Nearby Alerts</Text>
          {loadingAlerts ? (
            <ActivityIndicator style={{ marginTop: 32 }} size="large" color={Colors.redPrimary} />
          ) : alerts.length === 0 ? (
            <View style={styles.noAlertsWrap}>
              <Text style={{ fontSize: 48 }}>👂</Text>
              <Text style={styles.noAlertsTxt}>No active alerts nearby right now.</Text>
              <Text style={styles.noAlertsSub}>You'll be notified when someone needs help.</Text>
            </View>
          ) : (
            <FlatList
              data={alerts}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ padding: Spacing.md }}
              renderItem={({ item }) => (
                <View style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <View style={styles.sosBadge}><Text style={styles.sosBadgeTxt}>SOS</Text></View>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.alertDesc}>{item.description || 'No additional details'}</Text>
                  <Text style={styles.alertMeta}>📍 {item.radius} km range · 👤 {item.requester_name}</Text>
                  <View style={styles.alertActions}>
                    {item.requester_phone && (
                      <TouchableOpacity style={styles.callSosBtn} onPress={() => Linking.openURL(`tel:${item.requester_phone}`)}>
                        <Text style={styles.callSosTxt}>📞 Call SOS</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.acceptSosBtn} onPress={() => handleAccept(item.id)}>
                      <Text style={styles.acceptSosTxt}>✓ Accept SOS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    backgroundColor: Colors.redPrimary,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.lg,
    overflow: 'hidden', position: 'relative',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, zIndex: 1 },
  backTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700' },
  locBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  locTxt: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  sosHero: { alignItems: 'center', paddingVertical: Spacing.md, zIndex: 1 },
  pulseOuter: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sosCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  sosEmoji: { fontSize: 40 },
  sosTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  sosSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 4 },

  tabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: Colors.redPrimary },
  tabTxt: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTxtActive: { color: Colors.redPrimary, fontWeight: '800' },

  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },

  activeCard: {
    backgroundColor: Colors.redSoft,
    borderWidth: 1.5, borderColor: Colors.redPrimary,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  activeTitle: { fontSize: 11, fontWeight: '800', color: Colors.redPrimary, marginBottom: 4 },
  activeReqTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  activeStatus: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  helperText: { fontSize: 13, fontWeight: '700', color: Colors.greenPrimary, marginTop: 4 },
  activeActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  callBtn: { backgroundColor: Colors.greenPrimary, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8 },
  callBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  dismissBtn: { backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  dismissTxt: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  sosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  sosCard: {
    width: '47%',
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2,
  },
  sosCardEmoji: { fontSize: 36, marginBottom: 6 },
  sosCardTitle: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  sosCardDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  alertAllBtn: {
    backgroundColor: Colors.redPrimary, borderRadius: Radius.lg, padding: Spacing.md + 4,
    alignItems: 'center', marginBottom: Spacing.lg,
    shadowColor: Colors.redPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 8,
  },
  alertAllTxt: { color: Colors.white, fontWeight: '900', fontSize: 15 },

  customForm: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md },
  input: {
    backgroundColor: Colors.bgLight, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary, marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  radiusRow: { marginBottom: 12 },
  radiusLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  radiusBtns: { flexDirection: 'row', gap: 8 },
  radiusBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  radiusBtnActive: { borderColor: Colors.redPrimary, backgroundColor: Colors.redSoft },
  radiusBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  radiusBtnTxtActive: { color: Colors.redPrimary },
  broadcastBtn: { backgroundColor: Colors.redPrimary, borderRadius: Radius.full, padding: 14, alignItems: 'center' },
  broadcastBtnDisabled: { opacity: 0.5 },
  broadcastBtnTxt: { color: Colors.white, fontWeight: '800', fontSize: 15 },

  alertsTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  noAlertsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  noAlertsTxt: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  noAlertsSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  alertCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sosBadge: { backgroundColor: Colors.redPrimary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sosBadgeTxt: { color: Colors.white, fontSize: 10, fontWeight: '900' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  alertDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  alertMeta: { fontSize: 11, color: Colors.textMuted, marginBottom: 12 },
  alertActions: { flexDirection: 'row', gap: 10 },
  callSosBtn: { borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.greenSoft },
  callSosTxt: { color: Colors.greenPrimary, fontWeight: '700', fontSize: 12 },
  acceptSosBtn: { borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.redPrimary },
  acceptSosTxt: { color: Colors.white, fontWeight: '700', fontSize: 12 },
});
