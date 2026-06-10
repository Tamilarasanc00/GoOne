import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/redux/store';
import { useAppSelector } from './src/redux/hooks';
import { lightTheme, darkTheme } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';

import './src/localization/i18n'; // Initialize i18n
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

MaterialCommunityIcons.loadFont(); // Load fonts for iOS

import { syncService } from './src/services/syncService';
import OfflineBanner from './src/components/OfflineBanner';

import { navigationRef } from './src/navigation/navigationRef';

function RootApp() {
  const isDarkMode = useAppSelector((state) => state.app.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  React.useEffect(() => {
    syncService.init();
    return () => syncService.destroy();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
        <OfflineBanner />
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <RootApp />
      </Provider>
    </SafeAreaProvider>
  );
}
