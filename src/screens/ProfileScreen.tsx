import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, useTheme, Avatar, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { storage } from '../services/storage';
import { showToast } from '../utils/toast';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { resetProfile } from '../redux/slices/profileSlice';
import { setRole } from '../redux/slices/appSlice';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const dispatch = useAppDispatch();

  // Fetch active user details from Redux
  const user = useAppSelector((state) => state.profile.user);
  const role = useAppSelector((state) => state.profile.role);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            storage.remove('APP_JWT_TOKEN');
            dispatch(resetProfile());
            dispatch(setRole(null));
            showToast('Logged out successfully');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    showToast('Loading profile editor...');
    navigation.navigate('CreateProfile', { isEdit: true });
  };

  const renderMenuItem = (icon: string, title: string, subtitle?: string, onPress?: () => void, color?: string) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Surface style={styles.menuItem} elevation={0}>
        <View style={[styles.iconContainer, { backgroundColor: (color || theme.colors.primary) + '15' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color || theme.colors.primary} />
        </View>
        <View style={styles.menuTextContainer}>
          <Text variant="titleMedium" style={[styles.menuTitle, color ? { color } : null]}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {subtitle}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
      </Surface>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <Surface style={styles.headerSection} elevation={2}>
          <View style={styles.profileInfo}>
            <Avatar.Image
              size={80}
              source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' }}
              style={styles.avatar}
            />
            <View style={styles.nameContainer}>
              <Text variant="headlineSmall" style={styles.userName}>{user?.name || 'Tamizh User'}</Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>{user?.phone_number || '+91 98765 43210'}</Text>

              <View style={styles.roleBadge}>
                <MaterialCommunityIcons name="account-circle-outline" size={16} color="#0066FF" />
                <Text style={styles.roleText}>
                  {role ? role.replace('_', ' ').toUpperCase() : 'CUSTOMER'}
                </Text>
              </View>
            </View>

            <IconButton
              icon="pencil"
              mode="contained-tonal"
              size={20}
              onPress={handleEditProfile}
              style={styles.editButton}
            />
          </View>
        </Surface>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text variant="titleSmall" style={styles.sectionTitle}>ACCOUNT</Text>
          <Surface style={styles.menuGroup} elevation={1}>
            {renderMenuItem('account-edit-outline', 'Edit Profile', 'Update personal details', handleEditProfile)}
            <Divider style={styles.divider} />
            {renderMenuItem('translate', 'Language', 'Tamil (தமிழ்)', () => {
              showToast('Opening language selector...');
              navigation.navigate('LanguageSelection');
            })}
          </Surface>

          <Text variant="titleSmall" style={styles.sectionTitle}>MY ACTIVITY</Text>
          <Surface style={styles.menuGroup} elevation={1}>
            {renderMenuItem('storefront-outline', 'My Listings', 'Manage your shops and items', () => {
              if (role === 'Retailer') {
                showToast('Loading retailer dashboard...');
                navigation.navigate('RetailerDashboard');
              } else if (role === 'Farmer') {
                showToast('Loading farmer dashboard...');
                navigation.navigate('FarmerDashboard');
              } else if (role === 'Service Worker') {
                showToast('Loading worker dashboard...');
                navigation.navigate('WorkerDashboard');
              } else if (role === 'Rental Owner') {
                showToast('Loading rental dashboard...');
                navigation.navigate('RentalDashboard');
              } else {
                showToast('My Listings is only available for Retailers, Farmers, Workers & Rental Owners');
              }
            })}
            <Divider style={styles.divider} />
            {renderMenuItem('briefcase-outline', 'My Job Postings', 'Hire workers & manage job posts', () => {
              showToast('Loading job postings...');
              navigation.navigate('EmployerDashboard');
            })}
            <Divider style={styles.divider} />
            {renderMenuItem('calendar-check-outline', 'My Bookings', 'View active and past bookings', () => {
              showToast('Loading booking logs...');
              navigation.navigate('MainTabs'); // Redirects to tab navigator (contains bookings)
            })}
            <Divider style={styles.divider} />
            {renderMenuItem('heart-outline', 'Saved', 'Favorite shops and workers', () => {
              showToast('Loading saved favorites...');
            })}
          </Surface>

          <Text variant="titleSmall" style={styles.sectionTitle}>APP PREFERENCES</Text>
          <Surface style={styles.menuGroup} elevation={1}>
            {renderMenuItem('cog-outline', 'Settings', 'Notifications, Privacy', () => {
              showToast('Opening settings...');
              navigation.navigate('Settings');
            })}
            <Divider style={styles.divider} />
            {renderMenuItem('help-circle-outline', 'Help & Support', 'FAQs and Customer Care', () => {
              showToast('Contacting customer care...');
            })}
          </Surface>

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleLogout}>
              <Surface style={styles.logoutButton} elevation={1}>
                <MaterialCommunityIcons name="logout" size={24} color="#D32F2F" />
                <Text variant="titleMedium" style={styles.logoutText}>Log Out</Text>
              </Surface>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>GoOne v1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#FFF',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#E0E0E0',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 20,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    color: '#0066FF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  editButton: {
    margin: 0,
    alignSelf: 'flex-start',
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#757575',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 12,
  },
  menuGroup: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    fontWeight: '600',
  },
  divider: {
    marginLeft: 72,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  logoutContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 16,
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 12,
  },
});
