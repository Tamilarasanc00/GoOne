import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../redux/hooks';
import BannerCarousel from '../components/BannerCarousel';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader, VoiceButton } from '../components/GoOneUI';
import { voiceService } from '../services/voiceService';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'shops', name: 'Shops', emoji: '🏪', color: Colors.bluePrimary, screen: 'RetailShopListing' },
  { id: 'farmers', name: 'Farmers', emoji: '🌾', color: Colors.greenPrimary, screen: 'FarmerMarketplace' },
  { id: 'services', name: 'Services', emoji: '🔧', color: Colors.purplePrimary, screen: 'ServiceWorkerListing' },
  { id: 'rentals', name: 'Rentals', emoji: '🚜', color: Colors.amberPrimary, screen: 'RentalMarketplace' },
  { id: 'jobs', name: 'Jobs', emoji: '👷', color: Colors.orangePrimary, screen: 'DailyWageJobListing' },
  { id: 'sos', name: 'SOS Help', emoji: '🆘', color: Colors.redPrimary, screen: 'NearbyHelp' },
  { id: 'offers', name: 'Offers', emoji: '🎁', color: Colors.magentaPrimary, screen: null },
  { id: 'market', name: 'Market', emoji: '📊', color: Colors.blueDeep, screen: null },
];

