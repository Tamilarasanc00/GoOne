import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import { StorageKeys, saveJSON, loadJSON } from '../services/storage';
import { syncService } from '../services/syncService';

type ServiceWorkerListingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceWorkerListing'>;

const CATEGORIES = ['All', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair', 'Mason', 'Welder'];

export default function ServiceWorkerListingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ServiceWorkerListingNavigationProp>();

  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchWorkers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiService.workers.list(
        activeCategory === 'All' ? undefined : activeCategory,
        searchQuery || undefined
      );
      if (res.success && res.workers) {
        setWorkers(res.workers);
        saveJSON(StorageKeys.CACHED_LISTINGS + '_workers', res.workers);
        showToast(isRefresh ? 'Service worker listings refreshed' : 'Service worker listings loaded');
      }
    } catch (err: any) {
      const cached = loadJSON<any[]>(StorageKeys.CACHED_LISTINGS + '_workers');
      if (cached && cached.length > 0) {
        setWorkers(cached);
        showToast('Offline: Loaded cached workers');
      } else {
        const errMsg = err.message || 'Failed to fetch workers';
        setError(errMsg);
        showToast(errMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [activeCategory, searchQuery]);

  const handleCategoryPress = React.useCallback((category: string) => {
    setActiveCategory(category);
    showToast(`Filtering by ${category}`);
  }, []);

  const handleCall = React.useCallback((phone: string, name: string) => {
    showToast(`Calling ${name}...`);
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast('Could not open phone dialer');
    });
  }, []);

  const handleBook = React.useCallback(async (workerId: string, workerName: string, serviceType: string) => {
    const bookingPayload = {
      target_id: parseInt(workerId, 10),
      target_type: 'Worker',
      total_amount: 500 // hourly or general base rate
    };

    showToast(`Requesting booking with ${workerName}...`);
    try {
      setLoading(true);
      const res = await apiService.bookings.create(bookingPayload);
      if (res.success) {
        showToast('Booking requested successfully!');
        Alert.alert('Booking Requested', `Your service booking request for ${workerName} has been submitted successfully.`);
      } else {
        showToast('Failed to create booking');
      }
    } catch (err: any) {
      if (!syncService.getIsConnected()) {
        syncService.queueAction('BOOK_SERVICE', bookingPayload);
        showToast('Offline: Booking request queued');
        Alert.alert(
          'Offline Mode',
          `Your service booking request for ${workerName} has been saved offline. It will submit automatically when your connection is restored.`
        );
      } else {
        showToast(err.message || 'Booking failed');
        Alert.alert('Booking Failed', err.message || 'Something went wrong while requesting service.');
      }
    } finally {
      setLoading(false);
      fetchWorkers();
    }
  }, []);

  const WorkerCard = React.memo(({ item, onPress }: { item: any, onPress: () => void }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
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
            onPress={() => handleCall(item.phone, item.name)}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Call
          </Button>
          <Button 
            mode="contained" 
            icon="calendar-check" 
            onPress={() => handleBook(item.id, item.name, item.category)}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Book
          </Button>
        </View>
      </Surface>
    </TouchableOpacity>
  ));

  const renderWorkerCard = React.useCallback(({ item }: { item: any }) => (
    <WorkerCard 
      item={item} 
      onPress={() => navigation.navigate('WorkerDetails', { workerId: String(item.id), workerName: item.name })}
    />
  ), [handleCall, handleBook, navigation]);

  const getItemLayout = React.useCallback((data: any, index: number) => (
    {length: 220, offset: 220 * index, index}
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
            Loading service profiles...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => fetchWorkers()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderWorkerCard}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchWorkers(true)}
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                No workers found
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
