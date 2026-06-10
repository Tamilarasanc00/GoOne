import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, Surface, IconButton, Avatar, useTheme, Badge, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../redux/hooks';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BannerCarousel from '../components/BannerCarousel';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

const CATEGORIES = [
  { id: 'shops', name: 'Shops', icon: 'storefront-outline', color: '#4CAF50' },
  { id: 'farmers', name: 'Farmers', icon: 'tractor', color: '#8BC34A' },
  { id: 'services', name: 'Services', icon: 'wrench-outline', color: '#FF9800' },
  { id: 'rentals', name: 'Rentals', icon: 'key-outline', color: '#9C27B0' },
  { id: 'jobs', name: 'Jobs', icon: 'briefcase-outline', color: '#2196F3' },
  { id: 'nearby_help', name: 'Nearby Help', icon: 'hand-heart-outline', color: '#E91E63' },
  { id: 'offers', name: 'Offers', icon: 'brightness-percent', color: '#F44336' },
];

const PRIMARY_COLOR = '#0066FF';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Dynamic user and profile info
  const user = useAppSelector((state) => state.profile.user || state.app.user);

  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Dynamic Dashboard States
  const [refreshing, setRefreshing] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [shopsError, setShopsError] = useState(false);
  const [offersError, setOffersError] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await apiService.notifications.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.count);
      }
    } catch (err) {
      console.warn('Failed to fetch unread notifications count:', err);
    }
  };

  const loadDashboardData = async () => {
    setLoadingShops(true);
    setLoadingOffers(true);
    setShopsError(false);
    setOffersError(false);

    // 1. Fetch nearby shops (Salem TN fallback default coordinates)
    try {
      const res = await apiService.shops.getNearby(
        user?.latitude ? parseFloat(user.latitude) : 11.6643,
        user?.longitude ? parseFloat(user.longitude) : 78.1460
      );
      if (res && res.success) {
        setShops(res.shops || []);
      } else {
        setShopsError(true);
      }
    } catch (err) {
      console.warn('Failed to fetch nearby shops:', err);
      setShopsError(true);
    } finally {
      setLoadingShops(false);
    }

    // 2. Fetch exclusive offers
    try {
      const res = await apiService.shops.getOffers();
      if (res && res.success) {
        setOffers(res.offers || []);
      } else {
        setOffersError(true);
      }
    } catch (err) {
      console.warn('Failed to fetch offers:', err);
      setOffersError(true);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUnreadCount();
    await loadDashboardData();
    setRefreshing(false);
    showToast('Dashboard refreshed');
  };

  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === 'shops') {
      navigation.navigate('RetailShopListing');
    } else if (categoryId === 'farmers') {
      navigation.navigate('FarmerMarketplace');
    } else if (categoryId === 'services') {
      navigation.navigate('ServiceWorkerListing');
    } else if (categoryId === 'rentals') {
      navigation.navigate('RentalMarketplace');
    } else if (categoryId === 'jobs') {
      navigation.navigate('DailyWageJobListing');
    } else if (categoryId === 'nearby_help') {
      navigation.navigate('NearbyHelp');
    } else if (categoryId === 'offers') {
      showToast('Exclusive Deals & Offers list active below!');
    }
  };

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const translationKey = item.id === 'nearby_help' ? 'dashboard.nearbyHelp' : `dashboard.${item.id}`;
    return (
      <TouchableOpacity 
        style={styles.categoryItem} 
        activeOpacity={0.7}
        onPress={() => handleCategoryPress(item.id)}
      >
        <Surface style={[styles.categoryIconContainer, { backgroundColor: item.color + '18' }]} elevation={0}>
          <MaterialCommunityIcons name={item.icon} size={30} color={item.color} />
        </Surface>
        <Text variant="labelMedium" style={styles.categoryLabel} numberOfLines={2}>
          {t(translationKey, item.name)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Loading Skeletons
  const renderShopSkeleton = () => (
    <View style={styles.skeletonShopCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonTextLine} />
      <View style={[styles.skeletonTextLine, { width: '60%', marginTop: 8 }]} />
    </View>
  );

  const renderOfferSkeleton = () => (
    <View style={styles.skeletonOfferCard}>
      <View style={styles.skeletonOfferImg} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.skeletonTextLine} />
        <View style={[styles.skeletonTextLine, { width: '85%', marginTop: 8 }]} />
        <View style={[styles.skeletonTextLine, { width: '40%', marginTop: 8 }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
        }
      >
        
        {/* Top Section */}
        <View style={styles.topSection}>
          <View style={styles.userInfo}>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={18} color={PRIMARY_COLOR} />
              <Text variant="labelLarge" style={styles.locationText}>
                {user?.village_town || 'Sankarapuram'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.onSurface} />
            </View>
            <Text variant="titleLarge" style={styles.userName}>
              Hello, {user?.name || 'Guest'} 👋
            </Text>
          </View>
          <View style={styles.headerActions}>
            <View>
              <IconButton
                icon="bell-outline"
                iconColor={theme.colors.onSurface}
                size={24}
                onPress={() => navigation.navigate('NotificationsTab')}
                style={styles.bellIcon}
              />
              {unreadCount > 0 && (
                <Badge style={styles.badge} size={16}>
                  {unreadCount}
                </Badge>
              )}
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder={t('common.search', 'Search for products, services...')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={theme.colors.onSurfaceVariant}
            right={(props) => (
              <IconButton 
                icon="microphone" 
                size={24} 
                iconColor={PRIMARY_COLOR} 
                onPress={() => showToast('Voice search activated')} 
                style={styles.voiceSearchIcon}
              />
            )}
          />
        </View>

        {/* Promo Advertisements Banner Carousel */}
        <BannerCarousel />

        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('dashboard.exploreCategories', 'Explore Categories')}
          </Text>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={renderCategory}
            numColumns={4}
            columnWrapperStyle={styles.categoryRow}
            scrollEnabled={false}
          />
        </View>

        {/* Nearby Shop Listings */}
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Nearby Shops & Listings
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RetailShopListing')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingShops ? (
            <View style={styles.horizontalLoader}>
              {renderShopSkeleton()}
              {renderShopSkeleton()}
            </View>
          ) : shopsError ? (
            <Surface style={styles.errorContainer} elevation={0}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#D32F2F" />
              <Text style={styles.errorText}>Failed to load nearby shops.</Text>
              <Button mode="text" onPress={loadDashboardData} compact>Retry</Button>
            </Surface>
          ) : shops.length === 0 ? (
            <Surface style={styles.emptyContainer} elevation={0}>
              <MaterialCommunityIcons name="store-remove-outline" size={32} color="#757575" />
              <Text style={styles.emptyText}>No shops available nearby.</Text>
            </Surface>
          ) : (
            <FlatList
              data={shops}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ShopDetails', { shopId: item.id.toString(), shopName: item.name })}
                >
                  <Surface style={styles.shopCard} elevation={2}>
                    <Avatar.Image 
                      size={60} 
                      source={{ uri: item.owner_avatar || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80' }} 
                      style={styles.shopImg}
                    />
                    <Text variant="titleSmall" style={styles.shopCardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.shopCardDesc} numberOfLines={1}>
                      {item.description || 'Retail Shop'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                      <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                    </View>
                  </Surface>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Offers & Deals */}
        <View style={styles.offersSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Exclusive Deals & Offers
            </Text>
          </View>

          {loadingOffers ? (
            <View style={styles.verticalLoader}>
              {renderOfferSkeleton()}
              {renderOfferSkeleton()}
            </View>
          ) : offersError ? (
            <Surface style={styles.errorContainer} elevation={0}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#D32F2F" />
              <Text style={styles.errorText}>Failed to load offers.</Text>
              <Button mode="text" onPress={loadDashboardData} compact>Retry</Button>
            </Surface>
          ) : offers.length === 0 ? (
            <Surface style={styles.emptyContainer} elevation={0}>
              <MaterialCommunityIcons name="brightness-percent" size={32} color="#757575" />
              <Text style={styles.emptyText}>No special deals available today.</Text>
            </Surface>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {offers.map((offer) => (
                <Surface key={offer.id} style={styles.offerCard} elevation={2}>
                  <Avatar.Image 
                    size={70} 
                    source={{ uri: offer.image_url }} 
                    style={styles.offerImg}
                  />
                  <View style={styles.offerTextContainer}>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{offer.discount}</Text>
                    </View>
                    <Text variant="titleMedium" style={styles.offerTitle} numberOfLines={1}>
                      {offer.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.offerShopName}>
                      {offer.shop_name}
                    </Text>
                    <Text variant="bodySmall" style={styles.offerDesc} numberOfLines={2}>
                      {offer.description}
                    </Text>
                  </View>
                </Surface>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    marginHorizontal: 4,
    fontWeight: '700',
  },
  userName: {
    fontWeight: 'bold',
  },
  headerActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    margin: 0,
    backgroundColor: '#F0F0F0',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchBar: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#FFF',
  },
  searchInput: {
    fontSize: 14,
  },
  voiceSearchIcon: {
    marginRight: 4,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  categoryRow: {
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
    color: '#333',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  
  // Listings Section
  listingsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  viewAllText: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  shopCard: {
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopImg: {
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },
  shopCardTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
  },
  shopCardDesc: {
    color: '#757575',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF8F00',
    marginLeft: 4,
  },

  // Offers Section
  offersSection: {
    marginBottom: 12,
  },
  offerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  offerImg: {
    backgroundColor: '#F0F0F0',
  },
  offerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  discountBadge: {
    backgroundColor: '#FFEBEE',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  discountText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 10,
  },
  offerTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  offerShopName: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 1,
  },
  offerDesc: {
    color: '#757575',
    fontSize: 11,
    marginTop: 2,
  },

  // Empty & Error views
  emptyContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#757575',
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    flex: 1,
    marginLeft: 10,
    fontWeight: '500',
  },

  // Skeletons
  horizontalLoader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  verticalLoader: {
    paddingHorizontal: 16,
  },
  skeletonShopCard: {
    width: 140,
    height: 146,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    marginRight: 12,
    padding: 16,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D6D6D6',
    marginBottom: 10,
  },
  skeletonTextLine: {
    width: '85%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D6D6D6',
  },
  skeletonOfferCard: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  skeletonOfferImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D6D6D6',
  },
});
