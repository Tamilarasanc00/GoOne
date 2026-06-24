import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, Image, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, ActivityIndicator, Switch, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { completeProfile, setProfileCompleted, setProfileRole, checkProfileStatus, resetProfile } from '../redux/slices/profileSlice';
import { setRole } from '../redux/slices/appSlice';
import { storage, StorageKeys } from '../services/storage';
import { showToast } from '../utils/toast';
import Geolocation from '@react-native-community/geolocation';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader } from '../components/GoOneUI';
import * as ImagePicker from 'react-native-image-picker';

export default function CreateProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const isEdit = route.params?.isEdit;

  const selectedRole = useAppSelector((state: any) => state.profile.role || state.app.role || 'customer');
  const safeRole = String(selectedRole).toLowerCase();
  const userState = useAppSelector((state: any) => state.profile.user);
  const profileState = useAppSelector((state: any) => state.profile.profile);

  // Form State
  const [form, setForm] = useState<any>({
    name: '', mobile: '', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    lat: '', lng: '',
    shopName: '', shopType: '', address: '', hours: '09:00 AM - 09:00 PM', delivery: false,
    farmName: '', farmLoc: '', crops: '', farmType: 'Organic', totalAcres: '',
    serviceType: '', experience: '', workArea: '', avail: 'Available', pricing: '',
    rentalCat: '', equipDetails: '', village: ''
  });

  const [loading, setLoading] = useState(false);
  const [modalVis, setModalVis] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dropdown State
  const [selectModalVis, setSelectModalVis] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [selectTitle, setSelectTitle] = useState('');
  const [onSelect, setOnSelect] = useState<(val: string) => void>(() => {});

  const openSelect = (title: string, options: string[], callback: (val: string) => void) => {
    setSelectTitle(title);
    setSelectOptions(options);
    setOnSelect(() => (val: string) => { callback(val); setSelectModalVis(false); });
    setSelectModalVis(true);
  };

  useEffect(() => {
    if (isEdit && userState) {
      setForm((f: any) => ({
        ...f,
        name: userState.name || '', mobile: userState.phone_number || '',
        avatar: userState.avatar || f.avatar, village: userState.village_town || '',
        lat: String(userState.latitude || ''), lng: String(userState.longitude || '')
      }));

      if (profileState) {
        if (safeRole.includes('retail')) {
          setForm((f: any) => ({ ...f, shopName: profileState.name || '', shopType: profileState.description || '', address: profileState.location || '', hours: profileState.working_hours || '09:00 AM - 09:00 PM', delivery: profileState.delivery_available === true }));
        } else if (safeRole.includes('farmer')) {
          setForm((f: any) => ({ ...f, farmName: profileState.farm_name || '', farmLoc: profileState.location || '', totalAcres: String(profileState.total_acres || ''), farmType: profileState.farming_type || 'Organic', crops: profileState.crops || '' }));
        } else if (safeRole.includes('worker')) {
          setForm((f: any) => ({ ...f, serviceType: profileState.service_category || '', experience: String(profileState.experience_years || ''), workArea: profileState.location || '', pricing: String(profileState.hourly_rate || ''), avail: profileState.availability || 'Available' }));
        } else if (safeRole.includes('rental')) {
          setForm((f: any) => ({ ...f, rentalCat: profileState.category || '', equipDetails: profileState.title || '', pricing: String(profileState.price_per_day || ''), address: profileState.location || '' }));
        }
      }
    }
  }, [isEdit, userState, profileState]);

  const handleGPS = () => {
    showToast('Fetching GPS...');
    Geolocation.getCurrentPosition(
      pos => { setForm({ ...form, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }); },
      err => { setForm({ ...form, lat: '11.6643', lng: '78.1460' }); showToast('Using default coordinates (Salem)'); },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleImagePick = (type: 'camera' | 'gallery') => {
    setUploading(true);
    const options: ImagePicker.CameraOptions | ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
    };

    const callback = (res: ImagePicker.ImagePickerResponse) => {
      setUploading(false);
      setModalVis(false);
      if (res.didCancel) return;
      if (res.errorMessage) return showToast('Error picking image');
      if (res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setForm({ ...form, avatar: `data:${asset.type};base64,${asset.base64}` });
        showToast('Photo selected');
      }
    };

    if (type === 'camera') {
      ImagePicker.launchCamera(options as ImagePicker.CameraOptions, callback);
    } else {
      ImagePicker.launchImageLibrary(options as ImagePicker.ImageLibraryOptions, callback);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: () => {
          storage.remove('APP_JWT_TOKEN');
          storage.remove(StorageKeys.USER_ROLE);
          storage.remove(StorageKeys.USER_PROFILE);
          dispatch(resetProfile());
          dispatch(setRole(null));
          showToast('Logged out successfully');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const handleSubmit = async () => {
    // Form Validation
    if (!form.name.trim()) return showToast('Full Name is required');
    if (!form.mobile.trim() || form.mobile.replace(/\D/g, '').length < 10) return showToast('Valid 10-digit Mobile Number is required');
    
    if (safeRole.includes('retail')) {
      if (!form.shopName.trim()) return showToast('Shop Name is required');
      if (!form.shopType.trim()) return showToast('Shop Category is required');
    } else if (safeRole.includes('farmer')) {
      if (!form.farmName.trim()) return showToast('Farm Name is required');
      if (!form.farmLoc.trim()) return showToast('Farm Location is required');
      if (!form.totalAcres.trim()) return showToast('Total Acres is required');
      if (!form.crops.trim()) return showToast('Main Crops are required');
    } else if (safeRole.includes('worker')) {
      if (!form.serviceType.trim()) return showToast('Service Category is required');
      if (!form.experience.trim()) return showToast('Experience in years is required');
      if (!form.pricing.trim()) return showToast('Hourly Rate is required');
    } else if (safeRole.includes('rental')) {
      if (!form.rentalCat.trim()) return showToast('Equipment Category is required');
      if (!form.equipDetails.trim()) return showToast('Equipment Name is required');
      if (!form.pricing.trim()) return showToast('Price per Day is required');
      if (!form.address.trim()) return showToast('Location is required');
    }

    setLoading(true);

    const payload: any = { role: selectedRole, name: form.name, mobile_number: form.mobile, avatar: form.avatar, latitude: parseFloat(form.lat) || null, longitude: parseFloat(form.lng) || null };

    if (selectedRole.includes('retail')) Object.assign(payload, { shop_name: form.shopName, shop_type: form.shopType, address: form.address, working_hours: form.hours, delivery_available: form.delivery });
    else if (selectedRole.includes('farmer')) Object.assign(payload, { farm_name: form.farmName, farm_location: form.farmLoc, crops: form.crops, farming_type: form.farmType, total_acres: form.totalAcres });
    else if (selectedRole.includes('worker')) Object.assign(payload, { service_type: form.serviceType, experience: form.experience, working_area: form.workArea, availability: form.avail, pricing: form.pricing || '500' });
    else if (selectedRole.includes('rental')) Object.assign(payload, { rental_category: form.rentalCat, equipment_details: form.equipDetails, pricing: form.pricing || '1000', location: form.address, availability: form.avail });
    else if (selectedRole.includes('customer')) payload.village_town = form.village;

    try {
      const res = await dispatch(completeProfile(payload));
      if (completeProfile.fulfilled.match(res)) {
        storage.set(StorageKeys.USER_ROLE, selectedRole);
        dispatch(setRole(selectedRole)); dispatch(setProfileRole(selectedRole)); dispatch(setProfileCompleted(true));
        await dispatch(checkProfileStatus());
        showToast('Profile saved!');
        if (isEdit) navigation.goBack();
        else {
          let nextScreen = 'MainTabs';
          if (safeRole.includes('retail')) nextScreen = 'RetailerDashboard';
          else if (safeRole.includes('farmer')) nextScreen = 'FarmerDashboard';
          else if (safeRole.includes('worker')) nextScreen = 'WorkerDashboard';
          else if (safeRole.includes('rental')) nextScreen = 'RentalDashboard';
          
          navigation.reset({ index: 0, routes: [{ name: nextScreen }] });
        }
      } else showToast('Failed to save profile');
    } catch { showToast('Error saving profile'); }
    finally { setLoading(false); }
  };

  const isMobileInvalid = form.mobile.trim().length > 0 && form.mobile.replace(/\D/g, '').length < 10;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('RoleSelection', ...(isEdit !== undefined ? [{ isEdit }] : []))} style={styles.backBtn}><Text style={{ fontSize: 24 }}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Profile' : 'Complete Profile'}</Text>
          {!isEdit && (
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 'auto' }}>
              <Text style={{ fontSize: 14, color: Colors.redPrimary, fontWeight: '700' }}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: form.avatar }} style={styles.avatarImg} />
          <TouchableOpacity style={styles.camBtn} onPress={() => setModalVis(true)}>
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* Core Info */}
        <SectionHeader title="Core Details" />
        <View style={styles.card}>
          <TextInput mode="outlined" label="Full Name *" value={form.name} onChangeText={t => setForm({ ...form, name: t })} style={styles.input} activeOutlineColor={Colors.bluePrimary} />
          <TextInput mode="outlined" label="Mobile Number *" value={form.mobile} onChangeText={t => setForm({ ...form, mobile: t })} keyboardType="phone-pad" style={styles.input} activeOutlineColor={Colors.bluePrimary} error={isMobileInvalid} disabled={isEdit} />
          {isMobileInvalid && <HelperText type="error" visible={isMobileInvalid}>Mobile number must be at least 10 digits</HelperText>}
        </View>


        {/* Location */}
        <SectionHeader title="Location" />
        <View style={styles.card}>
          <View style={styles.row}>
            <TextInput mode="outlined" label="Lat" value={form.lat} onChangeText={t => setForm({ ...form, lat: t })} style={[styles.input, { flex: 1, marginRight: 8 }]} activeOutlineColor={Colors.bluePrimary} />
            <TextInput mode="outlined" label="Lng" value={form.lng} onChangeText={t => setForm({ ...form, lng: t })} style={[styles.input, { flex: 1, marginLeft: 8 }]} activeOutlineColor={Colors.bluePrimary} />
          </View>
          <TouchableOpacity style={styles.gpsBtn} onPress={handleGPS}><Text style={styles.gpsTxt}>📍 Get Current GPS Location</Text></TouchableOpacity>
        </View>

        {/* Dynamic Role Fields */}
        {safeRole.includes('retail') && (
          <>
            <SectionHeader title="Shop Details" />
            <View style={styles.card}>
              <TextInput mode="outlined" label="Shop Name *" value={form.shopName} onChangeText={t => setForm({ ...form, shopName: t })} style={styles.input} activeOutlineColor={Colors.bluePrimary} />
              <TouchableOpacity onPress={() => openSelect('Shop Category', ['Grocery', 'Electronics', 'Clothing', 'Hardware', 'Pharmacy', 'Bakery', 'Other'], val => setForm({ ...form, shopType: val }))} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <TextInput mode="outlined" label="Shop Category *" value={form.shopType} style={styles.input} activeOutlineColor={Colors.bluePrimary} right={<TextInput.Icon icon="chevron-down" />} />
                </View>
              </TouchableOpacity>
              <View style={styles.switchRow}><Text style={styles.switchLbl}>Delivery Available</Text><Switch value={form.delivery} onValueChange={v => setForm({ ...form, delivery: v })} color={Colors.bluePrimary} /></View>
            </View>
          </>
        )}

        {safeRole.includes('farmer') && (
          <>
            <SectionHeader title="Farm Details" />
            <View style={styles.card}>
              <TextInput mode="outlined" label="Farm Name *" value={form.farmName} onChangeText={t => setForm({ ...form, farmName: t })} style={styles.input} activeOutlineColor={Colors.greenPrimary} />
              <TextInput mode="outlined" label="Farm Location *" value={form.farmLoc} onChangeText={t => setForm({ ...form, farmLoc: t })} style={styles.input} activeOutlineColor={Colors.greenPrimary} />
              <TextInput mode="outlined" label="Total Acres *" value={form.totalAcres} onChangeText={t => setForm({ ...form, totalAcres: t })} keyboardType="numeric" style={styles.input} activeOutlineColor={Colors.greenPrimary} />
              <TouchableOpacity onPress={() => openSelect('Main Crops', ['Rice', 'Wheat', 'Vegetables', 'Fruits', 'Sugarcane', 'Cotton', 'Mixed', 'Other'], val => setForm({ ...form, crops: val }))} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <TextInput mode="outlined" label="Main Crops *" value={form.crops} style={styles.input} activeOutlineColor={Colors.greenPrimary} right={<TextInput.Icon icon="chevron-down" />} />
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {safeRole.includes('worker') && (
          <>
            <SectionHeader title="Service Details" />
            <View style={styles.card}>
              <TouchableOpacity onPress={() => openSelect('Service Category', ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Masonry', 'Other'], val => setForm({ ...form, serviceType: val }))} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <TextInput mode="outlined" label="Service Category *" value={form.serviceType} style={styles.input} activeOutlineColor={Colors.purplePrimary} right={<TextInput.Icon icon="chevron-down" />} />
                </View>
              </TouchableOpacity>
              <TextInput mode="outlined" label="Experience (Years) *" value={form.experience} onChangeText={t => setForm({ ...form, experience: t })} keyboardType="numeric" style={styles.input} activeOutlineColor={Colors.purplePrimary} />
              <TextInput mode="outlined" label="Hourly Rate (₹) *" value={form.pricing} onChangeText={t => setForm({ ...form, pricing: t })} keyboardType="numeric" style={styles.input} activeOutlineColor={Colors.purplePrimary} />
              <TextInput mode="outlined" label="Working Area" value={form.workArea} onChangeText={t => setForm({ ...form, workArea: t })} style={styles.input} activeOutlineColor={Colors.purplePrimary} />
            </View>
          </>
        )}

        {safeRole.includes('rental') && (
          <>
            <SectionHeader title="Rental Details" />
            <View style={styles.card}>
              <TouchableOpacity onPress={() => openSelect('Equipment Category', ['Tractor', 'Harvester', 'Water Pump', 'Power Tools', 'Construction', 'Other'], val => setForm({ ...form, rentalCat: val }))} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <TextInput mode="outlined" label="Equipment Category *" value={form.rentalCat} style={styles.input} activeOutlineColor={Colors.amberPrimary} right={<TextInput.Icon icon="chevron-down" />} />
                </View>
              </TouchableOpacity>
              <TextInput mode="outlined" label="Equipment Name/Details *" value={form.equipDetails} onChangeText={t => setForm({ ...form, equipDetails: t })} style={styles.input} activeOutlineColor={Colors.amberPrimary} />
              <TextInput mode="outlined" label="Price per Day (₹) *" value={form.pricing} onChangeText={t => setForm({ ...form, pricing: t })} keyboardType="numeric" style={styles.input} activeOutlineColor={Colors.amberPrimary} />
              <TextInput mode="outlined" label="Location *" value={form.address} onChangeText={t => setForm({ ...form, address: t })} style={styles.input} activeOutlineColor={Colors.amberPrimary} />
            </View>
          </>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitTxt}>{isEdit ? 'Save Changes' : 'Complete Profile'}</Text>}
        </TouchableOpacity>

      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={modalVis} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload Photo</Text>
            {uploading ? <ActivityIndicator size="large" color={Colors.bluePrimary} /> : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => handleImagePick('camera')}><Text style={{ fontSize: 32 }}>📷</Text><Text style={styles.modalBtnTxt}>Camera</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalBtn} onPress={() => handleImagePick('gallery')}><Text style={{ fontSize: 32 }}>🖼️</Text><Text style={styles.modalBtnTxt}>Gallery</Text></TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVis(false)}><Text style={styles.closeTxt}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Select Modal */}
      <Modal visible={selectModalVis} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select {selectTitle}</Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              {selectOptions.map((opt, i) => (
                <TouchableOpacity key={i} style={styles.optionRow} onPress={() => onSelect(opt)}>
                  <Text style={styles.optionTxt}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectModalVis(false)}><Text style={styles.closeTxt}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { paddingRight: Spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },

  avatarWrap: { alignItems: 'center', marginVertical: Spacing.lg },
  avatarImg: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.border },
  camBtn: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: Colors.white, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4 },

  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  input: { backgroundColor: Colors.white, marginBottom: 12, fontSize: 14 },
  row: { flexDirection: 'row' },
  gpsBtn: { backgroundColor: Colors.blueSoft, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  gpsTxt: { fontSize: 13, fontWeight: '700', color: Colors.bluePrimary },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLbl: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  submitBtn: { backgroundColor: Colors.bluePrimary, borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  submitTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 },
  modalBtn: { alignItems: 'center' },
  modalBtnTxt: { marginTop: 8, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  closeBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.bgLight },
  closeTxt: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  optionRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionTxt: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
});
