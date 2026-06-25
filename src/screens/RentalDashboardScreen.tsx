import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, StatusBar } from 'react-native';
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

const RENTAL_EMOJIS: Record<string, string> = {
  tractor: '🚜', harvester: '🚜', bike: '🏉️', bicycle: '🚲', motorcycle: '🏉️',
  truck: '🚚', 'mini truck': '🚚', auto: '🚛', van: '🚐',
  jcb: '🏗️', excavator: '🏗️', crane: '🏗️',
  pump: '💧', 'water pump': '💧', generator: '⚡',
  drill: '🔧', chainsaw: '🔪', cutter: '✂️',
  tools: '🛠️', 'power tools': '🛠️',
  'water tanker': '🚚',
};

function getRentalEmoji(title: string, category?: string): string {
  const text = ((title || '') + ' ' + (category || '')).toLowerCase();
  for (const key of Object.keys(RENTAL_EMOJIS)) {
    if (text.includes(key)) return RENTAL_EMOJIS[key];
  }
  return '🚜';
}

type RentalDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RentalDashboardScreen() {
  const navigation = useNavigation<RentalDashboardNavigationProp>();
  const profile = useAppSelector((state: any) => state.profile.profile);
  const user = useAppSelector((state: any) => state.profile.user);

  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadRentals = async () => {
    setLoading(true); setError(false);
    try {
      const res = await apiService.rentals.listMyRentals();
      if (res?.success) setRentals(res.rentals || []);
      else setError(true);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadRentals(); }, []));

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Listing', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiService.rentals.delete(id);
            showToast('Deleted'); loadRentals();
          } catch (err: any) { showToast(err.message || 'Error'); }
        }
      }
    ]);
  };

  const ownerName = user?.name || 'Rental Partner';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.amberPrimary} />

      {/* Amber gradient header */}
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
          
          <Text style={styles.screenTitle}>Rental Dashboard</Text>
          
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
              <Text style={styles.avatarTxt}>🚜</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.ownerName}>{ownerName}</Text>
              <Text style={styles.ownerSub}>View Profile & Settings</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('CreateProfile', { isEdit: true })}>
            <Text style={styles.editBtnTxt}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[{ v: String(rentals.length), l: 'Items' }, { v: '₹15.4K', l: 'Earnings' }, { v: '3', l: 'Active' }].map(s => (
            <View key={s.l} style={styles.statItem}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.amberSoft }]} onPress={() => navigation.navigate('AddRental')}>
            <Text style={{ fontSize: 28 }}>📋</Text>
            <Text style={[styles.actionLabel, { color: Colors.amberPrimary }]}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.greenSoft }]} onPress={() => showToast('Calendar coming soon')}>
            <Text style={{ fontSize: 28 }}>📅</Text>
            <Text style={[styles.actionLabel, { color: Colors.greenPrimary }]}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.blueSoft }]} onPress={() => navigation.navigate('CreateProfile', { isEdit: true })}>
            <Text style={{ fontSize: 28 }}>✏️</Text>
            <Text style={[styles.actionLabel, { color: Colors.bluePrimary }]}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.purpleSoft }]} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}>
            <Text style={{ fontSize: 28 }}>🏠</Text>
            <Text style={[styles.actionLabel, { color: Colors.purplePrimary }]}>Go Home</Text>
          </TouchableOpacity>
        </View>

        {/* Rentals */}
        <SectionHeader
          title={`🚜 My Equipment (${rentals.length})`}
          actionLabel="+ Add"
          onAction={() => navigation.navigate('AddRental')}
        />
        {loading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color={Colors.amberPrimary} /></View>
        ) : error ? (
          <TouchableOpacity style={styles.errorCard} onPress={loadRentals}>
            <Text style={styles.errorTxt}>⚠️ Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        ) : rentals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40 }}>🚜</Text>
            <Text style={styles.emptyTxt}>No equipment listed yet</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.amberPrimary }]} onPress={() => navigation.navigate('AddRental')}>
              <Text style={styles.addBtnTxt}>+ Add First Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rentals.map(item => (
            <View key={item.id} style={styles.rentalCard}>
              <View style={styles.rentalIcon}><Text style={{ fontSize: 30 }}>{getRentalEmoji(item.title, item.category)}</Text></View>
              <View style={styles.rentalInfo}>
                <Text style={styles.rentalName}>{item.title}</Text>
                <Text style={styles.rentalPrice}>₹{parseFloat(item.price_per_day).toFixed(0)}/day</Text>
                <StatusChip label={item.is_available ? 'Available' : 'Rented Out'} type={item.is_available ? 'green' : 'orange'} />
              </View>
              <View style={styles.rentalActions}>
                <TouchableOpacity onPress={() => navigation.navigate('AddRental', { rentalId: item.id.toString() })}>
                  <Text style={{ fontSize: 20 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title)}>
                  <Text style={{ fontSize: 20 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    backgroundColor: Colors.amberPrimary,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xl,
    overflow: 'hidden', position: 'relative',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
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
  ownerName: { fontSize: 16, fontWeight: '800', color: Colors.white },
  ownerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg, padding: Spacing.md, justifyContent: 'space-around', zIndex: 1 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: Colors.white },
  statLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { padding: Spacing.md, paddingTop: Spacing.lg },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  actionCard: { width: '48%', borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 6 },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  loader: { paddingVertical: 32, alignItems: 'center' },
  errorCard: { padding: Spacing.md, backgroundColor: Colors.redSoft, borderRadius: Radius.md, marginBottom: Spacing.md },
  errorTxt: { color: Colors.redPrimary, fontWeight: '600', fontSize: 13 },
  emptyCard: { padding: Spacing.xl, backgroundColor: Colors.white, borderRadius: Radius.lg, alignItems: 'center', marginBottom: Spacing.md },
  emptyTxt: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 8, marginBottom: 12 },
  addBtn: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  rentalCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  rentalIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.amberSoft, alignItems: 'center', justifyContent: 'center' },
  rentalInfo: { flex: 1, marginLeft: 12, gap: 4 },
  rentalName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  rentalPrice: { fontSize: 15, fontWeight: '800', color: Colors.amberPrimary },
  rentalActions: { gap: 8 },
});
