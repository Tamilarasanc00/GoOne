import React from 'react';
import { View, StyleSheet, ScrollView, Image, FlatList } from 'react-native';
import { Text, Surface, IconButton, Button, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type ShopDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShopDetails'>;
type ShopDetailsRouteProp = RouteProp<RootStackParamList, 'ShopDetails'>;

const MOCK_PRODUCTS = [
  { id: '1', name: 'Fresh Tomatoes', price: '₹40/kg', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' },
  { id: '2', name: 'Onions', price: '₹60/kg', image: 'https://images.unsplash.com/photo-1587049352847-81a56d773c1c?auto=format&fit=crop&w=400&q=80' },
  { id: '3', name: 'Potatoes', price: '₹35/kg', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80' },
  { id: '4', name: 'Carrots', price: '₹80/kg', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80' },
  { id: '5', name: 'Green Chilies', price: '₹120/kg', image: 'https://images.unsplash.com/photo-1588880629631-0162547b7c2f?auto=format&fit=crop&w=400&q=80' },
  { id: '6', name: 'Garlic', price: '₹200/kg', image: 'https://images.unsplash.com/photo-1540148426945-de5d2036720d?auto=format&fit=crop&w=400&q=80' },
];

export default function ShopDetailsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ShopDetailsNavigationProp>();
  const route = useRoute<ShopDetailsRouteProp>();

  // Use the passed ID or mock data for preview
  const shopId = route.params?.shopId || '1';
  const shopName = route.params?.shopName || 'Sri Murugan Stores';

  const renderProduct = ({ item }: { item: typeof MOCK_PRODUCTS[0] }) => (
    <Surface style={[styles.productCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text variant="titleSmall" style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{item.price}</Text>
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Absolute Back Button floating over banner */}
      <View style={styles.absoluteHeader}>
        <IconButton
          icon="arrow-left"
          iconColor="#FFFFFF"
          containerColor="rgba(0,0,0,0.4)"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <IconButton
          icon="heart-outline"
          iconColor="#FFFFFF"
          containerColor="rgba(0,0,0,0.4)"
          size={24}
          onPress={() => {}}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} 
          style={styles.bannerImage} 
        />

        {/* Shop Info Container */}
        <View style={styles.infoContainer}>
          <Text variant="headlineSmall" style={styles.shopName}>{shopName}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>4.5</Text>
              <MaterialCommunityIcons name="star" size={14} color="#FFF" />
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>(128 Reviews)</Text>
            <View style={styles.dotDivider} />
            <Text style={{ color: theme.colors.onSurfaceVariant }}>1.2 km away</Text>
          </View>
          
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Fresh groceries, vegetables, and daily essentials available at wholesale prices.
          </Text>

          <View style={styles.workingHoursContainer}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.workingHoursText}>
              <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>Open Now</Text> • 08:00 AM - 09:30 PM
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <Button 
              icon="phone" 
              mode="contained" 
              onPress={() => {}} 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={styles.actionButtonLabel}
            >
              Call
            </Button>
            <Button 
              icon="whatsapp" 
              mode="contained" 
              onPress={() => {}} 
              style={[styles.actionButton, { backgroundColor: '#25D366' }]}
              labelStyle={styles.actionButtonLabel}
            >
              WhatsApp
            </Button>
            <IconButton
              icon="share-variant"
              mode="outlined"
              size={24}
              iconColor={theme.colors.primary}
              style={styles.shareIcon}
              onPress={() => {}}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Product Grid */}
        <View style={styles.productsContainer}>
          <Text variant="titleLarge" style={styles.productsHeader}>Our Products</Text>
          <FlatList
            data={MOCK_PRODUCTS}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productList}
          />
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
  absoluteHeader: {
    position: 'absolute',
    top: 0, // Handled by SafeAreaView edges
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12, // Offset for safe area usually
  },
  bannerImage: {
    width: '100%',
    height: 250,
  },
  infoContainer: {
    padding: 16,
  },
  shopName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 12,
  },
  dotDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BDBDBD',
    marginHorizontal: 8,
  },
  workingHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5', // Light background for contrast
    borderRadius: 8,
  },
  workingHoursText: {
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 8,
  },
  actionButtonLabel: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  shareIcon: {
    margin: 0,
    borderRadius: 8,
    width: 48,
    height: 48,
  },
  divider: {
    height: 6,
    backgroundColor: '#F0F0F0', // Thick separator between sections
  },
  productsContainer: {
    padding: 16,
  },
  productsHeader: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productList: {
    paddingBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E0E0E0',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontWeight: '500',
    marginBottom: 4,
  },
});
