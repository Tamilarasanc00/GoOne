import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, FlatList, Linking } from 'react-native';
import { Text, Surface, IconButton, Button, useTheme, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import ReviewSection from '../components/ReviewSection';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type ShopDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShopDetails'>;
type ShopDetailsRouteProp = RouteProp<RootStackParamList, 'ShopDetails'>;

export default function ShopDetailsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ShopDetailsNavigationProp>();
  const route = useRoute<ShopDetailsRouteProp>();

  const shopId = route.params?.shopId || '1';
  const initialShopName = route.params?.shopName || 'Shop Details';

  const [shop, setShop] = useState<any>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avgRating, setAvgRating] = useState<number>(4.5);
  const [reviewsCount, setReviewsCount] = useState<number>(12);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.shops.getDetails(parseInt(shopId, 10));
      if (res.success && res.shop) {
        setShop(res.shop);
        setProductsList(res.products || []);
        showToast('Shop details loaded');
      } else {
        setError('Shop details not found');
        showToast('Shop details not found');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to load shop details';
      setError(errMsg);
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [shopId]);

  const handleCall = () => {
    const phone = shop?.owner_phone || '+919876543210';
    showToast(`Calling ${shop?.name || 'shop'}...`);
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast('Could not open phone dialer');
    });
  };

  const handleWhatsApp = () => {
    const phone = shop?.owner_phone || '+919876543210';
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${formattedPhone}`;
    const fallbackUrl = `https://wa.me/${formattedPhone}`;
    
    showToast(`Opening WhatsApp for ${shop?.name || 'shop'}...`);
    
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
  };

  const renderProduct = ({ item }: { item: any }) => {
    const priceText = `₹${parseFloat(item.price).toLocaleString('en-IN')}${item.category === 'Vegetables' || item.category === 'Fruits' ? '/kg' : ''}`;
    const imageUri = item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80';

    return (
      <Surface style={[styles.productCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Image source={{ uri: imageUri }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text variant="titleSmall" style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{priceText}</Text>
        </View>
      </Surface>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
            Loading shop details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shop) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
            {error || 'Shop details could not be loaded'}
          </Text>
          <Button mode="contained" onPress={fetchDetails} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const shopName = shop.name || initialShopName;
  const description = shop.description || 'Grocery & Retail Shop';
  const bannerImageUri = shop.owner_avatar || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80';

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
          source={{ uri: bannerImageUri }} 
          style={styles.bannerImage} 
        />

        {/* Shop Info Container */}
        <View style={styles.infoContainer}>
          <Text variant="headlineSmall" style={styles.shopName}>{shopName}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{avgRating}</Text>
              <MaterialCommunityIcons name="star" size={14} color="#FFF" />
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>({reviewsCount} Reviews)</Text>
            <View style={styles.dotDivider} />
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{shop.distance || '1.2 km'} away</Text>
          </View>
          
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {description}
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
              onPress={handleCall} 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={styles.actionButtonLabel}
            >
              Call
            </Button>
            <Button 
              icon="whatsapp" 
              mode="contained" 
              onPress={handleWhatsApp} 
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
            data={productsList}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderProduct}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginVertical: 24 }}>
                No products listed yet.
              </Text>
            }
          />
        </View>

        <Divider style={styles.divider} />

        {/* Reviews Section */}
        <ReviewSection 
          targetType="Shop" 
          targetId={parseInt(shopId, 10) || 1} 
          onRatingFetched={(avg, count) => {
            setAvgRating(avg);
            setReviewsCount(count);
          }}
        />
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
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
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
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#F0F0F0',
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