const GREETING_MAP: { [k: number]: string } = {
  5: 'Good Morning',
  12: 'Good Afternoon',
  17: 'Good Evening',
  21: 'Good Night',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAppSelector((state: any) => state.profile.user || state.app.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [shopsError, setShopsError] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const greeting = getGreeting();

  const fetchUnreadCount = async () => {
    try {
      const res = await apiService.notifications.getUnreadCount();
      if (res.success) setUnreadCount(res.count);
    } catch {}
  };

  const loadDashboard = async () => {
    setLoadingShops(true);
    setShopsError(false);
    try {
      const res = await apiService.shops.getNearby(
        user?.latitude ? parseFloat(user.latitude) : 11.6643,
        user?.longitude ? parseFloat(user.longitude) : 78.146
      );
      setShops(res?.shops || []);
    } catch {
      setShopsError(true);
    } finally {
      setLoadingShops(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      loadDashboard();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUnreadCount(), loadDashboard()]);
    setRefreshing(false);
  };

  const handleCategoryPress = (cat: typeof CATEGORIES[0]) => {
    if (cat.screen) {
      (navigation as any).navigate(cat.screen);
    } else {
      showToast(`${cat.name} coming soon!`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bluePrimary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* BG circles */}
          <View style={[styles.circle, { width: 220, height: 220, top: -60, right: -60 }]} />
          <View style={[styles.circle, { width: 130, height: 130, bottom: -20, left: 60 }]} />
          <View style={[styles.circle, { width: 80, height: 80, top: 30, left: -20 }]} />

          <View style={styles.headerTop}>
            {/* Location + greeting */}
            <View style={styles.headerLeft}>
              <View style={styles.locationPill}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>Salem, TN</Text>
              </View>
              <Text style={styles.greetingText}>
                {greeting}, {firstName} 👋
              </Text>
              <Text style={styles.taglineText}>What are you looking for today?</Text>
            </View>

            {/* Right actions */}
            <View style={styles.headerRight}>
              {/* Notification */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('NotificationsTab')}
              >
                <Text style={styles.iconBtnTxt}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => navigation.navigate('ProfileTab')}
              >
                <Text style={styles.avatarTxt}>{firstName[0]}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <Text style={styles.searchPlaceholder}>
                {searchQuery || 'Search shops, workers, services...'}
              </Text>
              <TouchableOpacity onPress={() => voiceService.startListening()} style={styles.voiceBtnWrap}>
                <Text style={{ fontSize: 18 }}>🎙️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Category Grid */}
          <SectionHeader title="Explore GoOne" actionLabel="See All" onAction={() => {}} />
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                onPress={() => handleCategoryPress(cat)}
                activeOpacity={0.8}
              >
                <View style={[styles.catIconWrap, { backgroundColor: cat.color + '15' }]}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Promo Banner */}
          <BannerCarousel />

          {/* Emergency CTA */}
          <TouchableOpacity
            style={styles.emergencyBanner}
            onPress={() => navigation.navigate('NearbyHelp')}
            activeOpacity={0.85}
          >
            <View style={styles.emergencyLeft}>
              <Text style={styles.emergencyEmoji}>🆘</Text>
              <View>
                <Text style={styles.emergencyTitle}>Need Urgent Help?</Text>
                <Text style={styles.emergencySub}>Alert neighbors instantly</Text>
              </View>
            </View>
            <View style={styles.emergencyBtn}>
              <Text style={styles.emergencyBtnTxt}>SOS →</Text>
            </View>
          </TouchableOpacity>

          {/* Nearby Shops */}
          <SectionHeader
            title="🏪 Nearby Shops"
            actionLabel="View All"
            onAction={() => navigation.navigate('RetailShopListing')}
          />

          {loadingShops ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skeletonRow}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.skeletonCard} />
              ))}
            </ScrollView>
          ) : shopsError ? (
            <TouchableOpacity style={styles.errorRow} onPress={loadDashboard}>
              <Text style={styles.errorTxt}>⚠️ Failed to load shops. Tap to retry.</Text>
            </TouchableOpacity>
          ) : shops.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTxt}>🏪 No shops found nearby yet.</Text>
              <Text style={styles.emptySubTxt}>Try searching or check back soon.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopRow}>
              {shops.map((shop: any, idx: number) => (
                <TouchableOpacity
                  key={shop.id || idx}
                  style={styles.shopCard}
                  onPress={() => navigation.navigate('ShopDetails', { shopId: shop.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.shopImagePlaceholder}>
                    <Text style={{ fontSize: 40 }}>🏪</Text>
                  </View>
                  <View style={styles.shopBody}>
                    <Text style={styles.shopName} numberOfLines={1}>{shop.name || 'Shop'}</Text>
                    <Text style={styles.shopMeta}>⭐ {shop.rating ?? '4.2'} · 📍 {shop.distance ? `${shop.distance.toFixed(1)} km` : 'Nearby'}</Text>
                    <View style={[styles.openBadge, { backgroundColor: shop.is_open ? Colors.greenSoft : Colors.redSoft }]}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: shop.is_open ? Colors.greenPrimary : Colors.redPrimary }}>
                        {shop.is_open ? '● Open' : '● Closed'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Quick Links Row */}
          <View style={styles.quickRow}>
            {[
              { label: '🌾 Farmers Market', screen: 'FarmerMarketplace' },
              { label: '🔧 Find Workers', screen: 'ServiceWorkerListing' },
              { label: '👷 Find Jobs', screen: 'DailyWageJobListing' },
            ].map(link => (
              <TouchableOpacity
                key={link.label}
                style={styles.quickLink}
                onPress={() => navigation.navigate(link.screen)}
              >
                <Text style={styles.quickLinkTxt}>{link.label}</Text>
                <Text style={styles.quickLinkArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },

  // Header
  header: {
    backgroundColor: Colors.bluePrimary,
    paddingBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    zIndex: 1,
  },
  headerLeft: { flex: 1 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  greetingText: { fontSize: 20, fontWeight: '800', color: Colors.white },
  taglineText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconBtnTxt: { fontSize: 18 },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.redPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  notifCount: { fontSize: 8, color: Colors.white, fontWeight: '800' },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 16, fontWeight: '800', color: Colors.bluePrimary },

  // Search
  searchWrap: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, zIndex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  searchIcon: { fontSize: 18 },
  searchPlaceholder: { flex: 1, fontSize: 13, color: Colors.textMuted },
  voiceBtnWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },

  // Body
  body: { padding: Spacing.md, paddingTop: Spacing.lg },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  catCard: {
    width: (width - Spacing.md * 2 - 30) / 4,
    alignItems: 'center',
  },
  catIconWrap: {
    width: 58, height: 58, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  catEmoji: { fontSize: 28 },
  catName: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },

  // Emergency
  emergencyBanner: {
    backgroundColor: Colors.redPrimary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    shadowColor: Colors.redPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergencyEmoji: { fontSize: 32 },
  emergencyTitle: { fontSize: 14, fontWeight: '800', color: Colors.white },
  emergencySub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  emergencyBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full,
  },
  emergencyBtnTxt: { fontSize: 12, fontWeight: '800', color: Colors.redPrimary },

  // Shops
  shopRow: { paddingRight: Spacing.md, paddingBottom: Spacing.md, gap: 12 },
  shopCard: {
    width: 150,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  shopImagePlaceholder: {
    height: 90,
    backgroundColor: Colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  shopBody: { padding: 10 },
  shopName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  shopMeta: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  openBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 6,
  },

  // Skeleton loaders
  skeletonRow: { paddingBottom: Spacing.md },
  skeletonCard: {
    width: 150, height: 180,
    backgroundColor: Colors.border,
    borderRadius: Radius.lg,
    marginRight: 12,
  },

  // Error
  errorRow: {
    padding: Spacing.md,
    backgroundColor: Colors.redSoft,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorTxt: { color: Colors.redPrimary, fontWeight: '600', fontSize: 13 },

  // Empty
  emptyCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTxt: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  emptySubTxt: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  // Quick links
  quickRow: { gap: 8, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  quickLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLinkTxt: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  quickLinkArrow: { fontSize: 16, color: Colors.textMuted },
});
