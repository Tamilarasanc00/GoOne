import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import BookingsScreen from '../screens/BookingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MapExploreScreen from '../screens/MapExploreScreen';
import VoiceAssistant from '../components/VoiceAssistant';
import { apiService } from '../services/apiService';
import { socketClient } from '../services/socketClient';
import Colors from '../constants/colors';

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  MapExploreTab: undefined;
  BookingsTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  HomeTab: { active: '🏠', inactive: '🏠' },
  SearchTab: { active: '🔍', inactive: '🔍' },
  MapExploreTab: { active: '🗺️', inactive: '🗺️' },
  BookingsTab: { active: '📅', inactive: '📅' },
  NotificationsTab: { active: '🔔', inactive: '🔔' },
  ProfileTab: { active: '👤', inactive: '👤' },
};

const TAB_LABELS: Record<string, string> = {
  HomeTab: 'Home',
  SearchTab: 'Search',
  MapExploreTab: 'Map',
  BookingsTab: 'Bookings',
  NotificationsTab: 'Alerts',
  ProfileTab: 'Profile',
};

function NotificationTabIcon({ focused }: { focused: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await apiService.notifications.getUnreadCount();
      if (res.success && typeof res.count === 'number') setUnreadCount(res.count);
    } catch {}
  }, []);

  useEffect(() => {
    socketClient.connect();
    fetchUnread();
    const handler = () => setUnreadCount(c => c + 1);
    socketClient.on('notification', handler);
    return () => socketClient.off('notification', handler);
  }, [fetchUnread]);

  useFocusEffect(
    useCallback(() => {
      if (focused) {
        const t = setTimeout(fetchUnread, 800);
        return () => clearTimeout(t);
      }
    }, [focused, fetchUnread])
  );

  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <>
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          if (route.name === 'NotificationsTab') {
            return <NotificationTabIcon focused={focused} />;
          }
          return (
            <View style={styles.iconWrap}>
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
                {TAB_ICONS[route.name]?.active || '●'}
              </Text>
            </View>
          );
        },
        tabBarLabel: ({ focused }) => {
          const labels: Record<string, string> = {
            HomeTab: t('navigation.home', 'Home'),
            SearchTab: t('navigation.search', 'Search'),
            MapExploreTab: t('navigation.map', 'Map'),
            BookingsTab: t('navigation.bookings', 'Bookings'),
            NotificationsTab: t('navigation.notifications', 'Alerts'),
            ProfileTab: t('navigation.profile', 'Profile'),
          };
          return (
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {labels[route.name]}
            </Text>
          );
        },
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen name="MapExploreTab" component={MapExploreScreen} />
      <Tab.Screen name="BookingsTab" component={BookingsScreen} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
    <VoiceAssistant />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: { fontSize: 22, opacity: 0.45 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  tabLabelActive: { color: Colors.bluePrimary, fontWeight: '800' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.redPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 8, color: Colors.white, fontWeight: '800' },
});
