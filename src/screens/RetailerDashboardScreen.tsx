import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator, Image } from 'react-native';
import { Text, Surface, useTheme, Avatar, IconButton, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../redux/hooks';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type RetailerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const PRIMARY_COLOR = '#0066FF';

export default function RetailerDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RetailerDashboardNavigationProp>();

  // Fetch shop details from Redux
  const shopProfile = useAppSelector((state) => state.profile.profile);
  const user = useAppSelector((state) => state.profile.user);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProducts = async () => {
    if (!shopProfile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const res = await apiService.products.list(shopProfile.id);
      if (res && res.success) {
        setProducts(res.products || []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to load shop products:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Reload products list when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [shopProfile])
  );

  const handleDeleteProduct = (productId: number, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            showToast('Deleting product...');
            try {
              const res = await apiService.products.delete(productId);
              if (res && res.success) {
                showToast('Product deleted successfully');
                loadProducts(); // reload
              } else {
                showToast('Failed to delete product');
              }
            } catch (err: any) {
              showToast(err.message || 'Error deleting product');
            }
          }
        }
      ]
    );
  };

  const renderStatCard = (title: string, value: string, icon: string, color: string) => (
    <Surface style={styles.statCard} elevation={1}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text variant="headlineSmall" style={styles.statValue}>{value}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{title}</Text>
    </Surface>
  );

  const renderActionCard = (title: string, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.actionCardWrapper}>
      <Surface style={styles.actionCard} elevation={2}>
        <MaterialCommunityIcons name={icon} size={32} color={color} style={{ marginBottom: 8 }} />
        <Text variant="titleMedium" style={{ fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <Avatar.Image 
            size={48} 
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80' }} 
          />
          <View style={styles.headerTextContainer}>
            <Text variant="titleMedium" style={styles.shopName}>
              {shopProfile?.name || 'Sri Murugan Stores'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Retailer Dashboard</Text>
          </View>
        </View>
        <IconButton
          icon="logout"
          iconColor="#D32F2F"
          size={24}
          onPress={() => {
            Alert.alert('Logout', 'Log out of dashboard?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                  showToast('Logged out');
                }
              }
            ]);
          }}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Statistics Grid */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Overview</Text>
          <Text variant="bodyMedium" style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>Live Stats</Text>
        </View>
        
        <View style={styles.statsGrid}>
          {renderStatCard('Total Products', String(products.length), 'package-variant-closed', '#2196F3')}
          {renderStatCard("Today's Views", '45', 'eye-outline', '#9C27B0')}
          {renderStatCard('Orders', '12', 'shopping-outline', '#4CAF50')}
          {renderStatCard('Earnings', '₹4,500', 'currency-inr', '#FF9800')}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {renderActionCard('Add Product', 'plus-box-outline', '#2196F3', () => navigation.navigate('AddProduct'))}
          {renderActionCard('Add Offer', 'brightness-percent', '#FF9800', () => navigation.navigate('AddOffer'))}
          {renderActionCard('Edit Shop', 'store-edit-outline', '#9C27B0', () => {
            navigation.navigate('CreateProfile', { isEdit: true });
          })}
          {renderActionCard('View Orders', 'clipboard-list-outline', '#4CAF50', () => {
            showToast('Loading orders logs...');
          })}
        </View>

        {/* Product listings */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>My Shop Listings</Text>
          <Text variant="bodyMedium" style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>{products.length} Items</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={{ marginTop: 8 }}>Loading shop listings...</Text>
          </View>
        ) : error ? (
          <Surface style={styles.errorContainer} elevation={0}>
            <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>Failed to retrieve product listings.</Text>
            <Button mode="text" onPress={loadProducts}>Retry</Button>
          </Surface>
        ) : products.length === 0 ? (
          <Surface style={styles.emptyContainer} elevation={0}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>No products added to your shop yet.</Text>
            <Button mode="contained" onPress={() => navigation.navigate('AddProduct')} style={{ marginTop: 12 }}>
              Add Your First Product
            </Button>
          </Surface>
        ) : (
          <View>
            {products.map((item) => (
              <Surface key={item.id} style={styles.productItemCard} elevation={1}>
                <Image 
                  source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' }} 
                  style={styles.productImg} 
                />
                <View style={styles.productDetailsContainer}>
                  <Text variant="titleMedium" style={styles.productName}>{item.name}</Text>
                  <Text variant="bodySmall" style={styles.productCategory}>{item.category || 'General'}</Text>
                  <Text variant="titleMedium" style={styles.productPrice}>₹{parseFloat(item.price).toFixed(0)}</Text>
                  <Text variant="bodySmall" style={styles.productQty}>Stock level: {item.stock_quantity || 10}</Text>
                </View>
                <View style={styles.productActionsRow}>
                  <IconButton 
                    icon="pencil-outline" 
                    iconColor={PRIMARY_COLOR} 
                    size={22} 
                    onPress={() => navigation.navigate('AddProduct', { productId: item.id.toString() })} 
                  />
                  <IconButton 
                    icon="trash-can-outline" 
                    iconColor="#D32F2F" 
                    size={22} 
                    onPress={() => handleDeleteProduct(item.id, item.name)} 
                  />
                </View>
              </Surface>
            ))}
          </View>
        )}

        {/* Recent Orders Preview */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent Orders</Text>
        </View>

        <Surface style={styles.recentOrderCard} elevation={1}>
          <View style={styles.orderHeader}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Order #1024</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            2x Ponni Rice (25kg), 1x Sunflower Oil (5L)
          </Text>
          <View style={styles.orderFooter}>
            <Text variant="titleMedium" style={{ color: '#4CAF50', fontWeight: 'bold' }}>₹3,200</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>10 mins ago</Text>
          </View>
        </Surface>

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  shopName: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  recentOrderCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  
  // Product item card styles
  productItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImg: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  productDetailsContainer: {
    flex: 1,
    marginLeft: 14,
  },
  productName: {
    fontWeight: 'bold',
  },
  productCategory: {
    color: '#757575',
    fontSize: 12,
  },
  productPrice: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  productQty: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  productActionsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#F5F5F5',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#757575',
    marginTop: 8,
    fontWeight: '500',
  },
});
