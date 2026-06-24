import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';
import { socketClient } from '../services/socketClient';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string;
  isRead: boolean;
  type: string;
};

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  booking: { emoji: '📅', color: Colors.greenPrimary, bg: Colors.greenSoft },
  nearbyhelp: { emoji: '🆘', color: Colors.redPrimary, bg: Colors.redSoft },
  nearby_help: { emoji: '🆘', color: Colors.redPrimary, bg: Colors.redSoft },
  nearby: { emoji: '🆘', color: Colors.redPrimary, bg: Colors.redSoft },
  offer: { emoji: '🎁', color: Colors.amberPrimary, bg: Colors.amberSoft },
  job: { emoji: '💼', color: Colors.purplePrimary, bg: Colors.purpleSoft },
  message: { emoji: '💬', color: Colors.bluePrimary, bg: Colors.blueSoft },
  default: { emoji: '🔔', color: Colors.textMuted, bg: Colors.bgLight },
};

function getTypeConfig(type: string) {
  const t = (type || '').toLowerCase();
  return TYPE_CONFIG[t] || TYPE_CONFIG.default;
}

export default function NotificationsScreen() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const groupByDate = (notifs: NotificationItem[]) => {
    const groups: Record<string, NotificationItem[]> = {};
    notifs.forEach(n => {
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      let key = n.date;
      if (n.date === today) key = 'Today';
      else if (n.date === yesterday) key = 'Yesterday';
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return Object.keys(groups).map(title => ({ title, data: groups[title] }));
  };

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await apiService.notifications.list();
      if (res.success && res.notifications) {
        setSections(groupByDate(res.notifications));
        setUnreadCount((res.notifications as NotificationItem[]).filter(n => !n.isRead).length);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const handler = () => fetchNotifications();
    socketClient.on('notification', handler);
    return () => socketClient.off('notification', handler);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiService.notifications.markAsRead(parseInt(id, 10));
      setSections(prev =>
        prev.map(s => ({ ...s, data: s.data.map((n: NotificationItem) => n.id === id ? { ...n, isRead: true } : n) }))
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    const allUnread = sections.flatMap(s => s.data).some((n: NotificationItem) => !n.isRead);
    if (!allUnread) return;
    try {
      await apiService.notifications.markAllAsRead();
      setSections(prev =>
        prev.map(s => ({ ...s, data: s.data.map((n: NotificationItem) => ({ ...n, isRead: true })) }))
      );
      setUnreadCount(0);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerCount}>{unreadCount} unread</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
              <Text style={styles.markAllTxt}>✓ Mark all read</Text>
            </TouchableOpacity>
          )}
          <View style={styles.bellWrap}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.bluePrimary} />
          <Text style={styles.loaderTxt}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchNotifications()}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => {
            const cfg = getTypeConfig(item.type);
            return (
              <TouchableOpacity activeOpacity={0.8} onPress={() => markAsRead(item.id)}>
                <View style={[styles.notifCard, !item.isRead && styles.notifUnread]}>
                  {/* Left accent bar */}
                  {!item.isRead && <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />}
                  {/* Icon */}
                  <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                  </View>
                  {/* Content */}
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>{item.title}</Text>
                    <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                  {/* Unread dot */}
                  {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
                </View>
              </TouchableOpacity>
            );
          }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshing={refreshing}
          onRefresh={() => fetchNotifications(true)}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 64 }}>🔕</Text>
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySubtitle}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, elevation: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  headerCount: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markAllBtn: {
    backgroundColor: Colors.blueSoft, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  markAllTxt: { fontSize: 11, fontWeight: '700', color: Colors.bluePrimary },
  bellWrap: { position: 'relative' },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.redPrimary, alignItems: 'center', justifyContent: 'center',
  },
  bellBadgeTxt: { fontSize: 8, color: Colors.white, fontWeight: '900' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderTxt: { fontSize: 14, color: Colors.textMuted },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 12 },
  errorTxt: { fontSize: 14, color: Colors.redPrimary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.bluePrimary, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 10 },
  retryTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  listContent: { paddingBottom: Spacing.xl },
  sectionHeader: {
    fontSize: 12, fontWeight: '800', color: Colors.textMuted,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  notifCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, marginHorizontal: Spacing.md, marginBottom: 8,
    borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
    position: 'relative', overflow: 'hidden',
  },
  notifUnread: { backgroundColor: Colors.blueSoft + '30' },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  notifIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0,
  },
  notifContent: { flex: 1, justifyContent: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 2 },
  notifTitleUnread: { fontWeight: '800', color: Colors.textPrimary },
  notifMsg: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  notifTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: Spacing.sm, flexShrink: 0 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted },
});
