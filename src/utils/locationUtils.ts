import Geolocation from '@react-native-community/geolocation';
import { getDistance, convertDistance } from 'geolib';
import { PermissionsAndroid, Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    Geolocation.requestAuthorization();
    return true; // We assume true for simplicity, handle properly in prod
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'GoOne needs access to your location to show nearby services.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

/**
 * Calculates human readable distance
 * @param start User's location
 * @param end Target location
 * @returns string like "1.2 km" or "500 m"
 */
export const calculateHumanDistance = (start: LocationCoordinates, end: LocationCoordinates): string => {
  const distanceInMeters = getDistance(start, end);
  if (distanceInMeters < 1000) {
    return `${distanceInMeters} m`;
  }
  const distanceInKm = convertDistance(distanceInMeters, 'km');
  return `${distanceInKm.toFixed(1)} km`;
};
