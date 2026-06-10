import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, IconButton, Chip, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type AddJobScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddJob'>;
type AddJobScreenRouteProp = RouteProp<RootStackParamList, 'AddJob'>;

const CATEGORIES = ['Construction', 'Farm Work', 'Loading', 'Driver', 'Helper', 'Electrician'];

const PRESET_KEYWORDS: Record<string, string[]> = {
  Construction: ['Mason Helper', 'Cement Mixer', 'Steel Cutter', 'Brick Carrier'],
  'Farm Work': ['Paddy Harvester', 'Coconut Climber', 'Weed Remover', 'Tractor Driver'],
  Loading: ['Heavy Loader', 'Warehouse Helper', 'Truck Unloader'],
  Driver: ['Tractor Driver', 'Mini Truck Driver', 'Auto Driver'],
  Helper: ['Shop Assistant', 'Housekeeping Helper', 'Gardener'],
  Electrician: ['House Wiring', 'Motor Repair', 'Line Helper'],
};

export default function AddJobScreen() {
  const theme = useTheme();
  const navigation = useNavigation<AddJobScreenNavigationProp>();
  const route = useRoute<AddJobScreenRouteProp>();

  const jobId = route.params?.jobId;
  const isEdit = !!jobId;

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Construction');
  const [wage, setWage] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEdit && jobId) {
      const fetchDetails = async () => {
        setFetching(true);
        showToast('Loading job details...');
        try {
          const res = await apiService.jobs.getDetails(parseInt(jobId, 10));
          if (res && res.success && res.job) {
            const j = res.job;
            setTitle(j.title || '');
            setWage(j.wage ? j.wage.replace(/[^\d]/g, '') : '');
            setLocation(j.location || '');
            setDescription(j.description || '');
            setStatus(j.status === true || j.status === 'true');
            showToast('Job details loaded');
          } else {
            showToast('Job post not found');
          }
        } catch (err: any) {
          showToast(err.message || 'Failed to fetch job details');
        } finally {
          setFetching(false);
        }
      };
      fetchDetails();
    }
  }, [isEdit, jobId]);

  const handleKeywordSelect = (keyword: string) => {
    setTitle(keyword);
    showToast(`Pre-populated: ${keyword}`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Job title is required');
      return;
    }
    if (!wage || parseFloat(wage) <= 0) {
      showToast('Please enter a valid daily wage');
      return;
    }

    setLoading(true);
    showToast(isEdit ? 'Updating job post...' : 'Publishing job post...');

    const payload = {
      title,
      description: description || `Looking for a skilled ${title} in ${location || 'local area'}.`,
      wage: `₹${wage}/day`,
      location: location || 'Local Area',
      status: status,
    };

    try {
      let res;
      if (isEdit && jobId) {
        res = await apiService.jobs.update(parseInt(jobId, 10), payload);
      } else {
        res = await apiService.jobs.create(payload);
      }

      if (res && res.success) {
        showToast(isEdit ? 'Job post updated successfully!' : 'Job posted successfully!');
        navigation.goBack();
      } else {
        showToast('Operation failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save job post');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3F51B5" />
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
          {isEdit ? 'Edit Job Post' : 'Post New Job'}
        </Text>
      </View>

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
                  category === cat ? { backgroundColor: '#3F51B5' } : undefined,
                ]}
                textStyle={category === cat ? { color: '#FFF' } : undefined}
              >
                {cat}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Step 2: Keyword Option Chips */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Step 2: Tap Job Keywords</Text>
          <View style={styles.chipGrid}>
            {(PRESET_KEYWORDS[category] || []).map((keyword) => (
              <Chip
                key={keyword}
                onPress={() => handleKeywordSelect(keyword)}
                style={styles.keywordChip}
                icon="briefcase-outline"
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
            label="Job Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Paddy Harvester Helper"
          />

          <TextInput
            label="Daily Wage (₹/day)"
            value={wage}
            onChangeText={setWage}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            placeholder="e.g. 700"
          />

          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Sankarapuram"
          />

          <TextInput
            label="Detailed Job Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Enter job requirements, working hours, and expectations..."
          />

          {isEdit && (
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ fontWeight: '500' }}>Active (Open for applications)</Text>
              <Switch 
                value={status} 
                onValueChange={setStatus} 
                color="#3F51B5"
              />
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={[styles.saveButton, { backgroundColor: '#3F51B5' }]}
            contentStyle={{ height: 50 }}
            labelStyle={styles.saveButtonLabel}
          >
            {isEdit ? 'Update Post' : 'Publish Job Post'}
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
    backgroundColor: '#E8EAF6',
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
