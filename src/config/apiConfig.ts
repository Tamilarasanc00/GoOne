import { Platform } from 'react-native';

// Set your machine's Wi-Fi IP address for physical device and emulator testing
const LOCAL_HOST = 'http://172.23.233.148:5000';

// In React Native, __DEV__ is automatically true in development builds 
// and automatically false in production release builds (APK/AAB/IPA)
export const BASE_URL = __DEV__
  ? LOCAL_HOST
  : 'https://goonebackend.onrender.com'; // Production SSL server

export const API_URL = `${BASE_URL}/api`;
