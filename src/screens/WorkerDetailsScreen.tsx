import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Surface, IconButton, Button, useTheme, Divider, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

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
  const workerName = route.params?.workerName || 'Muthu Kumar';

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80' }} 
            style={styles.profileImageLarge} 
          />
          <Text variant="headlineSmall" style={styles.workerNameLarge}>{workerName}</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.primary, marginBottom: 8 }}>Electrician</Text>
          
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.badgeText}>4.8 (124)</Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="briefcase-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.badgeText, { color: theme.colors.onSurfaceVariant }]}>8 Yrs Exp</Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.badgeText, { color: theme.colors.onSurfaceVariant }]}>2.5 km</Text>
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
            "Hello, I am Muthu. I have 8 years of experience in all kinds of electrical works, wiring, and repairs..."
          </Text>
        </Surface>

        {/* Availability */}
        <View style={styles.availabilitySection}>
          <Text variant="titleLarge" style={styles.sectionHeader}>Availability</Text>
          <View style={styles.availabilityCard}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
            <View style={{ marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ color: '#4CAF50', fontWeight: 'bold' }}>Available Now</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Can reach your location in 30 mins</Text>
            </View>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.reviewsSection}>
          <Text variant="titleLarge" style={styles.sectionHeader}>Recent Reviews</Text>
          {MOCK_REVIEWS.map(review => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Avatar.Text size={32} label={review.user.substring(0, 2).toUpperCase()} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text variant="titleSmall">{review.user}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <MaterialCommunityIcons 
                        key={star} 
                        name="star" 
                        size={14} 
                        color={star <= review.rating ? "#FFC107" : "#E0E0E0"} 
                      />
                    ))}
                  </View>
                </View>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{review.date}</Text>
              </View>
              <Text variant="bodyMedium" style={styles.reviewText}>"{review.comment}"</Text>
              <Divider style={{ marginTop: 16 }} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <Surface style={styles.bottomBar} elevation={4}>
        <Button 
          mode="outlined" 
          icon="whatsapp" 
          onPress={() => {}}
          style={styles.bottomButton}
          contentStyle={styles.bottomButtonContent}
          textColor="#25D366"
        >
          WhatsApp
        </Button>
        <Button 
          mode="contained" 
          icon="calendar-check" 
          onPress={() => {}}
          style={[styles.bottomButton, { marginLeft: 12 }]}
          contentStyle={styles.bottomButtonContent}
        >
          Book Service
        </Button>
      </Surface>
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
});
