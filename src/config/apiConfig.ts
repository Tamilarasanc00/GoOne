import { Platform } from 'react-native';

// --- CHOOSE ONE CONNECTION METHOD BELOW ---

// METHOD 1: For Android Emulator (Recommended)
// 10.0.2.2 is a special alias to your host loopback interface (127.0.0.1)
// const LOCAL_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// METHOD 2: For Physical Android Device via USB Cable
// Run this command in terminal first: adb reverse tcp:5000 tcp:5000
// METHOD 3: For Physical Android Device via Wi-Fi (Your current setup)
// Note: Windows Firewall MUST be configured to allow port 5000!
const LOCAL_HOST = Platform.OS === 'android' ? 'http://10.203.132.87:5000' : 'http://10.203.132.87:5000';

// In React Native, __DEV__ is automatically true in development builds 
// and automatically false in production release builds (APK/AAB/IPA)
export const BASE_URL = __DEV__
  ? LOCAL_HOST
  : 'https://goonebackend.onrender.com'; // Production SSL server

export const API_URL = `${BASE_URL}/api`;
