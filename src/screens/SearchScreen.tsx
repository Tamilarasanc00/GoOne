import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader, VoiceButton } from '../components/GoOneUI';
import { useTranslation } from 'react-i18next';
import { showToast } from '../utils/toast';
import { voiceService } from '../services/voiceService';

const RECENT_SEARCHES = ['Plumber', 'Tata Ace', 'Tomato seeds', 'Electrician', 'Ponni Rice'];
const TRENDING_CATEGORIES = [
  { name: 'Hardware', emoji: '🔧', color: Colors.bluePrimary, bg: Colors.blueSoft },
  { name: 'Fertilizers', emoji: '🌱', color: Colors.greenPrimary, bg: Colors.greenSoft },
  { name: 'Tractors', emoji: '🚜', color: Colors.amberPrimary, bg: Colors.amberSoft },
  { name: 'Construction', emoji: '🏗️', color: Colors.orangePrimary, bg: Colors.orangeSoft },
  { name: 'Groceries', emoji: '🛒', color: Colors.purplePrimary, bg: Colors.purpleSoft },
];

export default function SearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [recent, setRecent] = useState(RECENT_SEARCHES);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      showToast(`Searching for: ${query}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBarWrap}>
          <Searchbar
            placeholder={t('common.search', 'Search shops, services...')}
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            elevation={0}
            autoFocus
            iconColor={Colors.bluePrimary}
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.voiceBtnWrap}>
            <VoiceButton size={40} onPress={() => voiceService.startListening()} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Recent */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recent Searches" actionLabel="Clear" onAction={() => setRecent([])} />
            <View style={styles.recentList}>
              {recent.map(item => (
                <View key={item} style={styles.recentItem}>
                  <Text style={{ fontSize: 18, color: Colors.textMuted }}>🕒</Text>
                  <TouchableOpacity style={styles.recentItemTxtWrap} onPress={() => handleSearch(item)}>
                    <Text style={styles.recentItemTxt}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRecent(prev => prev.filter(r => r !== item))}>
                    <Text style={{ fontSize: 16, color: Colors.textMuted, padding: 8 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Trending Categories */}
        <View style={styles.section}>
          <SectionHeader title="🔥 Trending Categories" />
          <View style={styles.trendingGrid}>
            {TRENDING_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.name}
                style={[styles.trendingCard, { borderColor: cat.color + '30', backgroundColor: Colors.white }]}
                onPress={() => handleSearch(cat.name)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
                  <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
                </View>
                <Text style={styles.trendingText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Tags */}
        <View style={styles.section}>
          <SectionHeader title="Popular Tags" />
          <View style={styles.tagsContainer}>
            {['#urgent', '#freedelivery', '#organic', '#discount', '#wholesale'].map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.tagChip}
                onPress={() => handleSearch(tag)}
              >
                <Text style={styles.tagTxt}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, elevation: 2,
  },
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBar: {
    flex: 1, height: 50, borderRadius: Radius.lg,
    backgroundColor: Colors.bgLight, borderWidth: 1.5, borderColor: Colors.border,
  },
  searchInput: { fontSize: 14, color: Colors.textPrimary },
  voiceBtnWrap: { flexShrink: 0 },

  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  section: { marginBottom: Spacing.lg },

  recentList: { gap: 8 },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  recentItemTxtWrap: { flex: 1, marginLeft: 12 },
  recentItemTxt: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },

  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendingCard: {
    width: '31%', borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  trendingText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, elevation: 1,
  },
  tagTxt: { fontSize: 13, fontWeight: '600', color: Colors.bluePrimary },
});
