import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import { StorageKeys, saveJSON, loadJSON } from '../services/storage';
import { ScreenHeader, EmptyState } from '../components/GoOneUI';
import Colors from '../constants/colors';

type RentalMarketplaceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalMarketplace'>;

const CATEGORIES = ['All', 'Tractor', 'Bike', 'Mini Truck', 'JCB', 'Water Tanker', 'Farming Tools'];

export default function RentalMarketplaceScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RentalMarketplaceNavigationProp>();

  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchRentals = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiService.rentals.list(
        activeCategory === 'All' ? undefined : activeCategory,
        searchQuery || undefined
      );
      if (res.success && res.rentals) {
        setRentals(res.rentals);
        saveJSON(StorageKeys.CACHED_LISTINGS + '_rentals', res.rentals);
        showToast(isRefresh ? 'Rentals list refreshed' : 'Rentals list loaded');
      }
    } catch (err: any) {
      const cached = loadJSON<any[]>(StorageKeys.CACHED_LISTINGS + '_rentals');
      if (cached && cached.length > 0) {
        setRentals(cached);
        showToast('Offline: Loaded cached rentals');
      } else {
        const errMsg = err.message || 'Failed to fetch rentals';
        setError(errMsg);
        showToast(errMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [activeCategory, searchQuery]);

  const handleCategoryPress = React.useCallback((category: string) => {
    setActiveCategory(category);
    showToast(`Filtering by ${category}`);
  }, []);

  const handleContact = React.useCallback((phone: string, ownerName: string) => {
    showToast(`Calling ${ownerName}...`);
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast('Could not open phone dialer');
    });
  }, []);

  const RentalCard = React.memo(({ item }: { item: any }) => (
    <Surface style={[styles.rentalCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Image source={{ uri: item.image }} style={styles.rentalImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.rentalName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="titleMedium" style={[styles.priceText, { color: theme.colors.primary }]}>
            {item.pricePerDay}
          </Text>
        </View>

        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
          By {item.owner} • {item.category}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {item.location}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <MaterialCommunityIcons 
              name={item.isAvailable ? "check-circle-outline" : "clock-outline"} 
              size={16} 
              color={item.isAvailable ? "#4CAF50" : "#FF9800"} 
            />
            <Text variant="bodyMedium" style={[styles.detailText, { color: item.isAvailable ? "#4CAF50" : "#FF9800" }]}>
              {item.availability}
            </Text>
          </View>
        </View>

        <Button 
          mode="contained" 
          icon="phone" 
          onPress={() => handleContact(item.phone, item.owner)}
          style={styles.contactButton}
          contentStyle={styles.contactButtonContent}
        >
          Contact Owner
        </Button>
      </View>
    </Surface>
  ));

  const renderRentalCard = React.useCallback(({ item }: { item: any }) => (
    <RentalCard item={item} />
  ), [handleContact]);

  const getItemLayout = React.useCallback((data: any, index: number) => (
    {length: 260, offset: 260 * index, index}
  ), []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <ScreenHeader
        title={t('listings.rentals', 'Equipment Rentals')}
        onBack={() => navigation.goBack()}
      />

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder={t('listings.searchRentals', 'Search tractors, bikes, JCBs...')}
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

      {/* Loader / Error / List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
            Loading rentals...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => fetchRentals()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRentalCard}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchRentals(true)}
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <EmptyState 
              icon="🚜" 
              title={t('listings.noResults', 'No rentals found')} 
              subtitle={t('common.retry', 'Try searching something else')}
            />
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
  rentalCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  rentalImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0E0E0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rentalName: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  priceText: {
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: {
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
  contactButton: {
    borderRadius: 8,
  },
  contactButtonContent: {
    height: 44,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
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
});
