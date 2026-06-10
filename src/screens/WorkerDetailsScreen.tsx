import React from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Linking, RefreshControl } from 'react-native';
import { Text, Surface, IconButton, Button, useTheme, Divider, Avatar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import ReviewSection from '../components/ReviewSection';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type WorkerDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WorkerDetails'>;
type WorkerDetailsRouteProp = RouteProp<RootStackParamList, 'WorkerDetails'>;

const MOCK_REVIEWS = [
  { id: '1', user: 'Anita S.', rating: 5, comment: 'Very professional and fixed the issue quickly.', date: '2 days ago' },
  { id: '2', user: 'Karthik R.', rating: 4, comment: 'Good work, but arrived 15 mins late.', date: '1 week ago' },
  { id: '3', user: 'Priya M.', rating: 5, comment: 'Excellent service! Highly recommended.', date: '2 weeks ago' },
];

export default function WorkerDetailsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<WorkerDetailsNavigationProp>();
  const route = useRoute<WorkerDetailsRouteProp>();

  const workerId = route.params?.workerId || '1';
  const initialWorkerName = route.params?.workerName || 'Worker';

  const [worker, setWorker] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [avgRating, setAvgRating] = React.useState<number>(4.8);
  const [reviewsCount, setReviewsCount] = React.useState<number>(124);

  const fetchWorkerDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.workers.getDetails(parseInt(workerId, 10));
      if (res.success && res.worker) {
        setWorker(res.worker);
        showToast('Worker details loaded');
      } else {
        setError('Worker not found');
        showToast('Worker not found');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to load worker details';
      setError(errMsg);
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWorkerDetails();
  }, [workerId]);

  const handleWhatsApp = () => {
    const phone = worker?.phone || '+919876543210';
    const name = worker?.name || initialWorkerName;
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${formattedPhone}&text=Hello ${name}, I saw your profile on GoOne and want to book your services.`;
    const fallbackUrl = `https://wa.me/${formattedPhone}?text=Hello ${name}, I saw your profile on GoOne.`;

    showToast(`Opening WhatsApp for ${name}...`);
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(fallbackUrl);
        }
      })
      .catch(() => {
        showToast('Could not open WhatsApp');
        Alert.alert('Error', 'Could not open WhatsApp. Please check if WhatsApp is installed.');
      });
  };

  const handleBook = async () => {
    if (!worker) return;
    showToast(`Requesting booking with ${worker.name}...`);
    try {
      setLoading(true);
      const res = await apiService.bookings.create({
        target_id: worker.id,
        target_type: 'Worker',
        total_amount: worker.hourlyRate ? parseFloat(worker.hourlyRate) : 500
      });
      if (res.success) {
        showToast('Booking requested successfully!');
        Alert.alert(
          'Booking Requested',
          `Your service booking request for ${worker.name} has been submitted successfully.`
        );
      } else {
        showToast('Failed to create booking');
      }
    } catch (err: any) {
      showToast(err.message || 'Booking failed');
      Alert.alert('Booking Failed', err.message || 'Something went wrong while requesting service.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text variant="titleLarge" style={styles.headerTitle}>Worker Profile</Text>
      </View>

      {loading && !worker ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
            Loading worker profile...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
          <Button mode="contained" onPress={fetchWorkerDetails} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <>
          <ScrollView 
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWorkerDetails} colors={[theme.colors.primary]} />}
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Info */}
            <View style={styles.profileSection}>
              <Image 
                source={{ uri: worker?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80' }} 
                style={styles.profileImageLarge} 
              />
              <Text variant="headlineSmall" style={styles.workerNameLarge}>{worker?.name}</Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, marginBottom: 8 }}>{worker?.category || 'Service Worker'}</Text>
              
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.badgeText}>{avgRating} ({reviewsCount})</Text>
                </View>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="briefcase-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.badgeText, { color: theme.colors.onSurfaceVariant }]}>
                    {worker?.experienceYears || 2} Yrs Exp
                  </Text>
                </View>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.badgeText, { color: theme.colors.onSurfaceVariant }]}>
                    {worker?.location || 'Sankarapuram'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Voice Introduction (Mock) */}
            <Surface style={styles.voiceSection} elevation={1}>
              <View style={styles.voiceHeader}>
                <MaterialCommunityIcons name="waveform" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.voiceTitle}>Voice Introduction</Text>
              </View>
              <View style={styles.audioPlayer}>
                <IconButton 
                  icon="play-circle" 
                  size={40} 
                  iconColor={theme.colors.primary} 
                  onPress={() => {}} 
                  style={{ margin: 0 }}
                />
                <View style={styles.waveBarContainer}>
                  <View style={styles.waveBar} />
                  <View style={[styles.waveBar, { height: 16 }]} />
                  <View style={[styles.waveBar, { height: 24 }]} />
                  <View style={[styles.waveBar, { height: 12 }]} />
                  <View style={[styles.waveBar, { height: 20 }]} />
                  <View style={[styles.waveBar, { height: 16 }]} />
                  <View style={[styles.waveBar, { height: 8 }]} />
                </View>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>0:15</Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                "Hello, I am {worker?.name}. I have {worker?.experienceYears || 2} years of experience in all kinds of {worker?.category?.toLowerCase() || 'service'} works, wiring, and repairs..."
              </Text>
            </Surface>

            {/* Availability */}
            <View style={styles.availabilitySection}>
              <Text variant="titleLarge" style={styles.sectionHeader}>Availability</Text>
              <View 
                style={[
                  styles.availabilityCard, 
                  { backgroundColor: worker?.isAvailable ? '#E8F5E9' : '#FFE0B2' }
                ]}
              >
                <MaterialCommunityIcons 
                  name={worker?.isAvailable ? "check-circle" : "clock"} 
                  size={24} 
                  color={worker?.isAvailable ? "#4CAF50" : "#FF9800"} 
                />
                <View style={{ marginLeft: 12 }}>
                  <Text 
                    variant="titleMedium" 
                    style={{ 
                      color: worker?.isAvailable ? '#4CAF50' : '#FF9800', 
                      fontWeight: 'bold' 
                    }}
                  >
                    {worker?.isAvailable ? 'Available Now' : 'Offline / Busy'}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {worker?.isAvailable ? 'Can reach your location in 30 mins' : 'Currently not taking new jobs'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Reviews */}
            <ReviewSection 
              targetType="Worker" 
              targetId={parseInt(workerId, 10) || 1} 
              onRatingFetched={(avg, count) => {
                setAvgRating(avg);
                setReviewsCount(count);
              }}
            />
          </ScrollView>

          {/* Bottom Action Bar */}
          <Surface style={styles.bottomBar} elevation={4}>
            <Button 
              mode="outlined" 
              icon="whatsapp" 
              onPress={handleWhatsApp}
              style={styles.bottomButton}
              contentStyle={styles.bottomButtonContent}
              textColor="#25D366"
            >
              WhatsApp
            </Button>
            <Button 
              mode="contained" 
              icon="calendar-check" 
              onPress={handleBook}
              style={[styles.bottomButton, { marginLeft: 12 }]}
              contentStyle={styles.bottomButtonContent}
            >
              Book Service
            </Button>
          </Surface>
        </>
      )}
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
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  profileImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: '#E0E0E0',
  },
  workerNameLarge: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 13,
  },
  voiceSection: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0F8FF', // Light blue tint
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingRight: 16,
  },
  waveBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    marginHorizontal: 12,
    gap: 4,
  },
  waveBar: {
    width: 4,
    height: 8,
    backgroundColor: '#90CAF9',
    borderRadius: 2,
  },
  availabilitySection: {
    padding: 16,
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
  },
  reviewsSection: {
    padding: 16,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  reviewText: {
    fontStyle: 'italic',
    color: '#424242',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomButton: {
    flex: 1,
    borderRadius: 12,
  },
  bottomButtonContent: {
    height: 48,
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
});
