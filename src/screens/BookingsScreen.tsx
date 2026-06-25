import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { StatusChip } from '../components/GoOneUI';

type TabStatus = 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
const TABS: TabStatus[] = ['Pending', 'Accepted', 'Completed', 'Cancelled'];
const TAB_EMOJIS: Record<TabStatus, string> = {
  Pending: '⏳',
  Accepted: '✅',
  Completed: '🎉',
  Cancelled: '❌',
};

function getServiceEmoji(service: string): string {
  if (!service) return '📋';
  const s = service.toLowerCase();
  if (s.includes('pipe') || s.includes('plumb')) return '🔧';
  if (s.includes('wiring') || s.includes('electr')) return '⚡';
  if (s.includes('plough') || s.includes('farm') || s.includes('tractor')) return '🚜';
  if (s.includes('clean')) return '🧹';
  if (s.includes('paint')) return '🎨';
  if (s.includes('carpentr') || s.includes('wood')) return '🪵';
  if (s.includes('mason') || s.includes('cement')) return '🏗️';
  if (s.includes('cook')) return '🍳';
  return '📋';
}

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<TabStatus>('Pending');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await apiService.bookings.history();
      if (res?.bookings) setBookings(res.bookings);
    } catch {
      setBookings([
        { id: 1, status: 'Pending', providerName: 'Suresh (Plumber)', date: '30 May 2026', time: '02:00 PM', price: '₹200', service: 'Pipe Repair' },
        { id: 2, status: 'Accepted', providerName: 'Muthu Kumar (Electrician)', date: '30 May 2026', time: '04:30 PM', price: '₹300', service: 'Wiring Issue' },
        { id: 3, status: 'Completed', providerName: 'Ravi (Tractor)', date: '28 May 2026', time: '09:00 AM', price: '₹1200', service: 'Ploughing' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchBookings(false); };

  const handleAction = async (id: number, action: 'accept' | 'reject' | 'complete') => {
    try {
      if (action === 'accept') await apiService.bookings.accept(id);
      else if (action === 'reject') await apiService.bookings.reject(id);
      else if (action === 'complete') await apiService.bookings.complete(id);
      showToast(`Booking ${action}ed`);
      fetchBookings(false);
    } catch (err: any) { showToast(err.message || 'Action failed'); }
  };

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={[styles.tabBtn, isActive && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
              <Text style={{ fontSize: 14 }}>{TAB_EMOJIS[tab]}</Text>
              <Text style={[styles.tabTxt, isActive && styles.tabTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={Colors.bluePrimary} /></View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.bluePrimary]} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 64 }}>{TAB_EMOJIS[activeTab]}</Text>
              <Text style={styles.emptyTxt}>No {activeTab.toLowerCase()} bookings</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.serviceIconWrap}>
                  <Text style={{ fontSize: 24 }}>{getServiceEmoji(item.service)}</Text>
                </View>
                <View style={styles.cardHeaderTxt}>
                  <Text style={styles.serviceName}>{item.service || 'Service'}</Text>
                  <Text style={styles.providerName}>{item.providerName}</Text>
                </View>
                <StatusChip
                  label={item.status}
                  type={item.status === 'Pending' ? 'orange' : item.status === 'Accepted' ? 'blue' : item.status === 'Completed' ? 'green' : 'red'}
                />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.detailItem}>
                  <Text style={{ fontSize: 16 }}>📅</Text>
                  <Text style={styles.detailTxt}>{item.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={{ fontSize: 16 }}>⏰</Text>
                  <Text style={styles.detailTxt}>{item.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={{ fontSize: 16 }}>💰</Text>
                  <Text style={styles.detailTxtBold}>{item.price}</Text>
                </View>
              </View>

              {item.status === 'Pending' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(item.id, 'reject')}>
                    <Text style={styles.rejectTxt}>Cancel Request</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'Accepted' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.callBtn} onPress={() => showToast('Calling...')}>
                    <Text style={styles.callTxt}>📞 Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleAction(item.id, 'complete')}>
                    <Text style={styles.completeTxt}>✓ Complete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  
  tabsContainer: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: Colors.bluePrimary },
  tabTxt: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  tabTxtActive: { color: Colors.bluePrimary, fontWeight: '900' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  list: { padding: Spacing.md, paddingBottom: Spacing.xl },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 16, fontWeight: '700', color: Colors.textMuted },

  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  serviceIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardHeaderTxt: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  providerName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  
  cardBody: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.bgLight,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailTxt: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  detailTxtBold: { fontSize: 14, fontWeight: '800', color: Colors.greenPrimary },

  cardActions: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 10, borderWidth: 1.5, borderColor: Colors.redSoft, alignItems: 'center' },
  rejectTxt: { fontSize: 13, fontWeight: '700', color: Colors.redPrimary },
  callBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 10, backgroundColor: Colors.greenSoft, alignItems: 'center' },
  callTxt: { fontSize: 13, fontWeight: '700', color: Colors.greenPrimary },
  completeBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 10, backgroundColor: Colors.bluePrimary, alignItems: 'center' },
  completeTxt: { fontSize: 13, fontWeight: '700', color: Colors.white },
});
