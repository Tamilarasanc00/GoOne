import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type DailyWageJobListingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DailyWageJobListing'>;

const CATEGORIES = ['All', 'Construction', 'Farm Work', 'Loading', 'Driver', 'Helper', 'Electrician'];

const MOCK_JOBS = [
  {
    id: '1',
    title: 'Construction Worker (Mason)',
    employer: 'L&T Sites',
    category: 'Construction',
    wage: '₹800/day',
    location: 'Sankarapuram',
    timings: '09:00 AM - 06:00 PM',
    phone: '+919876543210',
    isUrgent: true,
  },
  {
    id: '2',
    title: 'Farm Labourer for Harvesting',
    employer: 'Murugan Farms',
    category: 'Farm Work',
    wage: '₹500/day',
    location: 'Sankarapuram South',
    timings: '07:00 AM - 04:00 PM',
    phone: '+919876543211',
    isUrgent: false,
  },
  {
    id: '3',
    title: 'Loading / Unloading Helper',
    employer: 'Sri Logistics',
    category: 'Loading',
    wage: '₹600/day + Food',
    location: 'Sankarapuram Market',
    timings: '10:00 AM - 08:00 PM',
    phone: '+919876543212',
    isUrgent: true,
  },
  {
    id: '4',
    title: 'Tata Ace Driver Needed',
    employer: 'Velu Transports',
    category: 'Driver',
    wage: '₹1000/day',
    location: 'Sankarapuram North',
    timings: '08:00 AM - 08:00 PM',
    phone: '+919876543213',
    isUrgent: false,
  },
];

export default function DailyWageJobListingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<DailyWageJobListingNavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.employer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || job.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderJobCard = ({ item }: { item: typeof MOCK_JOBS[0] }) => (
    <Surface style={[styles.jobCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 4 }}>
            {item.employer}
          </Text>
        </View>
        {item.isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>

      <View style={styles.wageContainer}>
        <MaterialCommunityIcons name="cash-multiple" size={24} color="#4CAF50" />
        <Text variant="titleLarge" style={styles.wageText}>
          {item.wage}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            {item.location}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            {item.timings}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="briefcase-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            {item.category}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Button 
          mode="outlined" 
          icon="phone" 
          onPress={() => handleContact(item.phone)}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Contact
        </Button>
        <Button 
          mode="contained" 
          icon="check-circle-outline" 
          onPress={() => {}}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Apply Now
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
        <Text variant="titleLarge" style={styles.headerTitle}>Daily Wage Jobs</Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search jobs, employers..."
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

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="briefcase-search-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No jobs found
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
  jobCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitle: {
    fontWeight: 'bold',
  },
  urgentBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  urgentText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 10,
  },
  wageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  wageText: {
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 12,
  },
  detailsContainer: {
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontWeight: '500',
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
    height: 44,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
});
