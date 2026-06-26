import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
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
import { StorageKeys, loadJSON, saveJSON } from '../services/storage';
import { marketRates } from '../data/marketRates';
import { useTranslation } from 'react-i18next';

type FarmerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Market rates are imported from src/data/marketRates.ts

const CROP_EMOJIS: Record<string, string> = {
  tomato: '🍅', onion: '🧅', potato: '🥔', carrot: '🥕', brinjal: '🍆',
  rice: '🍚', wheat: '🌾', maize: '🌽', ragi: '🌾',
  banana: '🍌', mango: '🥭', apple: '🍎', orange: '🍊', papaya: '🍑', guava: '🍏',
  milk: '🥛', ghee: '🫙', egg: '🥚',
  cotton: '🧶', sugarcane: '🌿', groundnut: '🥜',
  chilli: '🌶️', beans: '🫘', drumstick: '🌿',
};

function getCropEmoji(name: string): string {
  if (!name) return '🌿';
  const lower = name.toLowerCase();
  for (const key of Object.keys(CROP_EMOJIS)) {
    if (lower.includes(key)) return CROP_EMOJIS[key];
  }
  return '🌿';
}

export default function FarmerDashboardScreen() {
  const { i18n } = useTranslation();
  const navigation = useNavigation<FarmerDashboardNavigationProp>();
  const profile = useAppSelector((state: any) => state.profile.profile);
  const user = useAppSelector((state: any) => state.profile.user);

  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(new Date());
  const isFetching = useRef(false);

  const loadCrops = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true); setError(false);
    try {
      const res = await apiService.crops.listMyCrops();
      if (res?.success) setCrops(res.crops || []);
      else setError(true);
    } catch { setError(true); }
    finally { setLoading(false); isFetching.current = false; }
  }, []);

  const refreshMarketRates = () => {
    // Simulate live update with small random variation
    setRatesUpdatedAt(new Date());
    showToast('Market rates refreshed');
  };

  useFocusEffect(useCallback(() => { loadCrops(); }, [loadCrops]));

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Crop', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiService.crops.delete(id);
            showToast('Deleted'); loadCrops();
          } catch (err: any) { showToast(err.message || 'Error'); }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.greenPrimary} />
      <OfflineBanner />

      {/* Green gradient header */}
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
          
          <Text style={styles.screenTitle}>Farmer Dashboard</Text>
          
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
              <Text style={styles.avatarTxt}>🌾</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.farmName}>{profile?.farm_name || user?.name || 'My Farm'}</Text>
              <Text style={styles.farmSub}>View Profile & Settings</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('CreateProfile', { isEdit: true })}>
            <Text style={styles.editBtnTxt}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[{ v: String(crops.length), l: 'Crops' }, { v: '₹12.4K', l: 'Earnings' }, { v: '8', l: 'Enquiries' }].map(s => (
            <View key={s.l} style={styles.statItem}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Market Rates */}
        <SectionHeader title="📊 Today's Market Rates" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratesRow}>
          {marketRates.map(r => {
            const name = i18n.language === 'ta' ? r.nameTa : (i18n.language === 'hi' ? r.nameHi : r.nameEn);
            const isUp = r.trend === 'up';
            const isDown = r.trend === 'down';
            const trendSymbol = isUp ? '▲' : isDown ? '▼' : '→';
            const trendColor = isUp ? Colors.greenPrimary : isDown ? Colors.redPrimary : Colors.textMuted;
            const trendSign = isUp ? '+' : isDown ? '-' : '';
            return (
              <View key={r.id} style={styles.rateCard}>
                <Text style={styles.rateName}>{name} {getCropEmoji(r.nameEn)}</Text>
                <Text style={styles.ratePrice}>₹{r.pricePerKg}/kg</Text>
                <Text style={[styles.rateTrend, { color: trendColor }]}>
                  {trendSymbol} {trendSign}{r.change}%
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.greenSoft }]} onPress={() => navigation.navigate('AddCrop')}>
            <Text style={{ fontSize: 28 }}>🌱</Text>
            <Text style={[styles.actionLabel, { color: Colors.greenPrimary }]}>Add Crop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.blueSoft }]} onPress={() => navigation.navigate('CreateProfile', { isEdit: true })}>
            <Text style={{ fontSize: 28 }}>✏️</Text>
            <Text style={[styles.actionLabel, { color: Colors.bluePrimary }]}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.purpleSoft }]} onPress={() => navigation.navigate('FarmerMarketplace')}>
            <Text style={{ fontSize: 28 }}>🛍️</Text>
            <Text style={[styles.actionLabel, { color: Colors.purplePrimary }]}>Marketplace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.amberSoft }]} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}>
            <Text style={{ fontSize: 28 }}>🏠</Text>
            <Text style={[styles.actionLabel, { color: Colors.amberPrimary }]}>Go Home</Text>
          </TouchableOpacity>
        </View>

        {/* Crops */}
        <SectionHeader
          title={`🌾 My Crop Listings (${crops.length})`}
          actionLabel="+ Add"
          onAction={() => navigation.navigate('AddCrop')}
        />
        {loading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color={Colors.greenPrimary} /></View>
        ) : error ? (
          <TouchableOpacity style={styles.errorCard} onPress={loadCrops}>
            <Text style={styles.errorTxt}>⚠️ Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        ) : crops.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40 }}>🌾</Text>
            <Text style={styles.emptyTxt}>No crops listed yet</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.greenPrimary }]} onPress={() => navigation.navigate('AddCrop')}>
              <Text style={styles.addBtnTxt}>+ Add First Crop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          crops.map(item => (
            <View key={item.id} style={styles.cropCard}>
              <View style={styles.cropIcon}><Text style={{ fontSize: 30 }}>{getCropEmoji(item.crop_name)}</Text></View>
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>{item.crop_name}</Text>
                <Text style={styles.cropPrice}>₹{parseFloat(item.price_per_kg).toFixed(0)}/kg</Text>
                <StatusChip label={`${item.quantity_available} kg available`} type="green" />
              </View>
              <View style={styles.cropActions}>
                <TouchableOpacity onPress={() => navigation.navigate('AddCrop', { cropId: item.id.toString() })}>
                  <Text style={{ fontSize: 20 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.crop_name)}>
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
    backgroundColor: Colors.greenPrimary,
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
  farmName: { fontSize: 16, fontWeight: '800', color: Colors.white },
  farmSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg, padding: Spacing.md, justifyContent: 'space-around', zIndex: 1 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: Colors.white },
  statLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { padding: Spacing.md, paddingTop: Spacing.lg },
  ratesRow: { gap: 10, paddingBottom: Spacing.md },
  rateCard: { width: 110, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  rateName: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textAlign: 'center', marginBottom: 4 },
  ratePrice: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  rateTrend: { fontSize: 16, fontWeight: '800', marginTop: 2 },
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
  cropCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  cropIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  cropInfo: { flex: 1, marginLeft: 12, gap: 4 },
  cropName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  cropPrice: { fontSize: 15, fontWeight: '800', color: Colors.greenPrimary },
  cropActions: { gap: 8 },
});
