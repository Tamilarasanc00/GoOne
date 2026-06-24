import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  StatusBar,
} from 'react-native';
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

type RetailerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QUICK_ACTIONS = [
  { label: 'Add Product', emoji: '📦', screen: 'AddProduct', color: Colors.bluePrimary },
  { label: 'Add Offer', emoji: '🎁', screen: 'AddOffer', color: Colors.orangePrimary },
  { label: 'Edit Shop', emoji: '✏️', screen: 'CreateProfile', color: Colors.purplePrimary },
  { label: 'View Orders', emoji: '📋', screen: null, color: Colors.greenPrimary },
  { label: 'Settings & Profile', emoji: '👤', screen: 'Profile', color: Colors.blueDeep },
];

export default function RetailerDashboardScreen() {
  const navigation = useNavigation<RetailerDashboardNavigationProp>();
  const shopProfile = useAppSelector((state: any) => state.profile.profile);
  const user = useAppSelector((state: any) => state.profile.user);

  const [products, setProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const loadData = async () => {
    if (!shopProfile?.id) { setLoading(false); return; }
    setLoading(true); setError(false);
    try {
      const [productsRes, offersRes] = await Promise.all([
        apiService.products.list(shopProfile.id),
        apiService.shops.getOffers()
      ]);
      
      if (productsRes?.success) setProducts(productsRes.products || []);
      else setError(true);
      
      if (offersRes?.success) {
        // Filter offers for this shop
        const shopOffers = (offersRes.offers || []).filter((o: any) => o.shop_name === (shopProfile.name || 'My Shop'));
        setOffers(shopOffers);
      }
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [shopProfile]));

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiService.products.delete(id);
            if (res?.success) { showToast('Deleted'); loadData(); }
          } catch (err: any) { showToast(err.message || 'Error'); }
        }
      }
    ]);
  };

  const shopName = shopProfile?.name || user?.name || 'My Shop';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bluePrimary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.circle, { width: 200, height: 200, top: -60, right: -60 }]} />
        <View style={[styles.circle, { width: 120, height: 120, bottom: -20, left: 40 }]} />

        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatar}
            >
              <Text style={styles.avatarTxt}>🏪</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                if (shopProfile?.id) {
                  navigation.navigate('ShopDetails', { shopId: String(shopProfile.id), shopName: shopProfile.name });
                } else {
                  showToast('Shop profile not found');
                }
              }}
            >
              <Text style={styles.shopName}>{shopName} 👁️</Text>
              <Text style={styles.shopSub}>Retailer Dashboard • View Shop</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.openToggle}>
            <Text style={styles.openLabel}>{isOpen ? '● Open' : '● Closed'}</Text>
            <Switch
              value={isOpen}
              onValueChange={v => { setIsOpen(v); showToast(v ? 'Shop is Open' : 'Shop is Closed'); }}
              thumbColor={Colors.white}
              trackColor={{ false: Colors.border, true: Colors.greenPrimary }}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { v: String(products.length), l: 'Products' },
            { v: '₹4.5K', l: 'Earnings' },
            { v: '12', l: 'Orders' },
          ].map(s => (
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
          {QUICK_ACTIONS.map((a, idx) => (
            <TouchableOpacity
              key={a.label}
              style={[
                styles.actionCard,
                idx === QUICK_ACTIONS.length - 1 && QUICK_ACTIONS.length % 2 !== 0 && { width: '100%' }
              ]}
              onPress={() => {
                if (a.screen === 'ShopDetails') {
                  if (shopProfile?.id) {
                    navigation.navigate('ShopDetails', { shopId: String(shopProfile.id), shopName: shopProfile.name });
                  } else {
                    showToast('Shop profile not found');
                  }
                } else if (a.screen) {
                  navigation.navigate(a.screen as any, a.screen === 'CreateProfile' ? { isEdit: true } : undefined);
                } else {
                  showToast('Coming soon!');
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '15' }]}>
                <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Products */}
        <SectionHeader
          title="🛒 My Products"
          actionLabel={`+ Add`}
          onAction={() => navigation.navigate('AddProduct')}
        />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.bluePrimary} />
          </View>
        ) : error ? (
          <TouchableOpacity style={styles.errorCard} onPress={loadData}>
            <Text style={styles.errorTxt}>⚠️ Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        ) : (
          <>
            {products.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 40 }}>📦</Text>
                <Text style={styles.emptyTxt}>No products yet</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>
                  <Text style={styles.addBtnTxt}>+ Add Your First Product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              products.map(item => (
                <View key={item.id} style={styles.productCard}>
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/70' }}
                    style={styles.productImg}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productCat}>{item.category || 'General'}</Text>
                    <Text style={styles.productPrice}>₹{parseFloat(item.price).toFixed(0)}</Text>
                    <StatusChip label={`Stock: ${item.stock_quantity || 10}`} type="blue" />
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { productId: item.id.toString() })}>
                      <Text style={{ fontSize: 20 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                      <Text style={{ fontSize: 20 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Offers */}
            <SectionHeader
              title="🎁 My Offers"
              actionLabel={`+ Add`}
              onAction={() => navigation.navigate('AddOffer')}
            />
            {offers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 40 }}>🎁</Text>
                <Text style={styles.emptyTxt}>No active offers</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddOffer')} style={[styles.addBtn, {backgroundColor: Colors.orangePrimary}]}>
                  <Text style={styles.addBtnTxt}>+ Post an Offer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              offers.map(offer => (
                <View key={offer.id} style={styles.productCard}>
                  <Image
                    source={{ uri: offer.image_url || 'https://via.placeholder.com/70' }}
                    style={styles.productImg}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{offer.title}</Text>
                    <Text style={styles.productCat}>{offer.description}</Text>
                    <StatusChip label={offer.discount} type="orange" />
                  </View>
                  <View style={styles.productActions}>
                    {/* Offers delete functionality could be added here later */}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Recent Orders */}
        <SectionHeader title="📋 Recent Orders" />
        {[
          { id: '#1024', items: '2x Ponni Rice, 1x Sunflower Oil', amount: '₹3,200', time: '10 mins ago', status: 'Pending' },
          { id: '#1023', items: '1x Dal, 2x Sugar', amount: '₹980', time: '1 hr ago', status: 'Done' },
        ].map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order {order.id}</Text>
              <StatusChip label={order.status} type={order.status === 'Done' ? 'green' : 'orange'} />
            </View>
            <Text style={styles.orderItems}>{order.items}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderAmount}>{order.amount}</Text>
              <Text style={styles.orderTime}>{order.time}</Text>
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
    backgroundColor: Colors.bluePrimary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, zIndex: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 24 },
  shopName: { fontSize: 16, fontWeight: '800', color: Colors.white },
  shopSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  openToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 },
  openLabel: { fontSize: 11, fontWeight: '700', color: Colors.white },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'space-around',
    zIndex: 1,
  },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: Colors.white },
  statLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  scroll: { padding: Spacing.md, paddingTop: Spacing.lg },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },

  loader: { paddingVertical: 32, alignItems: 'center' },
  errorCard: { padding: Spacing.md, backgroundColor: Colors.redSoft, borderRadius: Radius.md, marginBottom: Spacing.md },
  errorTxt: { color: Colors.redPrimary, fontWeight: '600', fontSize: 13 },
  emptyCard: {
    padding: Spacing.xl, backgroundColor: Colors.white, borderRadius: Radius.lg,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  emptyTxt: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 8, marginBottom: 12 },
  addBtn: { backgroundColor: Colors.bluePrimary, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  productCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: 10, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  productImg: { width: 64, height: 64, borderRadius: Radius.md, backgroundColor: Colors.bgLight },
  productInfo: { flex: 1, marginLeft: 12, gap: 4 },
  productName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  productCat: { fontSize: 11, color: Colors.textMuted },
  productPrice: { fontSize: 15, fontWeight: '800', color: Colors.greenPrimary },
  productActions: { gap: 8 },

  orderCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  orderItems: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderAmount: { fontSize: 15, fontWeight: '800', color: Colors.greenPrimary },
  orderTime: { fontSize: 11, color: Colors.textMuted },
});
