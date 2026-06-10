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

type FarmerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const PRIMARY_COLOR = '#8BC34A'; // Green for farming aesthetics

export default function FarmerDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<FarmerDashboardNavigationProp>();

  const profile = useAppSelector((state) => state.profile.profile);
  const user = useAppSelector((state) => state.profile.user);

  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCrops = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiService.crops.listMyCrops();
      if (res && res.success) {
        setCrops(res.crops || []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to load farmer crops:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCrops();
    }, [])
  );

  const handleDeleteCrop = (cropId: number, cropName: string) => {
    Alert.alert(
      'Delete Crop Listing',
      `Are you sure you want to delete "${cropName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            showToast('Deleting crop listing...');
            try {
              const res = await apiService.crops.delete(cropId);
              if (res && res.success) {
                showToast('Crop listing deleted successfully');
                loadCrops();
              } else {
                showToast('Failed to delete crop listing');
              }
            } catch (err: any) {
              showToast(err.message || 'Error deleting crop listing');
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
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' }} 
          />
          <View style={styles.headerTextContainer}>
            <Text variant="titleMedium" style={styles.farmerName}>
              {profile?.farm_name || 'My Farm'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Farmer Dashboard</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Statistics Grid */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Overview</Text>
          <Text variant="bodyMedium" style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>Live Stats</Text>
        </View>
        
        <View style={styles.statsGrid}>
          {renderStatCard('Listed Crops', String(crops.length), 'tractor', '#8BC34A')}
          {renderStatCard("Crop Views", '124', 'eye-outline', '#9C27B0')}
          {renderStatCard('Enquiries', '8', 'message-text-outline', '#2196F3')}
          {renderStatCard('Earnings', '₹12,400', 'currency-inr', '#FF9800')}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {renderActionCard('Add Crop', 'plus-box-outline', '#8BC34A', () => navigation.navigate('AddCrop'))}
          {renderActionCard('Edit Profile', 'account-edit-outline', '#9C27B0', () => {
            navigation.navigate('CreateProfile', { isEdit: true });
          })}
        </View>

        {/* Crop listings */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>My Crop Listings</Text>
          <Text variant="bodyMedium" style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>{crops.length} Crops</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={{ marginTop: 8 }}>Loading crop listings...</Text>
          </View>
        ) : error ? (
          <Surface style={styles.errorContainer} elevation={0}>
            <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>Failed to retrieve crop listings.</Text>
            <Button mode="text" onPress={loadCrops}>Retry</Button>
          </Surface>
        ) : crops.length === 0 ? (
          <Surface style={styles.emptyContainer} elevation={0}>
            <MaterialCommunityIcons name="tractor-variant" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>No crops added to your farm listing yet.</Text>
            <Button mode="contained" onPress={() => navigation.navigate('AddCrop')} style={{ marginTop: 12, backgroundColor: PRIMARY_COLOR }}>
              Add Your First Crop
            </Button>
          </Surface>
        ) : (
          <View>
            {crops.map((item) => (
              <Surface key={item.id} style={styles.cropItemCard} elevation={1}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' }} 
                  style={styles.cropImg} 
                />
                <View style={styles.cropDetailsContainer}>
                  <Text variant="titleMedium" style={styles.cropNameTitle}>{item.crop_name}</Text>
                  <Text variant="titleMedium" style={styles.cropPrice}>₹{parseFloat(item.price_per_kg).toFixed(0)}/kg</Text>
                  <Text variant="bodySmall" style={styles.cropQty}>Available stock: {item.quantity_available} kg</Text>
                </View>
                <View style={styles.cropActionsRow}>
                  <IconButton 
                    icon="pencil-outline" 
                    iconColor={PRIMARY_COLOR} 
                    size={22} 
                    onPress={() => navigation.navigate('AddCrop', { cropId: item.id.toString() })} 
                  />
                  <IconButton 
                    icon="trash-can-outline" 
                    iconColor="#D32F2F" 
                    size={22} 
                    onPress={() => handleDeleteCrop(item.id, item.crop_name)} 
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
  farmerName: {
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
  cropItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cropImg: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  cropDetailsContainer: {
    flex: 1,
    marginLeft: 14,
  },
  cropNameTitle: {
    fontWeight: 'bold',
  },
  cropPrice: {
    color: '#8BC34A',
    fontWeight: 'bold',
    marginTop: 2,
  },
  cropQty: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  cropActionsRow: {
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
