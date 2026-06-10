import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, useTheme, Avatar, Divider, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { storage } from '../services/storage';
import { API_URL } from '../config/apiConfig';
import { showToast } from '../utils/toast';

interface Review {
  id: number;
  user_id: number;
  target_id: number;
  target_type: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
  is_verified: boolean;
}

interface ReviewSectionProps {
  targetType: 'Shop' | 'Farmer' | 'Worker' | 'Rental';
  targetId: number;
  onRatingFetched?: (averageRating: number, totalCount: number) => void;
}

const BACKEND_URL = `${API_URL}/reviews`;

export default function ReviewSection({ targetType, targetId, onRatingFetched }: ReviewSectionProps) {
  const theme = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // New review form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/${targetType}/${targetId}`);
      const data = await response.json();
      if (data.success) {
        const avg = data.averageRating || 0;
        const count = data.totalCount || 0;
        setReviews(data.reviews || []);
        setAverageRating(avg);
        setTotalCount(count);
        if (onRatingFetched) {
          onRatingFetched(avg, count);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [targetType, targetId]);

  const handleSubmitReview = async () => {
    const token = storage.getString('APP_JWT_TOKEN');
    if (!token) {
      showToast('Please log in to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_id: targetId,
          target_type: targetType,
          rating,
          comment
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Review submitted successfully!');
        setComment('');
        setRating(5);
        fetchReviews(); // Refresh the list
      } else {
        showToast(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Unable to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    const initial = (item.user_name || 'U').substring(0, 2).toUpperCase();
    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          {item.user_avatar ? (
            <Avatar.Image size={36} source={{ uri: item.user_avatar }} />
          ) : (
            <Avatar.Text size={36} label={initial} />
          )}
          <View style={styles.reviewMeta}>
            <View style={styles.nameRow}>
              <Text variant="titleSmall" style={styles.userName}>{item.user_name || 'User'}</Text>
              {item.is_verified && (
                <Surface style={[styles.verifiedBadge, { backgroundColor: '#E8F5E9' }]} elevation={0}>
                  <MaterialCommunityIcons name="check-decagram" size={12} color="#4CAF50" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </Surface>
              )}
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name="star"
                  size={14}
                  color={star <= item.rating ? '#FFC107' : '#E0E0E0'}
                />
              ))}
            </View>
          </View>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.commentText}>
          {item.comment}
        </Text>
        <Divider style={styles.itemDivider} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Average Ratings Dashboard */}
      <Surface style={styles.ratingDashboard} elevation={1}>
        <View style={styles.dashboardLeft}>
          <Text variant="displayMedium" style={styles.averageBig}>{averageRating}</Text>
          <View style={styles.starsRowBig}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name="star"
                size={20}
                color={star <= Math.round(averageRating) ? '#FFC107' : '#E0E0E0'}
              />
            ))}
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Based on {totalCount} reviews
          </Text>
        </View>
      </Surface>

      {/* Review List */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Reviews ({totalCount})</Text>
      {reviews.length === 0 ? (
        <Text variant="bodyMedium" style={styles.noReviewsText}>No reviews yet. Be the first to leave one!</Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReviewItem}
          scrollEnabled={false}
        />
      )}

      {/* Write a Review Section */}
      <Surface style={styles.writeContainer} elevation={1}>
        <Text variant="titleMedium" style={styles.writeTitle}>Share Your Experience</Text>
        <View style={styles.starSelectorRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <MaterialCommunityIcons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? '#FFC107' : '#BDBDBD'}
                style={styles.starIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          placeholder="Write your review here..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          style={styles.commentInput}
        />
        <Button
          mode="contained"
          onPress={handleSubmitReview}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        >
          Submit Review
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  ratingDashboard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  dashboardLeft: {
    alignItems: 'center',
  },
  averageBig: {
    fontWeight: 'bold',
    lineHeight: 48,
  },
  starsRowBig: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noReviewsText: {
    fontStyle: 'italic',
    color: '#757575',
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewItem: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewMeta: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontWeight: '600',
    marginRight: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 2,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  commentText: {
    color: '#424242',
    lineHeight: 20,
    marginLeft: 48,
  },
  itemDivider: {
    marginTop: 12,
  },
  writeContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginTop: 24,
  },
  writeTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  starSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starIcon: {
    marginHorizontal: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    height: 80,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 8,
  },
});
