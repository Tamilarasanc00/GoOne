import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type RetailShopListingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RetailShopListing'>;

const CATEGORIES = ['All', 'Groceries', 'Hardware', 'Clothing', 'Electronics', 'Pharmacy'];

const MOCK_SHOPS = [
  {
    id: '1',
    name: 'Sri Murugan Stores',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    distance: '1.2 km',
    isOpen: true,
    category: 'Groceries',
    location: 'Sankarapuram',
  },
  {
    id: '2',
    name: 'Balaji Hardware',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.2,
    distance: '3.5 km',
    isOpen: true,
    category: 'Hardware',
    location: 'Sankarapuram Market',
  },
  {
    id: '3',
    name: 'Kannan Medicals',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    distance: '0.8 km',
    isOpen: false,
    category: 'Pharmacy',
  },
  {
    id: '4',
    name: 'Chennai Mobiles',
    image: 'https://images.unsplash.com/photo-1519326844852-704caea5679e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.0,
    distance: '3.1 km',
    isOpen: true,
    category: 'Electronics',
  },
];

export default function RetailShopListingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RetailShopListingNavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter logic
  const filteredShops = MOCK_SHOPS.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || shop.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const renderShopCard = ({ item }: { item: typeof MOCK_SHOPS[0] }) => (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => navigation.navigate('ShopDetails', { shopId: item.id, shopName: item.name })}
    >
      <Surface style={[styles.shopCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Image source={{ uri: item.image }} style={styles.shopImage} />
      <View style={styles.shopInfo}>
        <View style={styles.shopHeader}>
          <Text variant="titleMedium" style={styles.shopName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.statusText, { color: item.isOpen ? '#4CAF50' : '#F44336' }]}>
              {item.isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>

        <View style={styles.shopDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
            <Text variant="bodyMedium" style={styles.detailText}>{item.rating}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {item.distance}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.category}
          </Text>
        </View>
      </View>
    </Surface>
    </TouchableOpacity>
  );

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
              onPress={() => setActiveCategory(category)}
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

      {/* Shop List */}
      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        renderItem={renderShopCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-search-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No shops found
            </Text>
          </View>
        }
      />
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
});
