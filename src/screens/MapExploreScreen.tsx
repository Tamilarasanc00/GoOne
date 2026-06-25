import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requestLocationPermission, getCurrentLocation, LocationCoordinates, calculateHumanDistance } from '../utils/locationUtils';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { showToast } from '../utils/toast';
import { apiService } from '../services/apiService';

const DEFAULT_LOCATION: LocationCoordinates = { latitude: 11.884, longitude: 79.006 };

type FilterType = 'All' | 'Shops' | 'Workers' | 'Rentals' | 'Farmers';

type MapMarker = {
  id: string;
  type: FilterType;
  name: string;
  lat: number;
  lng: number;
  emoji: string;
  color: string;
};

// MOCK_LOCATIONS removed

const FILTERS: { name: FilterType; emoji: string }[] = [
  { name: 'All', emoji: '🗺️' },
  { name: 'Shops', emoji: '🏪' },
  { name: 'Workers', emoji: '🔧' },
  { name: 'Rentals', emoji: '🚜' },
  { name: 'Farmers', emoji: '🌾' },
];

export default function MapExploreScreen() {
  const [userLoc, setUserLoc] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [apiLocations, setApiLocations] = useState<MapMarker[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initLocation();
  }, []);

  useEffect(() => {
    if (userLoc) {
      fetchMapData(userLoc);
    }
  }, [userLoc]);

  const fetchMapData = async (coords: LocationCoordinates) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        apiService.shops.getNearby(coords.latitude, coords.longitude),
        apiService.workers.list(),
        apiService.rentals.list(),
        apiService.crops.list()
      ]);

      const markers: MapMarker[] = [];

      // Helper to generate a random slight offset for demo purposes if coordinates are null
      const offsetCoord = (base: number) => base + (Math.random() - 0.5) * 0.02;

      const parseCoord = (val: any, fallback: number) => {
        if (!val) return offsetCoord(fallback);
        const parsed = parseFloat(val);
        return isNaN(parsed) ? offsetCoord(fallback) : parsed;
      };

      if (results[0].status === 'fulfilled' && results[0].value.success) {
        results[0].value.shops.forEach((s: any) => {
          markers.push({
            id: `shop_${s.id}`, type: 'Shops', name: s.name,
            lat: parseCoord(s.latitude, coords.latitude),
            lng: parseCoord(s.longitude, coords.longitude),
            emoji: '🏪', color: Colors.bluePrimary
          });
        });
      }

      if (results[1].status === 'fulfilled' && results[1].value.success) {
        results[1].value.workers.forEach((w: any) => {
          markers.push({
            id: `worker_${w.id}`, type: 'Workers', name: w.name,
            lat: parseCoord(w.latitude, coords.latitude),
            lng: parseCoord(w.longitude, coords.longitude),
            emoji: '🔧', color: Colors.purplePrimary
          });
        });
      }

      if (results[2].status === 'fulfilled' && results[2].value.success) {
        results[2].value.rentals.forEach((r: any) => {
          markers.push({
            id: `rental_${r.id}`, type: 'Rentals', name: r.name,
            lat: parseCoord(r.latitude, coords.latitude),
            lng: parseCoord(r.longitude, coords.longitude),
            emoji: '🚜', color: Colors.amberPrimary
          });
        });
      }

      if (results[3].status === 'fulfilled' && results[3].value.success) {
        results[3].value.crops.forEach((c: any) => {
          markers.push({
            id: `crop_${c.id}`, type: 'Farmers', name: c.farmerName,
            lat: parseCoord(c.latitude, coords.latitude),
            lng: parseCoord(c.longitude, coords.longitude),
            emoji: '🌾', color: Colors.greenPrimary
          });
        });
      }

      setApiLocations(markers);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initLocation = async () => {
    setLoading(true);
    // Set default location immediately to bypass the long loading screen
    setUserLoc(DEFAULT_LOCATION);
    try {
      const ok = await requestLocationPermission();
      if (ok) {
        const coords = await getCurrentLocation();
        setUserLoc(coords);
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      } else {
        Alert.alert('Permission Denied', 'Showing default location. Enable location for accurate distances.');
      }
      
      mapRef.current?.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
      
    } catch {
      // Keep DEFAULT_LOCATION if fetching fails
    }
  };

  const filteredLocations = apiLocations.filter(l => activeFilter === 'All' || l.type === activeFilter);

  if (loading && !userLoc) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={Colors.bluePrimary} />
        <Text style={styles.loaderTxt}>Finding your location...</Text>
      </View>
    );
  }

  const region = {
    latitude: userLoc?.latitude || DEFAULT_LOCATION.latitude,
    longitude: userLoc?.longitude || DEFAULT_LOCATION.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredLocations.map(marker => {
          const dist = userLoc ? calculateHumanDistance(userLoc, { latitude: marker.lat, longitude: marker.lng }) : '?';
          return (
            <Marker key={marker.id} coordinate={{ latitude: marker.lat, longitude: marker.lng }}>
              {/* Custom Marker */}
              <View style={[styles.markerPin, { backgroundColor: marker.color }]}>
                <Text style={{ fontSize: 16 }}>{marker.emoji}</Text>
              </View>
              <View style={[styles.markerTriangle, { borderTopColor: marker.color }]} />

              <Callout tooltip onPress={() => {
                if (marker.type === 'Shops') {
                  const id = marker.id.split('_')[1];
                  navigation.navigate('ShopDetails', { shopId: id, shopName: marker.name });
                } else if (marker.type === 'Workers') {
                  const id = marker.id.split('_')[1];
                  navigation.navigate('WorkerDetails', { workerId: id, workerName: marker.name });
                } else if (marker.type === 'Rentals') {
                  navigation.navigate('RentalMarketplace');
                } else if (marker.type === 'Farmers') {
                  navigation.navigate('FarmerMarketplace');
                } else {
                  showToast(`View details for ${marker.name}`);
                }
              }}>
                <View style={styles.calloutCard}>
                  <Text style={styles.calloutEmoji}>{marker.emoji}</Text>
                  <View style={styles.calloutInfo}>
                    <Text style={styles.calloutTitle}>{marker.name}</Text>
                    <Text style={styles.calloutType}>{marker.type}</Text>
                    <Text style={styles.calloutDist}>📍 {dist} away</Text>
                  </View>
                  <Text style={styles.calloutArrow}>›</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Filter Bar */}
      <View style={styles.topBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.name;
            return (
              <TouchableOpacity
                key={f.name}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.name)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterChipEmoji}>{f.emoji}</Text>
                <Text style={[styles.filterChipTxt, isActive && styles.filterChipTxtActive]}>{f.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Recenter Btn */}
      <TouchableOpacity style={styles.recenterBtn} onPress={initLocation} activeOpacity={0.8}>
        <Text style={{ fontSize: 24 }}>🧭</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderTxt: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  map: { width: '100%', height: '100%', position: 'absolute' },

  topBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 0, right: 0,
    zIndex: 10,
  },
  filterScroll: { paddingHorizontal: Spacing.md, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4,
  },
  filterChipActive: { backgroundColor: Colors.bluePrimary },
  filterChipEmoji: { fontSize: 16 },
  filterChipTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  filterChipTxtActive: { color: Colors.white },

  recenterBtn: {
    position: 'absolute', bottom: 100, right: 20, zIndex: 10,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, elevation: 6,
  },

  markerPin: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3,
  },
  markerTriangle: {
    width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 0, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    alignSelf: 'center', marginTop: -2,
  },

  calloutCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, minWidth: 200, gap: 12,
  },
  calloutEmoji: { fontSize: 28 },
  calloutInfo: { flex: 1 },
  calloutTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  calloutType: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  calloutDist: { fontSize: 11, fontWeight: '700', color: Colors.bluePrimary, marginTop: 4 },
  calloutArrow: { fontSize: 24, color: Colors.textMuted },
});
