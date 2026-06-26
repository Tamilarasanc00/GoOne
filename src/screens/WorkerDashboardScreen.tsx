import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../redux/hooks';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader, StatusChip } from '../components/GoOneUI';
import OfflineBanner from '../components/OfflineBanner';

type WorkerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MOCK_JOB_REQUESTS = [
  { id: 1, title: 'Electrical Repairs', location: 'Omalur, Salem', rate: '₹500', urgent: true },
  { id: 2, title: 'Plumbing Fix', location: 'Attur, Salem', rate: '₹400', urgent: false },
  { id: 3, title: 'AC Service', location: 'Namakkal', rate: '₹600', urgent: false },
];

function getJobEmoji(title: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('electr')) return '⚡';
  if (t.includes('plumb') || t.includes('pipe')) return '🔧';
  if (t.includes('ac') || t.includes('air con')) return '❄️';
  if (t.includes('paint')) return '🎨';
  if (t.includes('carpent') || t.includes('wood')) return '🪵';
  if (t.includes('mason') || t.includes('cement')) return '🏗️';
  if (t.includes('clean')) return '🧹';
  if (t.includes('weld')) return '🔥';
  if (t.includes('garden') || t.includes('farm')) return '🌱';
  if (t.includes('cook')) return '🍳';
  if (t.includes('driver') || t.includes('truck')) return '🚚';
  return '📋';
}

