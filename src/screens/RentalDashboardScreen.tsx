import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Text, Surface, useTheme, Avatar, IconButton, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../redux/hooks';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type RentalDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const PRIMARY_COLOR = '#9C27B0'; // Purple for rental owner theme

export default function RentalDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RentalDashboardNavigationProp>();

  const profile = useAppSelector((state) => state.profile.profile);
  const user = useAppSelector((state) => state.profile.user);

  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadRentals = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiService.rentals.listMyRentals();
      if (res && res.success) {
        setRentals(res.rentals || []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to load owner rentals:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRentals();
    }, [])
  );

  const handleDeleteRental = (rentalId: number, title: string) => {
    Alert.alert(
      'Delete Rental Listing',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            showToast('Deleting machinery listing...');
            try {
              const res = await apiService.rentals.delete(rentalId);
              if (res && res.success) {
                showToast('Machinery listing deleted successfully');
                loadRentals();
              } else {
                showToast('Failed to delete listing');
              }
            } catch (err: any) {
              showToast(err.message || 'Error deleting listing');
            }
          }
        }
      ]
    );
  };

  const renderStatCard = (title: string, value: string, icon: string, color: string) => (
    <Surface style={styles.statCard} elevation={1}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text variant="headlineSmall" style={styles.statValue}>{value}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{title}</Text>
    </Surface>
  );

  const renderActionCard = (title: string, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.actionCardWrapper}>
      <Surface style={styles.actionCard} elevation={2}>
        <MaterialCommunityIcons name={icon} size={32} color={color} style={{ marginBottom: 8 }} />
        <Text variant="titleMedium" style={{ fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
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
        <View style={styles.headerProfile}>
          <Avatar.Image 
            size={48} 
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1592837330722-1f7a0709a80e?auto=format&fit=crop&w=400&q=80' }} 
          />
          <View style={styles.headerTextContainer}>
            <Text variant="titleMedium" style={styles.ownerName}>
              {user?.name || 'Rental Partner'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Rental Owner Dashboard</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Statistics Grid */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Overview</Text>
        </View>
        
        <View style={styles.statsGrid}>
          {renderStatCard('Listed Items', String(rentals.length), 'key-outline', '#9C27B0')}
          {renderStatCard("Item Views", '156', 'eye-outline', '#2196F3')}
          {renderStatCard('Active Rentals', '3', 'sync', '#4CAF50')}
          {renderStatCard('Earnings', '₹15,400', 'currency-inr', '#FF9800')}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {renderActionCard('Add Machinery', 'plus-box-outline', '#9C27B0', () => navigation.navigate('AddRental'))}
          {renderActionCard('Edit Profile', 'account-edit-outline', '#2196F3', () => {
            navigation.navigate('CreateProfile', { isEdit: true });
          })}
        </View>

        {/* Machinery listings */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>My Rental listings</Text>
          <Text variant="bodyMedium" style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>{rentals.length} Items</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={{ marginTop: 8 }}>Loading machinery listings...</Text>
          </View>
        ) : error ? (
          <Surface style={styles.errorContainer} elevation={0}>
            <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>Failed to retrieve rental listings.</Text>
            <Button mode="text" onPress={loadRentals}>Retry</Button>
          </Surface>
        ) : rentals.length === 0 ? (
          <Surface style={styles.emptyContainer} elevation={0}>
            <MaterialCommunityIcons name="tractor" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>No equipment or machinery listed yet.</Text>
            <Button mode="contained" onPress={() => navigation.navigate('AddRental')} style={{ marginTop: 12, backgroundColor: PRIMARY_COLOR }}>
              Add Your First Item
            </Button>
          </Surface>
        ) : (
          <View>
            {rentals.map((item) => (
              <Surface key={item.id} style={styles.rentalItemCard} elevation={1}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1592837330722-1f7a0709a80e?auto=format&fit=crop&w=400&q=80' }} 
                  style={styles.rentalImg} 
                />
                <View style={styles.rentalDetailsContainer}>
                  <Text variant="titleMedium" style={styles.rentalTitleText}>{item.title}</Text>
                  <Text variant="bodySmall" style={styles.rentalCatText}>{item.category || 'Equipment'}</Text>
                  <Text variant="titleMedium" style={styles.rentalPrice}>₹{parseFloat(item.price_per_day).toFixed(0)}/day</Text>
                  <Text 
                    variant="bodySmall" 
                    style={[
                      styles.rentalStatus, 
                      { color: item.is_available ? '#4CAF50' : '#FF9800' }
                    ]}
                  >
                    {item.is_available ? 'Available Now' : 'Rented Out / Offline'}
                  </Text>
                </View>
                <View style={styles.rentalActionsRow}>
                  <IconButton 
                    icon="pencil-outline" 
                    iconColor={PRIMARY_COLOR} 
                    size={22} 
                    onPress={() => navigation.navigate('AddRental', { rentalId: item.id.toString() })} 
                  />
                  <IconButton 
                    icon="trash-can-outline" 
                    iconColor="#D32F2F" 
                    size={22} 
                    onPress={() => handleDeleteRental(item.id, item.title)} 
                  />
                </View>
              </Surface>
            ))}
          </View>
        )}

      </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    margin: 0,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  ownerName: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  rentalItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  rentalImg: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  rentalDetailsContainer: {
    flex: 1,
    marginLeft: 14,
  },
  rentalTitleText: {
    fontWeight: 'bold',
  },
  rentalCatText: {
    color: '#757575',
    fontSize: 12,
  },
  rentalPrice: {
    color: '#9C27B0',
    fontWeight: 'bold',
    marginTop: 2,
  },
  rentalStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  rentalActionsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#F5F5F5',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#757575',
    marginTop: 8,
    fontWeight: '500',
  },
});
