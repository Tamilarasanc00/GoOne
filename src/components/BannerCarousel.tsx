import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Image, Dimensions, Animated } from 'react-native';
import { API_URL } from '../config/apiConfig';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 32; // Full width with margins

interface Banner {
  id: number;
  image_url: string;
  link_url?: string;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fetch banners from backend
    fetch(`${API_URL}/banners`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.banners) {
          setBanners(data.banners);
        }
      })
      .catch(err => {
        console.error('Error loading banners, loading default placeholder slides', err);
        // Load offline slides if backend fails
        setBanners([
          { id: 1, image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80' },
          { id: 2, image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80' },
          { id: 3, image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80' },
        ]);
      });
  }, []);

  // Auto scroll logic
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 3000); // Scroll every 3 seconds

    return () => clearInterval(interval);
  }, [activeIndex, banners]);

  const handleMomentumScrollEnd = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / CAROUSEL_WIDTH);
    setActiveIndex(index);
  };

  const renderItem = ({ item }: { item: Banner }) => (
    <View style={styles.slideWrapper}>
      <Image source={{ uri: item.image_url }} style={styles.bannerImage} resizeMode="cover" />
    </View>
  );

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        snapToInterval={CAROUSEL_WIDTH}
        decelerationRate="fast"
      />
      {/* Dot Indicators */}
      <View style={styles.indicatorsRow}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex ? '#0066FF' : '#E0E0E0',
                width: index === activeIndex ? 18 : 6,
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: 'center',
  },
  slideWrapper: {
    width: CAROUSEL_WIDTH,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
