import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { Text, Surface, useTheme, Avatar, IconButton, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../redux/hooks';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type WorkerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const PRIMARY_COLOR = '#0066FF'; // Theme color

export default function WorkerDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<WorkerDashboardNavigationProp>();

  const user = useAppSelector((state) => state.profile.user);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiService.workers.getMyProfile();
      if (res && res.success) {
        setProfile(res.profile);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to load worker profile:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleToggleAvailability = async () => {
    if (toggling) return;
    setToggling(true);
    showToast('Toggling availability status...');
    try {
      const res = await apiService.workers.toggleAvailability();
      if (res && res.success) {
        const nextState = res.is_available;
        setProfile((prev: any) => prev ? { ...prev, is_available: nextState } : null);
        showToast(nextState ? 'You are now Available' : 'You are now Offline');
      } else {
        showToast('Failed to toggle status');
      }
    } catch (err: any) {
      showToast(err.message || 'Error toggling availability');
    } finally {
      setToggling(false);
    }
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
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80' }} 
          />
          <View style={styles.headerTextContainer}>
            <Text variant="titleMedium" style={styles.workerName}>
              {user?.name || 'Service Provider'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Service Worker Dashboard</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Availability Switch */}
        <Surface style={styles.availabilityCard} elevation={1}>
          <View style={styles.availabilityRow}>
            <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Duty Status</Text>
              <Text 
                variant="bodyMedium" 
                style={{ 
                  color: profile?.is_available ? '#4CAF50' : '#FF9800', 
                  fontWeight: 'bold',
                  marginTop: 2
                }}
              >
                {profile?.is_available ? 'Available for Jobs' : 'Offline / Busy'}
              </Text>
            </View>
            <Switch
              value={!!profile?.is_available}
              onValueChange={handleToggleAvailability}
              disabled={toggling || loading}
              thumbColor={profile?.is_available ? '#4CAF50' : '#FF9800'}
              trackColor={{ false: '#FFE0B2', true: '#C8E6C9' }}
            />
          </View>
        </Surface>

        {/* Statistics Grid */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Overview</Text>
        </View>
        
        <View style={styles.statsGrid}>
          {renderStatCard('Rating', '4.8', 'star', '#FFC107')}
          {renderStatCard('Views', '86', 'eye-outline', '#9C27B0')}
          {renderStatCard('Bookings', '14', 'calendar-check-outline', '#2196F3')}
          {renderStatCard('Earnings', '₹7,200', 'currency-inr', '#4CAF50')}
        </View>

        {/* Service Profile details */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>My Service Details</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={{ marginTop: 8 }}>Loading service profile...</Text>
          </View>
        ) : error ? (
          <Surface style={styles.errorContainer} elevation={0}>
            <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>Failed to retrieve service profile.</Text>
            <Button mode="text" onPress={loadProfile}>Retry</Button>
          </Surface>
        ) : !profile ? (
          <Surface style={styles.emptyContainer} elevation={0}>
            <MaterialCommunityIcons name="wrench-outline" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>No service profile details set up.</Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('CreateProfile', { isEdit: true })} 
              style={{ marginTop: 12 }}
            >
              Set Up Service Details
            </Button>
          </Surface>
        ) : (
          <Surface style={styles.profileDetailsCard} elevation={1}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="toolbox-outline" size={22} color={PRIMARY_COLOR} />
              <View style={styles.detailTextContainer}>
                <Text variant="bodySmall" style={styles.detailLabel}>Service Offered</Text>
                <Text variant="titleMedium" style={styles.detailValue}>{profile.service_category}</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-inr" size={22} color={PRIMARY_COLOR} />
              <View style={styles.detailTextContainer}>
                <Text variant="bodySmall" style={styles.detailLabel}>Base / Hourly Rate</Text>
                <Text variant="titleMedium" style={styles.detailValue}>₹{profile.hourly_rate}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="history" size={22} color={PRIMARY_COLOR} />
              <View style={styles.detailTextContainer}>
                <Text variant="bodySmall" style={styles.detailLabel}>Work Experience</Text>
                <Text variant="titleMedium" style={styles.detailValue}>{profile.experience_years} Years</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color={PRIMARY_COLOR} />
              <View style={styles.detailTextContainer}>
                <Text variant="bodySmall" style={styles.detailLabel}>Service / Location Area</Text>
                <Text variant="titleMedium" style={styles.detailValue}>{profile.location}</Text>
              </View>
            </View>

            <Button
              mode="contained"
              icon="account-edit-outline"
              onPress={() => navigation.navigate('CreateProfile', { isEdit: true })}
              style={styles.editProfileBtn}
              contentStyle={{ height: 48 }}
            >
              Edit Service Profile
            </Button>
          </Surface>
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
  workerName: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  availabilityCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  profileDetailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailTextContainer: {
    marginLeft: 16,
  },
  detailLabel: {
    color: '#757575',
  },
  detailValue: {
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  editProfileBtn: {
    marginTop: 20,
    borderRadius: 8,
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
