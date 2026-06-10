import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Surface, TextInput, Button, Switch, useTheme, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { completeProfile, setProfileCompleted, setProfileRole } from '../redux/slices/profileSlice';
import { setRole } from '../redux/slices/appSlice';
import { storage, StorageKeys } from '../services/storage';
import { showToast } from '../utils/toast';
import Geolocation from '@react-native-community/geolocation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CreateProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  // Route Params
  const isEdit = route.params?.isEdit;

  // Retrieve current selected role from Redux or fallback to 'customer'
  const selectedRole = useAppSelector((state) => state.profile.role || state.app.role || 'customer');
  const userState = useAppSelector((state) => state.profile.user);
  const profileState = useAppSelector((state) => state.profile.profile);

  // Core Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
  
  // Location Coordinates Fields
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Role-Specific Fields: Retail Shop
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 09:00 PM');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);

  // Role-Specific Fields: Farmer
  const [farmLocation, setFarmLocation] = useState('');
  const [crops, setCrops] = useState('');
  const [farmingType, setFarmingType] = useState('Organic');

  // Role-Specific Fields: Service Worker
  const [serviceType, setServiceType] = useState('');
  const [experience, setExperience] = useState('');
  const [workingArea, setWorkingArea] = useState('');
  const [availability, setAvailability] = useState('Available');

  // Role-Specific Fields: Rental Owner
  const [rentalCategory, setRentalCategory] = useState('');
  const [equipmentDetails, setEquipmentDetails] = useState('');
  const [pricing, setPricing] = useState('');

  // Role-Specific Fields: Customer
  const [villageTown, setVillageTown] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load existing details if in Edit Mode
  useEffect(() => {
    if (isEdit && userState) {
      setName(userState.name || '');
      setMobile(userState.phone_number || '');
      if (userState.avatar) {
        setProfilePhoto(userState.avatar);
      }
      if (userState.village_town) {
        setVillageTown(userState.village_town);
      }
      if (userState.latitude) {
        setLatitude(String(userState.latitude));
      }
      if (userState.longitude) {
        setLongitude(String(userState.longitude));
      }

      // Prepopulate Role specific fields
      if ((selectedRole === 'retail_shop' || selectedRole === 'Retailer') && profileState) {
        setShopName(profileState.name || '');
        setShopType(profileState.description || '');
        setAddress(profileState.location || '');
      } else if ((selectedRole === 'farmer' || selectedRole === 'Farmer') && profileState) {
        setFarmLocation(profileState.location || '');
        setFarmingType(profileState.farming_type || 'Organic');
      } else if ((selectedRole === 'service_worker' || selectedRole === 'Service Worker') && profileState) {
        setServiceType(profileState.service_category || '');
        setExperience(String(profileState.experience_years || ''));
        setWorkingArea(profileState.location || '');
      } else if ((selectedRole === 'rental_owner' || selectedRole === 'Rental Owner') && profileState) {
        setRentalCategory(profileState.category || '');
        setEquipmentDetails(profileState.title || '');
        setPricing(String(profileState.price_per_day || ''));
      }
      showToast('Loaded profile details');
    }
  }, [isEdit, userState, profileState]);

  // GPS Geolocation Handler
  const handleGetCurrentLocation = () => {
    showToast('Fetching GPS coordinates...');
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude.toFixed(6));
        setLongitude(longitude.toFixed(6));
        showToast(`GPS Location fetched: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        // Fallback simulated location values (Salem, Tamil Nadu coordinates)
        const mockLat = 11.6643;
        const mockLng = 78.1460;
        setLatitude(String(mockLat));
        setLongitude(String(mockLng));
        showToast('Using simulated GPS coordinates (Salem, TN)');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
    );
  };

  // Image Upload Simulation Workflow
  const startSimulatedUpload = (type: 'camera' | 'gallery' | 'preset') => {
    if (type === 'preset') {
      const presetUrl = selectedRole === 'retail_shop' || selectedRole === 'Retailer'
        ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      setProfilePhoto(presetUrl);
      setImageModalVisible(false);
      showToast('Preset profile photo applied');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    showToast(type === 'camera' ? 'Opening Camera...' : 'Opening Gallery...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const uploadedUrl = type === 'camera'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
          
          setProfilePhoto(uploadedUrl);
          setUploading(false);
          setImageModalVisible(false);
          showToast('Image uploaded successfully!');
        }, 300);
      }
    }, 150);
  };

  const handleSubmit = async () => {
    if (!name || !mobile) {
      showToast('Please enter Name and Mobile');
      Alert.alert('Required Fields', 'Please enter at least Name and Mobile Number.');
      return;
    }

    setLoading(true);
    showToast('Saving profile details...');
    
    // Prepare payload dynamically depending on role
    const payload: any = {
      role: selectedRole,
      name,
      mobile_number: mobile,
      avatar: profilePhoto,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    };

    if (selectedRole === 'retail_shop' || selectedRole === 'Retailer') {
      payload.shop_name = shopName;
      payload.shop_type = shopType;
      payload.address = address;
      payload.working_hours = workingHours;
      payload.delivery_available = deliveryAvailable;
    } else if (selectedRole === 'farmer' || selectedRole === 'Farmer') {
      payload.farm_location = farmLocation;
      payload.crops = crops;
      payload.farming_type = farmingType;
    } else if (selectedRole === 'service_worker' || selectedRole === 'Service Worker') {
      payload.service_type = serviceType;
      payload.experience = experience;
      payload.working_area = workingArea;
      payload.availability = availability;
      payload.pricing = pricing || '500';
    } else if (selectedRole === 'rental_owner' || selectedRole === 'Rental Owner') {
      payload.rental_category = rentalCategory;
      payload.equipment_details = equipmentDetails;
      payload.pricing = pricing || '1000';
      payload.availability = availability;
    } else if (selectedRole === 'customer' || selectedRole === 'Customer') {
      payload.village_town = villageTown;
    }

    try {
      const resultAction = await dispatch(completeProfile(payload));
      if (completeProfile.fulfilled.match(resultAction)) {
        showToast('Profile saved successfully!');
        
        // Ensure MMKV and Redux states sync local user role
        storage.set(StorageKeys.USER_ROLE, selectedRole);
        dispatch(setRole(selectedRole));
        dispatch(setProfileRole(selectedRole));
        dispatch(setProfileCompleted(true));

        if (isEdit) {
          // If editing, navigate back
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.replace(selectedRole === 'retail_shop' || selectedRole === 'Retailer' ? 'RetailerDashboard' : 'MainTabs');
          }
        } else {
          // If initial sign up complete, redirect
          if (selectedRole === 'retail_shop' || selectedRole === 'Retailer') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'RetailerDashboard' }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }
        }
      } else {
        showToast('Failed to save profile');
      }
    } catch (e) {
      showToast('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(isEdit ? 'RetailerDashboard' : 'RoleSelection');
            }
          }}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerRowTitle}>
          {isEdit ? 'Edit Shop Settings' : 'Profile Settings'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {isEdit ? 'Update Shop Info' : 'Complete Profile'}
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            Setup details for {selectedRole.toUpperCase().replace('_', ' ')}
          </Text>
        </View>

        {/* Avatar preview block */}
        <Surface style={styles.avatarSection} elevation={1}>
          <Avatar.Image size={90} source={{ uri: profilePhoto }} />
          <Button 
            mode="contained-tonal" 
            onPress={() => setImageModalVisible(true)} 
            style={{ marginTop: 12, borderRadius: 10 }}
            icon="camera-outline"
          >
            Upload Cover/Avatar
          </Button>
        </Surface>

        {/* Universal fields */}
        <Surface style={styles.formCard} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Core Details</Text>
          <TextInput
            label="Name / Owner Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
        </Surface>

        {/* Geolocation Section */}
        <Surface style={styles.formCard} elevation={1}>
          <Text variant="titleMedium" style={styles.cardHeader}>Location Coordinates</Text>
          
          <View style={styles.coordinateRow}>
            <TextInput
              label="Latitude"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, styles.coordinateInput]}
            />
            <TextInput
              label="Longitude"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, styles.coordinateInput]}
            />
          </View>

          <Button
            mode="contained-tonal"
            icon="crosshairs-gps"
            onPress={handleGetCurrentLocation}
            style={styles.gpsButton}
          >
            Get GPS Current Location
          </Button>
        </Surface>

        {/* Dynamic Fields */}
        {(selectedRole === 'retail_shop' || selectedRole === 'Retailer') && (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.cardHeader}>Shop Details</Text>
            <TextInput
              label="Shop Name"
              value={shopName}
              onChangeText={setShopName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Shop Type (e.g. Grocery, Fertilizer)"
              value={shopType}
              onChangeText={setShopType}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Working Hours"
              value={workingHours}
              onChangeText={setWorkingHours}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ fontWeight: '500' }}>Delivery Available</Text>
              <Switch value={deliveryAvailable} onValueChange={setDeliveryAvailable} />
            </View>
          </Surface>
        )}

        {(selectedRole === 'farmer' || selectedRole === 'Farmer') && (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.cardHeader}>Farm Profile</Text>
            <TextInput
              label="Farm Location"
              value={farmLocation}
              onChangeText={setFarmLocation}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Crops Grown (comma separated)"
              value={crops}
              onChangeText={setCrops}
              placeholder="e.g. Rice, Sugarcane"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Farming Type (e.g. Organic, Commercial)"
              value={farmingType}
              onChangeText={setFarmingType}
              mode="outlined"
              style={styles.input}
            />
          </Surface>
        )}

        {(selectedRole === 'service_worker' || selectedRole === 'Service Worker') && (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.cardHeader}>Work Profile</Text>
            <TextInput
              label="Service Type (e.g. Plumber, Electrician)"
              value={serviceType}
              onChangeText={setServiceType}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Years of Experience"
              value={experience}
              onChangeText={setExperience}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Working Area / Radius"
              value={workingArea}
              onChangeText={setWorkingArea}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Rate per hour / day (₹)"
              value={pricing}
              onChangeText={setPricing}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          </Surface>
        )}

        {(selectedRole === 'rental_owner' || selectedRole === 'Rental Owner') && (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.cardHeader}>Rental Hub Profile</Text>
            <TextInput
              label="Rental Category (e.g. Tractor, Harvester)"
              value={rentalCategory}
              onChangeText={setRentalCategory}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Vehicle / Equipment Details"
              value={equipmentDetails}
              onChangeText={setEquipmentDetails}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Pricing per day (₹)"
              value={pricing}
              onChangeText={setPricing}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          </Surface>
        )}

        {(selectedRole === 'customer' || selectedRole === 'Customer') && (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.cardHeader}>Personal Settings</Text>
            <TextInput
              label="Village / Town Name"
              value={villageTown}
              onChangeText={setVillageTown}
              mode="outlined"
              style={styles.input}
            />
          </Surface>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
          contentStyle={{ height: 50 }}
        >
          {isEdit ? 'Save Changes' : 'Save & Complete'}
        </Button>
      </ScrollView>

      {/* Image Upload Modal Drawer */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Upload Photo
            </Text>
            
            {uploading ? (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.progressText}>
                  Uploading image: {uploadProgress}%
                </Text>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => startSimulatedUpload('camera')}
                >
                  <MaterialCommunityIcons name="camera" size={32} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => startSimulatedUpload('gallery')}
                >
                  <MaterialCommunityIcons name="image-multiple" size={32} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => startSimulatedUpload('preset')}
                >
                  <MaterialCommunityIcons name="image-search-outline" size={32} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonText}>Use Preset</Text>
                </TouchableOpacity>
              </View>
            )}

            <Button 
              mode="outlined" 
              disabled={uploading} 
              onPress={() => setImageModalVisible(false)}
              style={styles.closeBtn}
            >
              Cancel
            </Button>
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerRowTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  avatarSection: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  formCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginBottom: 20,
  },
  cardHeader: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    width: '48%',
  },
  gpsButton: {
    borderRadius: 10,
    marginTop: 4,
    paddingVertical: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  submitBtn: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  
  // Image modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 16,
  },
  uploadButtonText: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  progressText: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  closeBtn: {
    borderRadius: 10,
    marginTop: 10,
  },
});
