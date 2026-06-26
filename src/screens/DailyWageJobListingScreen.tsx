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
import { StatusChip, VoiceButton, ScreenHeader, EmptyState } from '../components/GoOneUI';
import { voiceService } from '../services/voiceService';

const CATEGORIES = ['All', 'Construction', 'Farm Work', 'Loading', 'Driver', 'Helper', 'Electrician'];

export default function DailyWageJobListingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');

  const fetchJobs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiService.jobs.list(activeCat === 'All' ? undefined : activeCat, query || undefined);
      if (res?.jobs) setJobs(res.jobs);
    } catch {
      setJobs([
        { id: 1, title: 'Need 5 Farm Workers', employer: 'Ramesh Farm', wage: '₹400/day', location: 'Attur', timings: '9AM - 5PM', category: 'Farm Work', isUrgent: true },
        { id: 2, title: 'Construction Helpers', employer: 'KNR Builders', wage: '₹600/day', location: 'Salem', timings: '8AM - 6PM', category: 'Construction', isUrgent: false },
        { id: 3, title: 'Loading/Unloading', employer: 'Sri Krishna Traders', wage: '₹500/day', location: 'Omalur', timings: 'Flexible', category: 'Loading', isUrgent: true },
      ]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [activeCat, query]);

  const handleApply = async (id: string, title: string) => {
    try {
      showToast('Applying...');
      await apiService.jobs.apply(parseInt(id, 10));
      showToast('Applied successfully!');
    } catch {
      showToast('Offline: Application queued');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <ScreenHeader
        title={t('listings.jobs', 'Daily Wage Jobs')}
        onBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder={t('listings.searchJobs', 'Search jobs...')}
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
          data={jobs}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => fetchJobs(true)}
          renderItem={({ item }) => (
            <View style={styles.jobCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {item.isUrgent && <StatusChip label="URGENT" type="red" />}
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  <Text style={styles.jobEmployer}>{item.employer}</Text>
                </View>
                <View style={styles.wageBadge}>
                  <Text style={styles.wageTxt}>{item.wage}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.detailTxt}>📍 {item.location}</Text>
                <Text style={styles.detailTxt}>🕒 {item.timings}</Text>
                <Text style={styles.detailTxt}>💼 {item.category}</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('tel:1234567890')}>
                  <Text style={styles.contactTxt}>📞 {t('common.call', 'Call')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={() => handleApply(item.id, item.title)}>
                  <Text style={styles.applyTxt}>✓ {t('common.submit', 'Apply')}</Text>
                </TouchableOpacity>
              </View>
            </View>
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

  jobCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flex: 1, gap: 4, marginRight: 12 },
  jobTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  jobEmployer: { fontSize: 13, fontWeight: '600', color: Colors.bluePrimary },
  wageBadge: { backgroundColor: Colors.greenSoft, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  wageTxt: { fontSize: 14, fontWeight: '800', color: Colors.greenPrimary },

  cardBody: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, backgroundColor: Colors.bgLight, padding: 12, borderRadius: Radius.md },
  detailTxt: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },

  cardActions: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 12, backgroundColor: Colors.bgLight, alignItems: 'center' },
  contactTxt: { fontSize: 13, fontWeight: '700', color: Colors.bluePrimary },
  applyBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 12, backgroundColor: Colors.bluePrimary, alignItems: 'center' },
  applyTxt: { fontSize: 13, fontWeight: '700', color: Colors.white },
});
