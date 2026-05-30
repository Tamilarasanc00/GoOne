import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import RetailShopListingScreen from '../screens/RetailShopListingScreen';
import FarmerMarketplaceScreen from '../screens/FarmerMarketplaceScreen';
import ServiceWorkerListingScreen from '../screens/ServiceWorkerListingScreen';
import RentalMarketplaceScreen from '../screens/RentalMarketplaceScreen';
import DailyWageJobListingScreen from '../screens/DailyWageJobListingScreen';
import NearbyHelpScreen from '../screens/NearbyHelpScreen';
import RetailerDashboardScreen from '../screens/RetailerDashboardScreen';
import AddProductScreen from '../screens/AddProductScreen';
import WorkerDetailsScreen from '../screens/WorkerDetailsScreen';
import ShopDetailsScreen from '../screens/ShopDetailsScreen';
import MainTabNavigator from './MainTabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import { storage, StorageKeys } from '../services/storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const hasSelectedLanguage = storage.getString(StorageKeys.LANGUAGE) !== undefined;

  return (
    <Stack.Navigator 
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade', // Add a nice fade transition from splash
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="RetailShopListing" component={RetailShopListingScreen} />
      <Stack.Screen name="FarmerMarketplace" component={FarmerMarketplaceScreen} />
      <Stack.Screen name="ServiceWorkerListing" component={ServiceWorkerListingScreen} />
      <Stack.Screen name="RentalMarketplace" component={RentalMarketplaceScreen} />
      <Stack.Screen name="DailyWageJobListing" component={DailyWageJobListingScreen} />
      <Stack.Screen name="NearbyHelp" component={NearbyHelpScreen} />
      <Stack.Screen name="RetailerDashboard" component={RetailerDashboardScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="WorkerDetails" component={WorkerDetailsScreen} />
      <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
