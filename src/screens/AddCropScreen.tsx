import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type AddCropScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddCrop'>;
type AddCropScreenRouteProp = RouteProp<RootStackParamList, 'AddCrop'>;

const CATEGORIES = ['Vegetables', 'Fruits', 'Rice', 'Seeds', 'Milk'];

const PRESET_KEYWORDS: Record<string, string[]> = {
  Vegetables: ['Tomato', 'Onion', 'Potato', 'Brinjal', 'Drumstick', 'Chilli'],
  Fruits: ['Banana', 'Mango', 'Apple', 'Orange', 'Papaya', 'Guava'],
  Rice: ['Premium Ponni Rice', 'Basmati Rice', 'Raw Rice', 'Boiled Rice'],
  Seeds: ['Paddy Seeds', 'Tomato Seeds', 'Chilli Seeds', 'Cotton Seeds'],
  Milk: ['Cow Milk', 'Buffalo Milk', 'Organic Ghee'],
};

export default function AddCropScreen() {
  const theme = useTheme();
  const navigation = useNavigation<AddCropScreenNavigationProp>();
  const route = useRoute<AddCropScreenRouteProp>();

  const cropId = route.params?.cropId;
  const isEdit = !!cropId;

  // Form states
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEdit && cropId) {
      const fetchCropDetails = async () => {
        setFetching(true);
        showToast('Loading crop details...');
        try {
          const res = await apiService.crops.getDetails(parseInt(cropId, 10));
          if (res && res.success && res.crop) {
            const c = res.crop;
            setCropName(c.crop_name || '');
            setCategory(c.category || 'Vegetables');
            setPrice(parseFloat(c.price_per_kg).toFixed(0));
            setQuantity(parseFloat(c.quantity_available).toFixed(0));
            showToast('Crop details loaded');
          } else {
            showToast('Crop listing not found');
          }
        } catch (err: any) {
          showToast(err.message || 'Failed to fetch crop details');
        } finally {
          setFetching(false);
        }
      };
      fetchCropDetails();
    }
  }, [isEdit, cropId]);

  const handleKeywordSelect = (keyword: string) => {
    setCropName(keyword);
    showToast(`Pre-populated: ${keyword}`);
  };

  const handleSave = async () => {
    if (!cropName.trim()) {
      showToast('Crop name is required');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showToast('Please enter a valid price');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      showToast('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    showToast(isEdit ? 'Updating crop listing...' : 'Adding crop listing...');
    
    const payload = {
      crop_name: cropName,
      quantity_available: parseFloat(quantity),
      price_per_kg: parseFloat(price),
    };

    try {
      let res;
      if (isEdit && cropId) {
        res = await apiService.crops.update(parseInt(cropId, 10), payload);
      } else {
        res = await apiService.crops.create(payload);
      }

      if (res && res.success) {
        showToast(isEdit ? 'Crop updated successfully!' : 'Crop listed successfully!');
        navigation.goBack();
      } else {
        showToast('Operation failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save crop listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8BC34A" />
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
          {isEdit ? 'Edit Crop Listing' : 'List New Crop'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Preset Category Option Selection */}
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
                  category === cat ? { backgroundColor: '#8BC34A' } : undefined,
                ]}
                textStyle={category === cat ? { color: '#FFF' } : undefined}
              >
                {cat}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Preset Name Chips based on Category */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Step 2: Tap Crop Keyword Options</Text>
          <View style={styles.chipGrid}>
            {(PRESET_KEYWORDS[category] || []).map((keyword) => (
              <Chip
                key={keyword}
                onPress={() => handleKeywordSelect(keyword)}
                style={styles.keywordChip}
                icon="tag-outline"
              >
                {keyword}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Form Details */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Step 3: Refine Crop Details</Text>
          
          <TextInput
            label="Crop Name"
            value={cropName}
            onChangeText={setCropName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Tomato, Ponni Rice"
          />

          <TextInput
            label="Price per kg (₹)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            placeholder="e.g. 40"
          />

          <TextInput
            label="Quantity Available (kg)"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            placeholder="e.g. 500"
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={[styles.saveButton, { backgroundColor: '#8BC34A' }]}
            contentStyle={{ height: 50 }}
            labelStyle={styles.saveButtonLabel}
          >
            {isEdit ? 'Update Listing' : 'Publish Crop'}
          </Button>
        </Surface>
      </ScrollView>
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
    backgroundColor: '#F1F8E9',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFF',
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
