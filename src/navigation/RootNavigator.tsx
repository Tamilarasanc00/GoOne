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
import FarmerDashboardScreen from '../screens/FarmerDashboardScreen';
import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';
import RentalDashboardScreen from '../screens/RentalDashboardScreen';
import AddProductScreen from '../screens/AddProductScreen';
import AddCropScreen from '../screens/AddCropScreen';
import AddRentalScreen from '../screens/AddRentalScreen';
import AddOfferScreen from '../screens/AddOfferScreen';
import WorkerDetailsScreen from '../screens/WorkerDetailsScreen';
import ShopDetailsScreen from '../screens/ShopDetailsScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';
import EmployerDashboardScreen from '../screens/EmployerDashboardScreen';
import AddJobScreen from '../screens/AddJobScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
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
      <Stack.Screen name="FarmerDashboard" component={FarmerDashboardScreen} />
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} />
      <Stack.Screen name="RentalDashboard" component={RentalDashboardScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="AddCrop" component={AddCropScreen} />
      <Stack.Screen name="AddRental" component={AddRentalScreen} />
      <Stack.Screen name="AddOffer" component={AddOfferScreen} />
      <Stack.Screen name="WorkerDetails" component={WorkerDetailsScreen} />
      <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="EmployerDashboard" component={EmployerDashboardScreen} />
      <Stack.Screen name="AddJob" component={AddJobScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}
