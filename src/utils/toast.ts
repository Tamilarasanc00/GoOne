import { ToastAndroid, Platform } from 'react-native';

export const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    console.log(`[Toast] ${message}`);
  }
};
