import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type RetailerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RetailerDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RetailerDashboardNavigationProp>();

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
        <MaterialCommunityIcons name={icon} size={32} color={color} style={{ marginBottom: 12 }} />
        <Text variant="titleMedium" style={{ fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <Avatar.Image 
            size={48} 
            source={{ uri: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80' }} 
          />
          <View style={styles.headerTextContainer}>
            <Text variant="titleMedium" style={styles.shopName}>Sri Murugan Stores</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Retail Dashboard</Text>
          </View>
        </View>
        <IconButton
          icon="bell-outline"
          size={24}
          onPress={() => navigation.navigate('MainTabs')} // Temp navigation to see notifications
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Statistics Grid */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Overview</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Today</Text>
        </View>
        
        <View style={styles.statsGrid}>
          {renderStatCard('Total Products', '124', 'package-variant-closed', '#2196F3')}
          {renderStatCard("Today's Views", '45', 'eye-outline', '#9C27B0')}
          {renderStatCard('Orders', '12', 'shopping-outline', '#4CAF50')}
          {renderStatCard('Earnings', '₹4,500', 'currency-inr', '#FF9800')}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {renderActionCard('Add Product', 'plus-box-outline', '#2196F3', () => navigation.navigate('AddProduct'))}
          {renderActionCard('Add Offer', 'brightness-percent', '#FF9800', () => {})}
          {renderActionCard('Edit Shop', 'store-edit-outline', '#9C27B0', () => {})}
          {renderActionCard('View Orders', 'clipboard-list-outline', '#4CAF50', () => {})}
        </View>

        {/* Recent Orders Preview */}
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent Orders</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>View All</Text>
        </View>

        <Surface style={styles.recentOrderCard} elevation={1}>
          <View style={styles.orderHeader}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Order #1024</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            2x Ponni Rice (25kg), 1x Sunflower Oil (5L)
          </Text>
          <View style={styles.orderFooter}>
            <Text variant="titleMedium" style={{ color: '#4CAF50', fontWeight: 'bold' }}>₹3,200</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>10 mins ago</Text>
          </View>
        </Surface>

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  shopName: {
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
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  actionCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  recentOrderCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});
