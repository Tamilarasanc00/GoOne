import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Surface, useTheme, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type TabStatus = 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';

const TABS: TabStatus[] = ['Pending', 'Accepted', 'Completed', 'Cancelled'];

export default function BookingsScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabStatus>('Pending');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchBookings = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await apiService.bookings.history();
      // If backend returns bookings successfully, update state
      if (response && response.bookings) {
        setBookings(response.bookings);
      }
    } catch (error) {
      console.warn('Error loading bookings, using static fallback data for preview:', error);
      // Fallback mocks if database table is empty/unconfigured
      setBookings([
        { id: 1, status: 'Pending', providerName: 'Suresh (Plumber)', date: '30 May 2026', time: '02:00 PM', price: '₹200', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80', service: 'Pipe Repair' },
        { id: 2, status: 'Accepted', providerName: 'Muthu Kumar (Electrician)', date: '30 May 2026', time: '04:30 PM', price: '₹300', image: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80', service: 'Wiring Issue' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings(false);
    showToast('Booking history updated');
  };

  const handleAction = async (id: number, actionType: 'accept' | 'reject' | 'complete') => {
    try {
      if (actionType === 'accept') {
        showToast('Accepting booking...');
        await apiService.bookings.accept(id);
        showToast('Booking accepted successfully');
      } else if (actionType === 'reject') {
        showToast('Cancelling booking...');
        await apiService.bookings.reject(id);
        showToast('Booking cancelled successfully');
      } else if (actionType === 'complete') {
        showToast('Completing booking...');
        await apiService.bookings.complete(id);
        showToast('Booking completed successfully');
      }
      fetchBookings(false); // Reload list
    } catch (error: any) {
      showToast(error.message || 'Operation failed.');
    }
  };

  const filteredBookings = bookings.filter(booking => booking.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800';
      case 'Accepted': return '#2196F3';
      case 'Completed': return '#4CAF50';
      case 'Cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const renderBookingCard = ({ item }: { item: any }) => (
    <Surface style={[styles.bookingCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.cardHeader}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.service || 'Marketplace Item'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {item.image ? (
          <Avatar.Image size={50} source={{ uri: item.image }} style={styles.providerImage} />
        ) : (
          <Avatar.Icon size={50} icon="account" />
        )}
        <View style={styles.providerInfo}>
          <Text variant="titleMedium" style={styles.providerName}>{item.providerName || 'Local Business'}</Text>
          <View style={styles.dateTimeRow}>
            <MaterialCommunityIcons name="calendar-blank" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.dateTimeText, { color: theme.colors.onSurfaceVariant }]}>
              {item.date || new Date(item.booking_date || Date.now()).toLocaleDateString()} • {item.time || 'All Day'}
            </Text>
          </View>
        </View>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
          {item.price || `₹${item.total_amount || '0'}`}
        </Text>
      </View>

      {/* Action Buttons based on Status */}
      {item.status === 'Pending' && (
        <View style={styles.cardActions}>
          <Button mode="outlined" onPress={() => handleAction(item.id, 'reject')} style={styles.actionButton} textColor="#D32F2F">Cancel Request</Button>
        </View>
      )}
      
      {item.status === 'Accepted' && (
        <View style={styles.cardActions}>
          <Button mode="outlined" icon="phone" onPress={() => {}} style={styles.actionButton}>Call Partner</Button>
          <Button mode="contained" onPress={() => handleAction(item.id, 'complete')} style={[styles.actionButton, { marginLeft: 12 }]}>Mark Completed</Button>
        </View>
      )}
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Custom Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text 
              variant="titleSmall" 
              style={[
                styles.tabText, 
                { color: activeTab === tab ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 64 }} />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-search" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                No {activeTab.toLowerCase()} bookings found
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  bookingCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerImage: {
    backgroundColor: '#E0E0E0',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
});
