import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Surface, IconButton, Avatar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../redux/hooks';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES = [
  { id: 'shops', name: 'Shops', icon: 'storefront-outline', color: '#4CAF50' },
  { id: 'farmers', name: 'Farmers', icon: 'tractor', color: '#8BC34A' },
  { id: 'services', name: 'Services', icon: 'wrench-outline', color: '#FF9800' },
  { id: 'rentals', name: 'Rentals', icon: 'key-outline', color: '#9C27B0' },
  { id: 'jobs', name: 'Jobs', icon: 'briefcase-outline', color: '#2196F3' },
  { id: 'nearby_help', name: 'Nearby Help', icon: 'hand-heart-outline', color: '#E91E63' },
  { id: 'offers', name: 'Offers', icon: 'brightness-percent', color: '#F44336' },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAppSelector((state) => state.app);

  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');

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
    }
  };

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity 
      style={styles.categoryItem} 
      activeOpacity={0.7}
      onPress={() => handleCategoryPress(item.id)}
    >
      <Surface style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]} elevation={0}>
        <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
      </Surface>
      <Text variant="labelMedium" style={styles.categoryLabel} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Section */}
        <View style={styles.topSection}>
          <View style={styles.userInfo}>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.primary} />
              <Text variant="labelLarge" style={styles.locationText}>
                Sankarapuram
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.onSurface} />
            </View>
            <Text variant="titleLarge" style={styles.userName}>
              Hello, {user?.name || 'Guest'} 👋
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon="bell-outline"
              iconColor={theme.colors.onSurface}
              size={24}
              onPress={() => {}}
              style={styles.bellIcon}
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search for products, services..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={theme.colors.onSurfaceVariant}
            right={(props) => (
              <IconButton 
                icon="microphone" 
                size={24} 
                iconColor={theme.colors.primary} 
                onPress={() => {}} 
                style={styles.voiceSearchIcon}
              />
            )}
          />
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Explore Categories
          </Text>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={renderCategory}
            numColumns={4}
            columnWrapperStyle={styles.categoryRow}
            scrollEnabled={false} // Since it's inside a ScrollView
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
    paddingBottom: 24,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
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
    fontWeight: '600',
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
    marginBottom: 24,
  },
  searchBar: {
    borderRadius: 16,
    elevation: 2,
  },
  searchInput: {
    fontSize: 14,
  },
  voiceSearchIcon: {
    marginRight: 4,
  },
  categoriesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryRow: {
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  categoryItem: {
    width: '25%', // 4 items per row
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
