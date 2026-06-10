import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Text, Searchbar, Surface, Chip, useTheme, IconButton, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import { StorageKeys, saveJSON, loadJSON } from '../services/storage';
import { syncService } from '../services/syncService';

type DailyWageJobListingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DailyWageJobListing'>;

const CATEGORIES = ['All', 'Construction', 'Farm Work', 'Loading', 'Driver', 'Helper', 'Electrician'];

export default function DailyWageJobListingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<DailyWageJobListingNavigationProp>();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchJobs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiService.jobs.list(
        activeCategory === 'All' ? undefined : activeCategory,
        searchQuery || undefined
      );
      if (res.success && res.jobs) {
        setJobs(res.jobs);
        saveJSON(StorageKeys.CACHED_LISTINGS + '_jobs', res.jobs);
        if (isRefresh) {
          showToast('Job marketplace updated');
        }
      }
    } catch (err: any) {
      const cached = loadJSON<any[]>(StorageKeys.CACHED_LISTINGS + '_jobs');
      if (cached && cached.length > 0) {
        setJobs(cached);
        showToast('Offline: Loaded cached jobs');
      } else {
        setError(err.message || 'Failed to fetch jobs');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeCategory, searchQuery]);

  const handleContact = React.useCallback((name: string, phone: string) => {
    showToast(`Calling ${name}...`);
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleApply = React.useCallback(async (jobId: string, title: string) => {
    const applyPayload = {
      target_id: parseInt(jobId, 10),
      target_type: 'Job',
      total_amount: 0
    };

    try {
      setLoading(true);
      showToast('Submitting application...');
      const res = await apiService.jobs.apply(parseInt(jobId, 10));
      if (res.success) {
        showToast('Application received!');
        Alert.alert('Application Submitted', `Your application for "${title}" has been submitted successfully.`);
      }
    } catch (err: any) {
      if (!syncService.getIsConnected()) {
        syncService.queueAction('BOOK_SERVICE', applyPayload);
        showToast('Offline: Job application queued');
        Alert.alert(
          'Offline Mode',
          `Your application for "${title}" has been saved offline. It will submit automatically when your connection is restored.`
        );
      } else {
        showToast(err.message || 'Something went wrong while applying.');
      }
    } finally {
      setLoading(false);
      fetchJobs();
    }
  }, []);

  const JobCard = React.memo(({ item }: { item: any }) => (
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
          onPress={() => handleContact(item.employer, item.phone)}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Contact
        </Button>
        <Button
          mode="contained"
          icon="check-circle-outline"
          onPress={() => handleApply(item.id, item.title)}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Apply Now
        </Button>
      </View>
    </Surface>
  ));

  const renderJobCard = React.useCallback(({ item }: { item: any }) => (
    <JobCard item={item} />
  ), [handleContact, handleApply]);

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
              onPress={() => {
                setActiveCategory(category);
                showToast(`Filtering by ${category}`);
              }}
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
            Loading jobs...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => fetchJobs()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderJobCard}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchJobs(true)}
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="briefcase-search-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                No jobs found
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
