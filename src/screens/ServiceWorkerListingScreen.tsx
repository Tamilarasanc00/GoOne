import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type ServiceWorkerListingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceWorkerListing'>;

const CATEGORIES = ['All', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair', 'Mason', 'Welder'];

const MOCK_WORKERS = [
  {
    id: '1',
    name: 'Muthu Kumar',
    category: 'Electrician',
    experience: '8 Years Exp',
    rating: 4.8,
    reviews: 124,
    availability: 'Available Now',
    image: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    phone: '+919876543210',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Suresh',
    category: 'Plumber',
    experience: '12 Years Exp',
    rating: 4.5,
    reviews: 89,
    availability: 'Available from 2 PM',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    phone: '+919876543211',
    isAvailable: false,
  },
  {
    id: '3',
    name: 'Ramesh',
    category: 'AC Repair',
    distance: '2.5 km',
    location: 'Sankarapuram',
    experience: '5 Years Exp',
    rating: 4.9,
    reviews: 210,
    availability: 'Available Now',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    phone: '+919876543212',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Vijay',
    category: 'Carpenter',
    distance: '4.0 km',
    location: 'Sankarapuram East',
    experience: '15 Years Exp',
    rating: 4.7,
    reviews: 156,
    availability: 'Available Tomorrow',
    image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=400&q=80',
    phone: '+919876543213',
    isAvailable: false,
  },
];

export default function ServiceWorkerListingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ServiceWorkerListingNavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredWorkers = MOCK_WORKERS.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          worker.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || worker.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderWorkerCard = ({ item }: { item: typeof MOCK_WORKERS[0] }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('WorkerDetails', { workerId: item.id, workerName: item.name })}
    >
      <Surface style={[styles.workerCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.image }} style={styles.profileImage} />
        <View style={styles.headerInfo}>
          <Text variant="titleMedium" style={styles.workerName}>{item.name}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '500' }}>
            {item.category}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{item.rating}</Text>
          <MaterialCommunityIcons name="star" size={12} color="#FFF" />
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="briefcase-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            {item.experience}
          </Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <MaterialCommunityIcons 
            name={item.isAvailable ? "check-circle-outline" : "clock-outline"} 
            size={18} 
            color={item.isAvailable ? "#4CAF50" : "#FF9800"} 
          />
          <Text variant="bodyMedium" style={[styles.detailText, { color: item.isAvailable ? "#4CAF50" : "#FF9800" }]}>
            {item.availability}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Button 
          mode="outlined" 
          icon="phone" 
          onPress={() => handleCall(item.phone)}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Call
        </Button>
        <Button 
          mode="contained" 
          icon="calendar-check" 
          onPress={() => {}}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Book
        </Button>
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
        <Text variant="titleLarge" style={styles.headerTitle}>Services & Repairs</Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search for plumbers, electricians..."
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

      {/* Worker List */}
      <FlatList
        data={filteredWorkers}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkerCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No workers found
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
  workerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workerName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  detailDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BDBDBD',
    marginHorizontal: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    height: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
});