export default function WorkerDashboardScreen() {
  const navigation = useNavigation<WorkerDashboardNavigationProp>();
  const user = useAppSelector((state: any) => state.profile.user);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(false);
  const isFetching = useRef(false);

  const loadProfile = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true); setError(false);
    try {
      const res = await apiService.workers.getMyProfile();
      if (res?.success) setProfile(res.profile);
      else setError(true);
    } catch { setError(true); }
    finally { setLoading(false); isFetching.current = false; }
  }, []);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await apiService.workers.toggleAvailability();
      if (res?.success) {
        setProfile((p: any) => p ? { ...p, is_available: res.is_available } : null);
        showToast(res.is_available ? '✅ You are now Available' : '⏸️ You are now Offline');
      }
    } catch (err: any) { showToast(err.message || 'Error toggling'); }
    finally { setToggling(false); }
  };

  const workerName = user?.name || 'Worker';
  const isAvail = !!profile?.is_available;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.purplePrimary} />
      <OfflineBanner />

      {/* Purple gradient header */}
      <View style={styles.header}>
        <View style={[styles.circle, { width: 200, height: 200, top: -60, right: -60 }]} />
        <View style={[styles.circle, { width: 120, height: 120, bottom: -20, left: 40 }]} />

        <View style={styles.headerTop}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
            style={styles.homeBtn}
          >
            <Text style={{ fontSize: 18 }}>🏠</Text>
          </TouchableOpacity>
          
          <Text style={styles.screenTitle}>Worker Dashboard</Text>
          
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Notifications' as any)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shopProfileRow}>
          <View style={styles.shopProfileLeft}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatar}
            >
              <Text style={styles.avatarTxt}>🔧</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.workerName}>{workerName}</Text>
              <Text style={styles.workerSub}>View Profile & Settings</Text>
            </View>
          </View>
          
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedTxt}>✓ Verified</Text>
          </View>
        </View>

        {/* Availability toggle */}
        <View style={styles.availWrap}>
          <View>
            <Text style={styles.availTitle}>Availability Status</Text>
            <Text style={[styles.availStatus, { color: isAvail ? Colors.greenLight : Colors.redLight }]}>
              {isAvail ? '● Available for Jobs' : '● Offline / Busy'}
            </Text>
          </View>
          <Switch
            value={isAvail}
            onValueChange={handleToggle}
            disabled={toggling || loading}
            thumbColor={Colors.white}
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.greenPrimary }}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[{ v: '⭐ 4.8', l: 'Rating' }, { v: '14', l: 'Bookings' }, { v: '₹7.2K', l: 'Earnings' }].map(s => (
            <View key={s.l} style={styles.statItem}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Skills */}
        {profile?.service_category && (
          <View style={styles.skillsSection}>
            <SectionHeader title="My Skills" />
            <View style={styles.skillsRow}>
              {(profile.service_category || 'Electrician').split(',').map((s: string) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillTxt}>{s.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Service details */}
        <SectionHeader title="📋 Service Profile" actionLabel="Edit" onAction={() => navigation.navigate('CreateProfile', { isEdit: true })} />
        {loading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color={Colors.purplePrimary} /></View>
        ) : error ? (
          <TouchableOpacity style={styles.errorCard} onPress={loadProfile}>
            <Text style={styles.errorTxt}>⚠️ Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        ) : !profile ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40 }}>🔧</Text>
            <Text style={styles.emptyTxt}>No service profile set up</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.purplePrimary }]} onPress={() => navigation.navigate('CreateProfile', { isEdit: true })}>
              <Text style={styles.addBtnTxt}>+ Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileCard}>
            {[
              { emoji: '🔧', label: 'Service', value: profile.service_category },
              { emoji: '💰', label: 'Rate', value: `₹${profile.hourly_rate}/hr` },
              { emoji: '⏳', label: 'Experience', value: `${profile.experience_years} Years` },
              { emoji: '📍', label: 'Location', value: profile.location },
            ].map(row => (
              <View key={row.label} style={styles.detailRow}>
                <Text style={{ fontSize: 18 }}>{row.emoji}</Text>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.viewPublicProfileBtn}
              onPress={() => navigation.navigate('WorkerDetails', { workerId: String(profile.id), workerName: workerName })}
              activeOpacity={0.8}
            >
              <Text style={styles.viewPublicProfileTxt}>👁️ View Public Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Job Requests */}
        <SectionHeader title="📩 Job Requests" />
        {MOCK_JOB_REQUESTS.map(job => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobLeft}>
              {job.urgent && <StatusChip label="URGENT" type="red" />}
              <Text style={styles.jobTitle}>{getJobEmoji(job.title)} {job.title}</Text>
              <Text style={styles.jobLocation}>📍 {job.location}</Text>
              <Text style={styles.jobRate}>{job.rate}</Text>
            </View>
            <View style={styles.jobActions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => showToast('Job accepted!')}>
                <Text style={styles.acceptTxt}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn} onPress={() => showToast('Calling employer...')}>
                <Text style={styles.callTxt}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    backgroundColor: Colors.purplePrimary,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xl,
    overflow: 'hidden', position: 'relative',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg, zIndex: 1 },
  screenTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  shopProfileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, zIndex: 1 },
  shopProfileLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  homeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 22 },
  workerName: { fontSize: 16, fontWeight: '800', color: Colors.white },
  workerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  verifiedBadge: { backgroundColor: Colors.greenPrimary, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedTxt: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  availWrap: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, zIndex: 1,
  },
  availTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  availStatus: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg, padding: Spacing.md, justifyContent: 'space-around', zIndex: 1 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '900', color: Colors.white },
  statLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { padding: Spacing.md, paddingTop: Spacing.lg },
  skillsSection: { marginBottom: Spacing.md },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: Colors.purpleSoft, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  skillTxt: { fontSize: 12, fontWeight: '700', color: Colors.purplePrimary },
  loader: { paddingVertical: 32, alignItems: 'center' },
  errorCard: { padding: Spacing.md, backgroundColor: Colors.redSoft, borderRadius: Radius.md, marginBottom: Spacing.md },
  errorTxt: { color: Colors.redPrimary, fontWeight: '600', fontSize: 13 },
  emptyCard: { padding: Spacing.xl, backgroundColor: Colors.white, borderRadius: Radius.lg, alignItems: 'center', marginBottom: Spacing.md },
  emptyTxt: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 8, marginBottom: 12 },
  addBtn: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  profileCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2, gap: 14,
  },
  viewPublicProfileBtn: {
    borderWidth: 1.5,
    borderColor: Colors.purplePrimary,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  viewPublicProfileTxt: {
    color: Colors.purplePrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 1 },
  jobCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: 10, alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  jobLeft: { flex: 1, gap: 3 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  jobLocation: { fontSize: 11, color: Colors.textMuted },
  jobRate: { fontSize: 14, fontWeight: '800', color: Colors.purplePrimary },
  jobActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: Colors.purplePrimary, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  acceptTxt: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  callTxt: { fontSize: 16 },
});
