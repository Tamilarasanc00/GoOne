import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, IconButton, Chip, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type AddRentalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddRental'>;
type AddRentalScreenRouteProp = RouteProp<RootStackParamList, 'AddRental'>;

const CATEGORIES = ['Tractor', 'Bike', 'Mini Truck', 'JCB', 'Water Tanker', 'Farming Tools'];

const PRESET_KEYWORDS: Record<string, string[]> = {
  Tractor: ['Mahindra 575 DI', 'John Deere 5050', 'Swaraj 744 FE'],
  Bike: ['Hero Splendor Plus', 'Honda Shine', 'TVS XL 100'],
  'Mini Truck': ['Tata Ace Gold', 'Mahindra Supro', 'Ashok Leyland Dost'],
  JCB: ['JCB 3DX Backhoe', 'CAT 424 Backhoe', 'Case 770 EX'],
  'Water Tanker': ['4000L Water Tanker', '6000L Water Tanker'],
  'Farming Tools': ['Power Tiller', 'Rotavator', 'Disc Plough', 'Seed Drill'],
};

export default function AddRentalScreen() {
  const theme = useTheme();
  const navigation = useNavigation<AddRentalScreenNavigationProp>();
  const route = useRoute<AddRentalScreenRouteProp>();

  const rentalId = route.params?.rentalId;
  const isEdit = !!rentalId;

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tractor');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEdit && rentalId) {
      const fetchDetails = async () => {
        setFetching(true);
        showToast('Loading machinery details...');
        try {
          const res = await apiService.rentals.getDetails(parseInt(rentalId, 10));
          if (res && res.success && res.rental) {
            const r = res.rental;
            setTitle(r.title || '');
            setCategory(r.category || 'Tractor');
            setPrice(parseFloat(r.price_per_day).toFixed(0));
            setLocation(r.location || '');
            setIsAvailable(r.is_available === true || r.is_available === 'true');
            showToast('Machinery details loaded');
          } else {
            showToast('Listing not found');
          }
        } catch (err: any) {
          showToast(err.message || 'Failed to fetch machinery details');
        } finally {
          setFetching(false);
        }
      };
      fetchDetails();
    }
  }, [isEdit, rentalId]);

  const handleKeywordSelect = (keyword: string) => {
    setTitle(keyword);
    showToast(`Pre-populated: ${keyword}`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Machinery title is required');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showToast('Please enter a valid rental price');
      return;
    }

    setLoading(true);
    showToast(isEdit ? 'Updating machinery listing...' : 'Adding machinery listing...');

    const payload = {
      title,
      category,
      price_per_day: parseFloat(price),
      location: location || 'Local Area',
      is_available: isAvailable,
    };

    try {
      let res;
      if (isEdit && rentalId) {
        res = await apiService.rentals.update(parseInt(rentalId, 10), payload);
      } else {
        res = await apiService.rentals.create(payload);
      }

      if (res && res.success) {
        showToast(isEdit ? 'Listing updated successfully!' : 'Listing added successfully!');
        navigation.goBack();
      } else {
        showToast('Operation failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={{ marginTop: 12 }}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {isEdit ? 'Edit Machinery Listing' : 'List New Machinery'}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Step 1: Select Category */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Step 1: Select Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.optionChip,
                  category === cat ? { backgroundColor: '#9C27B0' } : undefined,
                ]}
                textStyle={category === cat ? { color: '#FFF' } : undefined}
              >
                {cat}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Step 2: Keyword option Chips */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Step 2: Tap Machinery Keywords</Text>
          <View style={styles.chipGrid}>
            {(PRESET_KEYWORDS[category] || []).map((keyword) => (
              <Chip
                key={keyword}
                onPress={() => handleKeywordSelect(keyword)}
                style={styles.keywordChip}
                icon="tractor"
              >
                {keyword}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Step 3: Refine Form */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Step 3: Refine Details</Text>
          
          <TextInput
            label="Machinery Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Mahindra 575 Tractor"
          />

          <TextInput
            label="Rental Price per Day (₹)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            placeholder="e.g. 1500"
          />

          <TextInput
            label="Location / Working Radius"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Sankarapuram"
          />

          {isEdit && (
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ fontWeight: '500' }}>Available for Rent</Text>
              <Switch 
                value={isAvailable} 
                onValueChange={setIsAvailable} 
                color="#9C27B0"
              />
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={[styles.saveButton, { backgroundColor: '#9C27B0' }]}
            contentStyle={{ height: 50 }}
            labelStyle={styles.saveButtonLabel}
          >
            {isEdit ? 'Update Listing' : 'Publish Listing'}
          </Button>
        </Surface>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderRadius: 20,
  },
  keywordChip: {
    borderRadius: 8,
    backgroundColor: '#F3E5F5',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  saveButtonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
