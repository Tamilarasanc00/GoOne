import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import { StorageKeys, saveJSON, loadJSON } from '../services/storage';

type FarmerMarketplaceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FarmerMarketplace'>;

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Rice', 'Seeds', 'Milk'];

export default function FarmerMarketplaceScreen() {
  const theme = useTheme();
  const navigation = useNavigation<FarmerMarketplaceNavigationProp>();

  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchCrops = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiService.crops.list(
        activeCategory === 'All' ? undefined : activeCategory,
        searchQuery || undefined
      );
      if (res.success && res.crops) {
        setCrops(res.crops);
        saveJSON(StorageKeys.CACHED_LISTINGS + '_crops', res.crops);
        showToast(isRefresh ? 'Marketplace listings refreshed' : 'Marketplace listings loaded');
      }
    } catch (err: any) {
      const cached = loadJSON<any[]>(StorageKeys.CACHED_LISTINGS + '_crops');
      if (cached && cached.length > 0) {
        setCrops(cached);
        showToast('Offline: Loaded cached crops');
      } else {
        const errMsg = err.message || 'Failed to fetch crops';
        setError(errMsg);
        showToast(errMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, [activeCategory, searchQuery]);

  const handleCategoryPress = React.useCallback((category: string) => {
    setActiveCategory(category);
    showToast(`Filtering by ${category}`);
  }, []);

  const handleCall = React.useCallback((phone: string, farmerName: string) => {
    showToast(`Calling ${farmerName}...`);
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast('Could not open phone dialer');
    });
  }, []);

  const handleWhatsApp = React.useCallback((phone: string, farmerName: string) => {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${formattedPhone}`;
    const fallbackUrl = `https://wa.me/${formattedPhone}`;

    showToast(`Opening WhatsApp for ${farmerName}...`);
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(fallbackUrl);
        }
      })
      .catch(() => {
        showToast('Could not open WhatsApp');
      });
  }, []);

  const CropCard = React.memo(({ item }: { item: any }) => (
    <Surface style={[styles.cropCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Image source={{ uri: item.image }} style={styles.cropImage} />
      <View style={styles.cropInfo}>
        <View style={styles.cropHeader}>
          <Text variant="titleMedium" style={styles.cropName} numberOfLines={1}>
            {item.cropName}
          </Text>
          <Text variant="titleMedium" style={[styles.priceText, { color: theme.colors.primary }]}>
            {item.price}
          </Text>
        </View>

        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
          {item.quantity}
        </Text>

        <View style={styles.farmerDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-hard-hat" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.detailText}>{item.farmerName}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {item.location}
            </Text>
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.contactActions}>
          <Button 
            mode="outlined" 
            icon="phone" 
            onPress={() => handleCall(item.phone, item.farmerName)}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            textColor={theme.colors.primary}
          >
            Call
          </Button>
          <Button 
            mode="contained" 
            icon="whatsapp" 
            onPress={() => handleWhatsApp(item.phone, item.farmerName)}
            style={[styles.actionButton, { backgroundColor: '#25D366' }]}
            contentStyle={styles.actionButtonContent}
          >
            WhatsApp
          </Button>
        </View>
      </View>
    </Surface>
  ));

  const renderCropCard = React.useCallback(({ item }: { item: any }) => (
    <CropCard item={item} />
  ), []);

  const getItemLayout = React.useCallback((data: any, index: number) => (
    {length: 280, offset: 280 * index, index}
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
        <Text variant="titleLarge" style={styles.headerTitle}>Farmer Marketplace</Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search crops, farmers..."
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
            Loading marketplace listings...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => fetchCrops()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={crops}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCropCard}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchCrops(true)}
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="tractor-variant" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                No crops found
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
  cropCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cropImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0E0E0',
  },
  cropInfo: {
    padding: 16,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropName: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  priceText: {
    fontWeight: 'bold',
  },
  farmerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    height: 44,
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
