import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type FarmerMarketplaceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FarmerMarketplace'>;

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Rice', 'Seeds', 'Milk'];

const MOCK_CROPS = [
  {
    id: '1',
    farmerName: 'Ramu',
    cropName: 'Organic Tomatoes',
    price: '₹30/kg',
    quantity: '100 kg available',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    category: 'Vegetables',
    location: 'Madurai, TN',
    phone: '+919876543210',
  },
  {
    id: '2',
    farmerName: 'Kannan',
    cropName: 'Ponni Rice',
    price: '₹55/kg',
    quantity: '500 kg available',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    category: 'Rice',
    location: 'Thanjavur, TN',
    phone: '+919876543211',
  },
  {
    id: '3',
    farmerName: 'Lakshmi Farm',
    cropName: 'Fresh Milk',
    price: '₹45/liter',
    quantity: '50 liters available',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    category: 'Milk',
    location: 'Coimbatore, TN',
    phone: '+919876543212',
  },
  {
    id: '4',
    farmerName: 'Selvam',
    cropName: 'Mangoes (Alphonso)',
    price: '₹120/kg',
    quantity: '200 kg available',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
    category: 'Fruits',
    location: 'Salem, TN',
    phone: '+919876543213',
  },
];

export default function FarmerMarketplaceScreen() {
  const theme = useTheme();
  const navigation = useNavigation<FarmerMarketplaceNavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredCrops = MOCK_CROPS.filter(crop => {
    const matchesSearch = crop.cropName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          crop.farmerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || crop.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };

  const renderCropCard = ({ item }: { item: typeof MOCK_CROPS[0] }) => (
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
            onPress={() => handleCall(item.phone)}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            textColor={theme.colors.primary}
          >
            Call
          </Button>
          <Button 
            mode="contained" 
            icon="whatsapp" 
            onPress={() => handleWhatsApp(item.phone)}
            style={[styles.actionButton, { backgroundColor: '#25D366' }]}
            contentStyle={styles.actionButtonContent}
          >
            WhatsApp
          </Button>
        </View>
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

      {/* Crops List */}
      <FlatList
        data={filteredCrops}
        keyExtractor={(item) => item.id}
        renderItem={renderCropCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="tractor-variant" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No crops found
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
    gap: 12, // React Native 0.71+ supports gap
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    height: 44,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
});
