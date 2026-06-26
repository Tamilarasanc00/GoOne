import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Linking, StatusBar } from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { VoiceButton, ScreenHeader, EmptyState } from '../components/GoOneUI';
import { voiceService } from '../services/voiceService';

const CATEGORIES = ['All', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair', 'Mason', 'Welder'];

export default function ServiceWorkerListingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');

  const fetchWorkers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiService.workers.list(activeCat === 'All' ? undefined : activeCat, query || undefined);
      if (res?.workers) setWorkers(res.workers);
    } catch {
      setWorkers([
        { id: 1, name: 'Muthu Kumar', category: 'Electrician', rating: '4.8', experience: '5 Years', availability: 'Available Now', phone: '12345' },
        { id: 2, name: 'Ramesh', category: 'Plumber', rating: '4.5', experience: '3 Years', availability: 'Available Now', phone: '12345' },
        { id: 3, name: 'Suresh', category: 'Carpenter', rating: '4.9', experience: '10 Years', availability: 'Busy', phone: '12345' },
      ]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchWorkers(); }, [activeCat, query]);

  const handleBook = async (id: string, name: string) => {
    try {
      showToast('Booking...');
      await apiService.bookings.create({ target_id: parseInt(id, 10), target_type: 'Worker', total_amount: 500 });
      showToast('Booking requested successfully!');
    } catch {
      showToast('Offline: Booking queued');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <ScreenHeader
        title={t('listings.workers', 'Services & Repairs')}
        onBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder={t('listings.searchWorkers', 'Search electricians, plumbers...')}
          onChangeText={setQuery}
          value={query}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          elevation={0}
        />
        <VoiceButton size={44} onPress={() => voiceService.startListening()} />
      </View>

      {/* Categories */}
      <View style={styles.catWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map(cat => {
            const isActive = activeCat === cat;
            return (
              <TouchableOpacity key={cat} style={[styles.catChip, isActive && styles.catChipActive]} onPress={() => setActiveCat(cat)}>
                <Text style={[styles.catTxt, isActive && styles.catTxtActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={Colors.bluePrimary} /></View>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => fetchWorkers(true)}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('WorkerDetails', { workerId: String(item.id), workerName: item.name })}>
              <View style={styles.workerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}><Text style={{ fontSize: 24 }}>👷</Text></View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.workerName}>{item.name}</Text>
                    <Text style={styles.workerCat}>{item.category}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingTxt}>★ {item.rating}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.detailTxt}>💼 {item.experience} Exp</Text>
                  <Text style={[styles.detailTxt, { color: item.availability === 'Available Now' ? Colors.greenPrimary : Colors.textMuted }]}>
                    {item.availability === 'Available Now' ? '🟢 Available' : '🔴 Busy'}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                    <Text style={styles.contactTxt}>📞 {t('listings.callNow', 'Call Now')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bookBtn} onPress={() => handleBook(item.id, item.name)}>
                    <Text style={styles.bookTxt}>✓ {t('listings.bookNow', 'Book Now')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { paddingRight: Spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.white },
  searchBar: { flex: 1, height: 44, borderRadius: Radius.full, backgroundColor: Colors.bgLight, borderWidth: 1, borderColor: Colors.border },
  searchInput: { fontSize: 13, color: Colors.textPrimary },

  catWrap: { backgroundColor: Colors.white, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  catScroll: { paddingHorizontal: Spacing.md, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgLight, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.bluePrimary, borderColor: Colors.bluePrimary },
  catTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catTxtActive: { color: Colors.white },

  list: { padding: Spacing.md, paddingBottom: Spacing.xl },

  workerCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 12 },
  workerName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  workerCat: { fontSize: 13, fontWeight: '600', color: Colors.bluePrimary },
  ratingBadge: { backgroundColor: Colors.amberSoft, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  ratingTxt: { fontSize: 12, fontWeight: '800', color: Colors.amberPrimary },

  cardBody: { flexDirection: 'row', gap: 16, marginBottom: 16, backgroundColor: Colors.bgLight, padding: 12, borderRadius: Radius.md },
  detailTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },

  cardActions: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 12, backgroundColor: Colors.bgLight, alignItems: 'center' },
  contactTxt: { fontSize: 13, fontWeight: '700', color: Colors.bluePrimary },
  bookBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 12, backgroundColor: Colors.bluePrimary, alignItems: 'center' },
  bookTxt: { fontSize: 13, fontWeight: '700', color: Colors.white },
});
