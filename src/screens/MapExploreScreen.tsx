import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, useTheme, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { requestLocationPermission, getCurrentLocation, LocationCoordinates, calculateHumanDistance } from '../utils/locationUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Sankarapuram Center Default
const DEFAULT_LOCATION: LocationCoordinates = { latitude: 11.884, longitude: 79.006 };

type FilterType = 'All' | 'Shops' | 'Workers' | 'Rentals' | 'Farmers';

// Mock Data Points
const MOCK_LOCATIONS = [
  { id: '1', type: 'Shops', name: 'Sri Murugan Groceries', lat: 11.885, lng: 79.007, icon: 'store' },
  { id: '2', type: 'Shops', name: 'Kisan Fertiliziers', lat: 11.882, lng: 79.004, icon: 'store' },
  { id: '3', type: 'Workers', name: 'Ramesh (Plumber)', lat: 11.886, lng: 79.002, icon: 'tools' },
  { id: '4', type: 'Rentals', name: 'Tractor Rental', lat: 11.889, lng: 79.008, icon: 'tractor' },
  { id: '5', type: 'Farmers', name: 'Velu Farm (Tomatoes)', lat: 11.881, lng: 79.011, icon: 'sprout' },
];

const MapExploreScreen = () => {
  const theme = useTheme();
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  useEffect(() => {
    initLocation();
  }, []);

  const initLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        const coords = await getCurrentLocation();
        setUserLocation(coords);
      } else {
        // Fallback to default if denied
        setUserLocation(DEFAULT_LOCATION);
        Alert.alert('Permission Denied', 'Showing default location. Enable location services in settings for accurate distances.');
      }
    } catch (e) {
      setUserLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (type: string) => {
    switch(type) {
      case 'Shops': return theme.colors.primary;
      case 'Workers': return '#FF9800'; // Orange
      case 'Rentals': return '#9C27B0'; // Purple
      case 'Farmers': return '#4CAF50'; // Green
      default: return theme.colors.primary;
    }
  };

  const filteredLocations = MOCK_LOCATIONS.filter(loc => activeFilter === 'All' || loc.type === activeFilter);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initialRegion = {
    latitude: userLocation?.latitude || DEFAULT_LOCATION.latitude,
    longitude: userLocation?.longitude || DEFAULT_LOCATION.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Filter Chips Bar */}
      <Surface style={styles.filterBar} elevation={2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'Shops', 'Workers', 'Rentals', 'Farmers'].map((filter) => (
            <Chip 
              key={filter}
              selected={activeFilter === filter}
              onPress={() => setActiveFilter(filter as FilterType)}
              style={styles.chip}
              mode={activeFilter === filter ? 'flat' : 'outlined'}
            >
              {filter}
            </Chip>
          ))}
        </ScrollView>
      </Surface>

      {/* Map View */}
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false} // We can build a custom one
      >
        {filteredLocations.map(marker => {
          const dist = userLocation ? calculateHumanDistance(userLocation, { latitude: marker.lat, longitude: marker.lng }) : 'Unknown';
          return (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              pinColor={getMarkerColor(marker.type)}
            >
              <Callout tooltip>
                <Surface style={styles.calloutContainer} elevation={4}>
                  <Text variant="titleSmall" style={styles.calloutTitle}>{marker.name}</Text>
                  <Text variant="bodySmall" style={styles.calloutType}>{marker.type}</Text>
                  <View style={styles.distanceRow}>
                    <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={styles.distanceText}>{dist} away</Text>
                  </View>
                </Surface>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Recenter Button */}
      <Surface style={styles.recenterButton} elevation={4}>
        <IconButton 
          icon="crosshairs-gps" 
          iconColor={theme.colors.primary} 
          size={24} 
          onPress={() => initLocation()} // In a real app, use mapRef.animateToRegion
        />
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  filterBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 10,
    right: 10,
    zIndex: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  filterScroll: {
    padding: 10,
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  calloutContainer: {
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
  },
  calloutType: {
    color: '#666',
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    marginLeft: 4,
    color: '#2196F3',
    fontWeight: '600'
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    backgroundColor: 'white',
  }
});

export default MapExploreScreen;
