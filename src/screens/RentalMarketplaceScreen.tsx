import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type RentalMarketplaceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RentalMarketplace'>;

const CATEGORIES = ['All', 'Tractor', 'Bike', 'Mini Truck', 'JCB', 'Water Tanker', 'Farming Tools'];

const MOCK_RENTALS = [
  {
    id: '1',
    name: 'Mahindra 575 DI Tractor',
    owner: 'Velu',
    category: 'Tractor',
    pricePerDay: '₹1,500/day',
    availability: 'Available Now',
    image: 'https://images.unsplash.com/photo-1592837330722-1f7a0709a80e?auto=format&fit=crop&w=400&q=80',
    location: 'Sankarapuram',
    phone: '+919876543210',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Honda Activa 6G',
    owner: 'Siva Rentals',
    category: 'Bike',
    pricePerDay: '₹300/day',
    availability: 'Available from Tomorrow',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
    location: 'Sankarapuram Town',
    phone: '+919876543211',
    isAvailable: false,
  },
  {
    id: '3',
    name: 'Tata Ace (Chota Hathi)',
    owner: 'Murugan Transports',
    category: 'Mini Truck',
    pricePerDay: '₹1,200/day',
    availability: 'Available Now',
    image: 'https://images.unsplash.com/photo-1601058269785-5eb76db17bf7?auto=format&fit=crop&w=400&q=80',
    location: 'Coimbatore, TN',
    phone: '+919876543212',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'JCB 3DX Backhoe Loader',
    owner: 'RR Earthmovers',
    category: 'JCB',
    pricePerDay: '₹5,000/day',
    availability: 'Available Now',
    image: 'https://images.unsplash.com/photo-1579738012678-067f92b7754b?auto=format&fit=crop&w=400&q=80',
    location: 'Salem, TN',
    phone: '+919876543213',
    isAvailable: true,
  },
];

export default function RentalMarketplaceScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RentalMarketplaceNavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredRentals = MOCK_RENTALS.filter(rental => {
    const matchesSearch = rental.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rental.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || rental.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderRentalCard = ({ item }: { item: typeof MOCK_RENTALS[0] }) => (
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
          onPress={() => handleContact(item.phone)}
          style={styles.contactButton}
          contentStyle={styles.contactButtonContent}
        >
          Contact Owner
        </Button>
      </View>
    </Surface>
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
        <Text variant="titleLarge" style={styles.headerTitle}>Equipment Rentals</Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search tractors, bikes, JCBs..."
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

      {/* Rental List */}
      <FlatList
        data={filteredRentals}
        keyExtractor={(item) => item.id}
        renderItem={renderRentalCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="tractor-variant" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No rentals found
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
});
