import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { Text, Searchbar, Surface, useTheme, Chip, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const RECENT_SEARCHES = ['Plumber', 'Tata Ace', 'Tomato seeds', 'Electrician', 'Ponni Rice'];
const TRENDING_CATEGORIES = [
  { name: 'Hardware', icon: 'tools' },
  { name: 'Fertilizers', icon: 'sprout' },
  { name: 'Tractors', icon: 'tractor' },
  { name: 'Construction', icon: 'account-hard-hat' },
  { name: 'Groceries', icon: 'basket' },
];

export default function SearchScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, this would trigger an API search call
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const removeRecentSearch = (itemToRemove: string) => {
    setRecentSearches(recentSearches.filter(item => item !== itemToRemove));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      
      {/* Search Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search shops, services, or rentals..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          elevation={1}
          autoFocus
          clearIcon="close"
          icon="magnify"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentList}>
              {recentSearches.map((item, index) => (
                <View key={index} style={styles.recentItem}>
                  <MaterialCommunityIcons name="history" size={20} color="#757575" />
                  <TouchableOpacity style={styles.recentItemTextContainer} onPress={() => handleSearch(item)}>
                    <Text variant="bodyLarge" style={styles.recentItemText}>{item}</Text>
                  </TouchableOpacity>
                  <IconButton
                    icon="close"
                    size={20}
                    iconColor="#9E9E9E"
                    onPress={() => removeRecentSearch(item)}
                    style={styles.removeIcon}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {recentSearches.length > 0 && <Divider style={styles.divider} />}

        {/* Trending Categories */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Trending Categories</Text>
          <View style={styles.trendingGrid}>
            {TRENDING_CATEGORIES.map((category, index) => (
              <TouchableOpacity key={index} style={styles.trendingCardWrapper} onPress={() => handleSearch(category.name)}>
                <Surface style={styles.trendingCard} elevation={1}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                    <MaterialCommunityIcons name={category.icon} size={28} color={theme.colors.primary} />
                  </View>
                  <Text variant="bodyMedium" style={styles.trendingText}>{category.name}</Text>
                </Surface>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suggested Tags */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Popular Tags</Text>
          <View style={styles.tagsContainer}>
            {['#urgent', '#freedelivery', '#organic', '#discount', '#wholesale'].map((tag, index) => (
              <Chip
                key={index}
                style={styles.tagChip}
                onPress={() => handleSearch(tag)}
              >
                {tag}
              </Chip>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    borderRadius: 12,
    height: 52,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#424242',
  },
  recentList: {
    gap: 4,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  recentItemText: {
    color: '#424242',
  },
  removeIcon: {
    margin: 0,
  },
  divider: {
    marginHorizontal: -16,
    marginBottom: 24,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trendingCardWrapper: {
    width: '31%',
    marginBottom: 12,
  },
  trendingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trendingText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
});
