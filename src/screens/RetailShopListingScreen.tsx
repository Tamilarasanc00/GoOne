import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { showToast } from '../utils/toast';
import { StorageKeys, saveJSON, loadJSON } from '../services/storage';
import { voiceService } from '../services/voiceService';

type RetailShopListingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RetailShopListing'>;

const CATEGORIES = ['All', 'Groceries', 'Hardware', 'Clothing', 'Electronics', 'Pharmacy'];

export default function RetailShopListingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RetailShopListingNavigationProp>();

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchShops = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiService.shops.getNearby(11.9686, 78.9669);
      if (res.success && res.shops) {
        setShops(res.shops);
        saveJSON(StorageKeys.CACHED_LISTINGS + '_shops', res.shops);
        showToast(isRefresh ? 'Shops list refreshed' : 'Shops list loaded');
      }
    } catch (err: any) {
      const cached = loadJSON<any[]>(StorageKeys.CACHED_LISTINGS + '_shops');
      if (cached && cached.length > 0) {
        setShops(cached);
        showToast('Offline: Loaded cached shops');
      } else {
        const errMsg = err.message || 'Failed to fetch shops';
        setError(errMsg);
        showToast(errMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleCategoryPress = React.useCallback((category: string) => {
    setActiveCategory(category);
    showToast(`Filtering by ${category}`);
  }, []);

  // Filter logic
  const filteredShops = React.useMemo(() => {
    return shops.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || 
                              (shop.category && shop.category.toLowerCase() === activeCategory.toLowerCase()) || 
                              (shop.description && shop.description.toLowerCase().includes(activeCategory.toLowerCase()));
      return matchesSearch && matchesCategory;
    });
  }, [shops, searchQuery, activeCategory]);

  const ShopCard = React.memo(({ item, onPress }: { item: any, onPress: () => void }) => {
    const isOpen = item.status === true || item.status === 'true';
    const imageUri = item.image_url || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80';

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Surface style={[styles.shopCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Image source={{ uri: imageUri }} style={styles.shopImage} />
          <View style={styles.shopInfo}>
            <View style={styles.shopHeader}>
              <Text variant="titleMedium" style={styles.shopName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#E8F5E9' : '#FFEBEE' }]}>
                <Text style={[styles.statusText, { color: isOpen ? '#4CAF50' : '#F44336' }]}>
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </Text>
              </View>
            </View>

            <View style={styles.shopDetails}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                <Text variant="bodyMedium" style={styles.detailText}>{item.rating || 4.5}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                  {item.distance || '1.2 km'}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.description || 'Retail Shop'}
              </Text>
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  });

  const renderShopCard = React.useCallback(({ item }: { item: any }) => {
    return (
      <ShopCard 
        item={item} 
        onPress={() => navigation.navigate('ShopDetails', { shopId: String(item.id), shopName: item.name })}
      />
    );
  }, [navigation, theme]);

  const getItemLayout = React.useCallback((data: any, index: number) => (
    {length: 250, offset: 250 * index, index}
  ), []);

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
        <Text variant="titleLarge" style={styles.headerTitle}>Nearby Shops</Text>
        <View style={{ flex: 1 }} />
        <IconButton
          icon="microphone"
          size={24}
          onPress={() => voiceService.startListening()}
          iconColor={theme.colors.primary}
        />
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search shops..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={1}
        />
      </View>

      {/* Category Filter */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={activeCategory === category}
              onPress={() => handleCategoryPress(category)}
              style={[
                styles.categoryChip,
                activeCategory === category ? { backgroundColor: theme.colors.primary } : undefined
              ]}
              textStyle={activeCategory === category ? { color: theme.colors.onPrimary } : undefined}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Loader / Error Banner / Shop List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
            Loading nearby shops...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => fetchShops()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderShopCard}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchShops(true)}
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="store-search-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                No shops found
              </Text>
            </View>
          }
        />
      )}
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
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    borderRadius: 12,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  shopCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  shopImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E0E0E0',
  },
  shopInfo: {
    padding: 16,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  shopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  detailDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BDBDBD',
    marginHorizontal: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
});
