import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator, Button, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiService } from '../services/apiService';
import { socketClient } from '../services/socketClient';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string;
  isRead: boolean;
  type: string;
};

export default function NotificationsScreen() {
  const theme = useTheme();

  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const groupNotificationsByDate = (notificationsArray: NotificationItem[]) => {
    const groups: { [key: string]: NotificationItem[] } = {};
    notificationsArray.forEach((notif) => {
      const dateStr = notif.date;
      let groupTitle = dateStr;
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (dateStr === today) groupTitle = 'Today';
      else if (dateStr === yesterday) groupTitle = 'Yesterday';
      if (!groups[groupTitle]) groups[groupTitle] = [];
      groups[groupTitle].push(notif);
    });
    return Object.keys(groups).map((title) => ({ title, data: groups[title] }));
  };

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await apiService.notifications.list();
      if (res.success && res.notifications) {
        const grouped = groupNotificationsByDate(res.notifications);
        setSections(grouped);
        const unread = (res.notifications as NotificationItem[]).filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Real-time: listen for incoming 'notification' events and re-fetch
  useEffect(() => {
    fetchNotifications();

    const handleNewNotification = (_payload: any) => {
      // Re-fetch so we always show the full ordered list
      fetchNotifications();
    };

    socketClient.on('notification', handleNewNotification);
    return () => {
      socketClient.off('notification', handleNewNotification);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiService.notifications.markAsRead(parseInt(id, 10));
      // Optimistically update local state
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          data: section.data.map((n: NotificationItem) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const allNotifs: NotificationItem[] = sections.flatMap((s) => s.data);
    const hasUnread = allNotifs.some((n) => !n.isRead);
    if (!hasUnread) return;
    try {
      await apiService.notifications.markAllAsRead();
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          data: section.data.map((n: NotificationItem) => ({ ...n, isRead: true })),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  // Map backend type string -> icon/color regardless of casing
  const getIconData = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'booking') return { icon: 'calendar-check', color: '#4CAF50', bg: '#E8F5E9' };
    if (t === 'nearbyhelp' || t === 'nearby_help' || t === 'nearby')
      return { icon: 'alert-circle-outline', color: '#F44336', bg: '#FFEBEE' };
    if (t === 'offer') return { icon: 'brightness-percent', color: '#FF9800', bg: '#FFF3E0' };
    if (t === 'job') return { icon: 'briefcase-outline', color: '#9C27B0', bg: '#F3E5F5' };
    if (t === 'message') return { icon: 'message-text-outline', color: '#2196F3', bg: '#E3F2FD' };
    return { icon: 'bell-outline', color: '#757575', bg: '#F5F5F5' };
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const { icon, color, bg } = getIconData(item.type);
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => handleMarkAsRead(item.id)}>
        <Surface
          style={[
            styles.notificationCard,
            {
              backgroundColor: item.isRead ? theme.colors.surface : '#EFF6FF',
              borderColor: item.isRead ? '#F0F0F0' : '#BFDBFE',
            },
          ]}
          elevation={0}
        >
          <View style={[styles.iconContainer, { backgroundColor: bg }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
          </View>

          <View style={styles.textContainer}>
            <Text
              variant="titleMedium"
              style={[styles.title, !item.isRead && { fontWeight: 'bold' }]}
            >
              {item.title}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            <Text variant="labelSmall" style={styles.timeText}>
              {item.time}
            </Text>
          </View>

          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </Surface>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text variant="titleMedium" style={styles.sectionHeader}>
      {title}
    </Text>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Badge style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</Badge>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
              <MaterialCommunityIcons
                name="check-all"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant="labelMedium"
                style={[styles.markAllText, { color: theme.colors.primary }]}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={28}
            color={theme.colors.primary}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyMedium"
            style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}
          >
            Loading notifications...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text
            variant="bodyLarge"
            style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}
          >
            {error}
          </Text>
          <Button mode="contained" onPress={() => fetchNotifications()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshing={refreshing}
          onRefresh={() => fetchNotifications(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="bell-sleep-outline"
                size={72}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}
              >
                You're all caught up!
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, opacity: 0.7 }}
              >
                No notifications yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { fontWeight: 'bold' },
  badge: {
    backgroundColor: '#EF4444',
    color: '#fff',
    fontSize: 11,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  markAllText: { fontWeight: '600' },
  listContainer: { paddingBottom: 24 },
  sectionHeader: {
    fontWeight: 'bold',
    color: '#757575',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: { marginBottom: 4 },
  timeText: { marginTop: 8, color: '#9E9E9E' },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginLeft: 8,
    flexShrink: 0,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});
