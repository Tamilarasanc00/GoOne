import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Avatar, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type TabStatus = 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';

const TABS: TabStatus[] = ['Pending', 'Accepted', 'Completed', 'Cancelled'];

const MOCK_BOOKINGS = [
  {
    id: '1',
    status: 'Pending',
    providerName: 'Suresh (Plumber)',
    date: '30 May 2026',
    time: '02:00 PM',
    price: '₹200 (Visit Charge)',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    service: 'Pipe Repair',
  },
  {
    id: '2',
    status: 'Accepted',
    providerName: 'Muthu Kumar (Electrician)',
    date: '30 May 2026',
    time: '04:30 PM',
    price: '₹300 (Visit Charge)',
    image: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    service: 'Wiring Issue',
  },
  {
    id: '3',
    status: 'Completed',
    providerName: 'Mahindra 575 DI Tractor',
    date: '28 May 2026',
    time: '08:00 AM',
    price: '₹1,500',
    image: 'https://images.unsplash.com/photo-1592837330722-1f7a0709a80e?auto=format&fit=crop&w=400&q=80',
    service: 'Rental (1 Day)',
  },
  {
    id: '4',
    status: 'Cancelled',
    providerName: 'Honda Activa 6G',
    date: '25 May 2026',
    time: '09:00 AM',
    price: '₹300',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
    service: 'Rental',
  },
];

export default function BookingsScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabStatus>('Pending');

  const filteredBookings = MOCK_BOOKINGS.filter(booking => booking.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800';
      case 'Accepted': return '#2196F3';
      case 'Completed': return '#4CAF50';
      case 'Cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const renderBookingCard = ({ item }: { item: typeof MOCK_BOOKINGS[0] }) => (
    <Surface style={[styles.bookingCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.cardHeader}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.service}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Avatar.Image size={50} source={{ uri: item.image }} style={styles.providerImage} />
        <View style={styles.providerInfo}>
          <Text variant="titleMedium" style={styles.providerName}>{item.providerName}</Text>
          <View style={styles.dateTimeRow}>
            <MaterialCommunityIcons name="calendar-blank" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.dateTimeText, { color: theme.colors.onSurfaceVariant }]}>
              {item.date} • {item.time}
            </Text>
          </View>
        </View>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>{item.price}</Text>
      </View>

      {/* Action Buttons based on Status */}
      {item.status === 'Pending' && (
        <View style={styles.cardActions}>
          <Button mode="outlined" onPress={() => {}} style={styles.actionButton} textColor="#D32F2F">Cancel Request</Button>
        </View>
      )}
      
      {item.status === 'Accepted' && (
        <View style={styles.cardActions}>
          <Button mode="outlined" icon="phone" onPress={() => {}} style={styles.actionButton}>Call Provider</Button>
          <Button mode="contained" onPress={() => {}} style={[styles.actionButton, { marginLeft: 12 }]}>Mark Completed</Button>
        </View>
      )}

      {item.status === 'Completed' && (
        <View style={styles.cardActions}>
          <Button mode="outlined" icon="star" onPress={() => {}} style={styles.actionButton}>Leave Review</Button>
          <Button mode="contained" icon="refresh" onPress={() => {}} style={[styles.actionButton, { marginLeft: 12 }]}>Rebook</Button>
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
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-search" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No {activeTab.toLowerCase()} bookings found
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
