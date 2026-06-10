import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Badge } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import BookingsScreen from '../screens/BookingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MapExploreScreen from '../screens/MapExploreScreen';
import { apiService } from '../services/apiService';
import { socketClient } from '../services/socketClient';

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  MapExploreTab: undefined;
  BookingsTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const PRIMARY_COLOR = '#0066FF';

// Badge icon wrapper for Notifications tab
function NotificationTabIcon({
  focused,
  color,
  size,
}: {
  focused: boolean;
  color: string;
  size: number;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await apiService.notifications.getUnreadCount();
      if (res.success && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch {
      // silently ignore
    }
  }, []);

  // Fetch on mount and when tab gets focused
  useEffect(() => {
    socketClient.connect();
    fetchUnread();

    // Re-fetch when a new notification arrives via socket
    const handleNewNotification = () => {
      setUnreadCount((c) => c + 1);
    };

    socketClient.on('notification', handleNewNotification);
    return () => {
      socketClient.off('notification', handleNewNotification);
    };
  }, [fetchUnread]);

  // Also refresh when the tab is focused (user tapped it => just read them)
  useFocusEffect(
    useCallback(() => {
      if (focused) {
        // Short delay to let NotificationsScreen mark them read first
        const t = setTimeout(fetchUnread, 800);
        return () => clearTimeout(t);
      }
    }, [focused, fetchUnread])
  );

  return (
    <View style={styles.iconWrapper}>
      <MaterialCommunityIcons
        name={focused ? 'bell' : 'bell-outline'}
        size={size}
        color={color}
      />
      {unreadCount > 0 && (
        <Badge style={styles.tabBadge} size={16}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </View>
  );
}

export default function MainTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'NotificationsTab') {
            return (
              <NotificationTabIcon focused={focused} color={color} size={size} />
            );
          }

          let iconName = 'home';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchTab') {
            iconName = 'magnify';
          } else if (route.name === 'MapExploreTab') {
            iconName = focused ? 'map-marker-radius' : 'map-marker-radius-outline';
          } else if (route.name === 'BookingsTab') {
            iconName = focused ? 'calendar-text' : 'calendar-text-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen
        name="MapExploreTab"
        component={MapExploreScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
