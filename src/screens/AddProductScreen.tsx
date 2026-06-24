import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/apiService';
import { useAppSelector } from '../redux/hooks';
import { showToast } from '../utils/toast';
import { syncService } from '../services/syncService';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader } from '../components/GoOneUI';
import { launchCamera, launchImageLibrary, MediaType, PhotoQuality } from 'react-native-image-picker';
import { BASE_URL } from '../config/apiConfig';

interface CategoryItem {
  name: string;
  subcategories: string[];
}

const CATEGORIES_BY_ROLE: Record<string, CategoryItem[]> = {
  'Retailer': [
    {
      name: 'Clothing (Cloth)',
      subcategories: ['Shirt', 'Pant', 'Saree', 'T-Shirt', 'Kurta', 'Jeans', 'Dhoti', 'Skirt']
    },
    {
      name: 'Electronics',
      subcategories: ['Mobile', 'Laptop', 'Headphones', 'Charger', 'Smartwatch', 'Power Bank']
    },
    {
      name: 'Groceries',
      subcategories: ['Rice', 'Sunflower Oil', 'Wheat Flour', 'Sugar', 'Spices', 'Dhal']
    },
    {
      name: 'Footwear',
      subcategories: ['Shoes', 'Sandals', 'Slippers']
    },
    {
      name: 'Home Appliances',
      subcategories: ['Fan', 'Electric Kettle', 'Mixer Grinder', 'Iron Box']
    }
  ],
  'Farmer': [
    {
      name: 'Vegetables',
      subcategories: ['Tomatoes', 'Onions', 'Potatoes', 'Carrots', 'Beans', 'Green Chillies']
    },
    {
      name: 'Fruits',
      subcategories: ['Banana', 'Apples', 'Mangoes', 'Watermelon', 'Papaya', 'Guava']
    },
    {
      name: 'Grains',
      subcategories: ['Paddy', 'Wheat', 'Maize', 'Ragi']
    },
    {
      name: 'Dairy & Poultry',
      subcategories: ['Milk', 'Fresh Eggs', 'Butter', 'Organic Ghee']
    }
  ],
  'Rental Owner': [
    {
      name: 'Machinery',
      subcategories: ['Tractor', 'Harvester', 'Power Tiller', 'JCB']
    },
    {
      name: 'Tools',
      subcategories: ['Drill Machine', 'Chainsaw', 'Water Pump', 'Electric Cutter']
    },
    {
      name: 'Vehicles',
      subcategories: ['Mini Truck', 'Auto', 'Bicycle']
    }
  ],
  'Service Worker': [
    {
      name: 'Construction',
      subcategories: ['Plumbing', 'Carpentry', 'Electrical', 'Painting']
    },
    {
      name: 'Domestic',
      subcategories: ['Cleaning', 'Cooking', 'Gardening']
    },
    {
      name: 'Automotive',
      subcategories: ['Car Mechanic', 'Bike Mechanic']
    }
  ]
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'Clothing (Cloth)': '👕',
  'Electronics': '⚡',
  'Groceries': '🛒',
  'Footwear': '👟',
  'Home Appliances': '🏠',
  'Vegetables': '🥦',
  'Fruits': '🍎',
  'Grains': '🌾',
  'Dairy & Poultry': '🥛',
  'Machinery': '🚜',
  'Tools': '🛠️',
  'Vehicles': '🚚',
  'Construction': '🪚',
  'Domestic': '🧹',
  'Automotive': '🚗'
};

export default function AddProductScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const productId = route.params?.productId;
  const isEdit = !!productId;
  
  const shopProfile = useAppSelector((state: any) => state.profile.profile);
  const userRole = useAppSelector((state: any) => state.profile.role) || 'Retailer';

  // Normalize role
  const normalizedRole = 
    userRole.toLowerCase().includes('retail') ? 'Retailer' :
    userRole.toLowerCase().includes('farmer') ? 'Farmer' :
    userRole.toLowerCase().includes('rental') ? 'Rental Owner' :
    userRole.toLowerCase().includes('worker') ? 'Service Worker' : 'Retailer';

  // Accent Colors depending on User Role
  const accentColor = 
    normalizedRole === 'Retailer' ? Colors.bluePrimary :
    normalizedRole === 'Farmer' ? Colors.greenPrimary :
    normalizedRole === 'Rental Owner' ? Colors.amberPrimary :
    normalizedRole === 'Service Worker' ? Colors.purplePrimary : Colors.bluePrimary;

  const softColor = 
    normalizedRole === 'Retailer' ? Colors.blueSoft :
    normalizedRole === 'Farmer' ? Colors.greenSoft :
    normalizedRole === 'Rental Owner' ? Colors.amberSoft :
    normalizedRole === 'Service Worker' ? Colors.purpleSoft : Colors.blueSoft;

  const [form, setForm] = useState({ name: '', category: '', sub_category: '', price: '', quantity: '', desc: '' });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Shop type description filter for Retailer
  const shopType = shopProfile?.description || ''; 
  
  let roleCategories = CATEGORIES_BY_ROLE[normalizedRole] || CATEGORIES_BY_ROLE['Retailer'];

  // Sort categories based on Shop Type description so matched categories come first
  if (normalizedRole === 'Retailer' && shopType) {
    const shopTypeLower = shopType.toLowerCase();
    roleCategories = [...roleCategories].sort((a, b) => {
      const aMatch = a.name.toLowerCase().includes(shopTypeLower);
      const bMatch = b.name.toLowerCase().includes(shopTypeLower);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      apiService.products.getDetails(parseInt(productId, 10))
        .then(res => {
          if (res?.product) {
            const p = res.product;
            setForm({
              name: p.name,
              category: p.category || '',
              sub_category: p.sub_category || '',
              price: String(parseFloat(p.price).toFixed(0)),
              quantity: String(p.stock_quantity),
              desc: p.description || ''
            });
            setImageUri(p.image_url);
            
            // Set active main category state if matched
            if (p.category) {
              const matchedMain = roleCategories.find(rc => rc.name === p.category);
              if (matchedMain) {
                setSelectedCat(p.category);
              }
            }
          }
        })
        .finally(() => setFetching(false));
    }
  }, [productId, isEdit]);

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.quantity) return showToast('Fill required fields');
    if (!imageUri) return showToast('Product image is required');

    setSubmitting(true);
    const payload = {
      shop_id: shopProfile?.id,
      name: form.name,
      category: form.category,
      sub_category: form.sub_category,
      price: form.price,
      stock_quantity: parseInt(form.quantity, 10) || 10,
      image_url: imageUri,
      description: form.desc
    };

    try {
      if (isEdit) await apiService.products.update(parseInt(productId, 10), payload);
      else await apiService.products.create(payload);
      showToast(isEdit ? 'Updated successfully' : 'Added successfully');
      navigation.goBack();
    } catch (err: any) {
      if (!syncService.getIsConnected()) {
        syncService.queueAction('ADD_PRODUCT', payload);
        showToast('Saved offline');
        navigation.goBack();
      } else {
        showToast(err?.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = (type: 'camera' | 'gallery') => {
    const options = { mediaType: 'photo' as MediaType, quality: 0.8 as PhotoQuality };
    const callback = async (response: any) => {
      if (response.didCancel) return;
      if (response.errorMessage) return showToast('Image picker error: ' + response.errorMessage);
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setUploading(true);
        try {
          const res = await apiService.upload.image(asset.uri, asset.type, asset.fileName);
          if (res.success) {
            setImageUri(BASE_URL + res.url);
          }
        } catch (e) {
          showToast('Failed to upload image');
        } finally {
          setUploading(false);
        }
      }
    };

    if (type === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCat(catName);
    setForm(f => ({ ...f, category: catName, sub_category: '' }));
  };

  const handleSubCategorySelect = (subCat: string) => {
    setForm(f => ({
      ...f,
      sub_category: subCat,
      category: selectedCat || f.category,
      name: subCat,
      desc: `Premium quality ${subCat} sourced locally.`
    }));
  };

  if (fetching) return <View style={styles.loaderWrap}><ActivityIndicator size="large" color={accentColor} /></View>;

  const activeCategoryObj = roleCategories.find(cat => cat.name === selectedCat);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 24, color: accentColor }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Product' : 'Add New Product'}</Text>
          <Text style={[styles.headerSubtitle, { color: accentColor }]}>
            {normalizedRole === 'Retailer' ? `🏪 Retail Store: ${shopProfile?.name || 'My Shop'}` : 
             normalizedRole === 'Farmer' ? `🌾 Farm Profile: ${shopProfile?.farm_name || 'My Farm'}` :
             normalizedRole === 'Rental Owner' ? `🚜 Rental Equipment` : `🔧 Service Listings`}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Image Upload */}
          <SectionHeader title="Product Photo" />
          <View style={styles.imageWrap}>
            {imageUri ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: imageUri }} style={styles.previewImg} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImageUri(null)}>
                  <Text style={{ fontSize: 16, color: Colors.white }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUpload('camera')}>
                  <View style={[styles.uploadIcon, { backgroundColor: Colors.blueSoft }]}><Text style={{ fontSize: 32 }}>📷</Text></View>
                  <Text style={styles.uploadTxt}>Camera</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUpload('gallery')}>
                  <View style={[styles.uploadIcon, { backgroundColor: Colors.greenSoft }]}><Text style={{ fontSize: 32 }}>🖼️</Text></View>
                  <Text style={styles.uploadTxt}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Category Picker templates */}
          <SectionHeader title="💡 Role-Based Category Assistant" />
          <View style={[styles.presetWrap, { borderColor: softColor }]}>
            <Text style={styles.presetLbl}>1. Select Main Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {roleCategories.map(cat => {
                const isActive = selectedCat === cat.name;
                const emoji = CATEGORY_EMOJIS[cat.name] || '📦';
                return (
                  <TouchableOpacity 
                    key={cat.name} 
                    style={[styles.catChip, isActive && { backgroundColor: accentColor, borderColor: accentColor }]} 
                    onPress={() => handleCategorySelect(cat.name)}
                  >
                    <Text style={[styles.catTxt, isActive && styles.catTxtActive]}>
                      {emoji} {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedCat && activeCategoryObj && (
              <>
                <Text style={styles.presetLbl}>2. Select Sub Category:</Text>
                <View style={styles.kwGrid}>
                  {activeCategoryObj.subcategories.map(sub => {
                    const isActiveSub = form.sub_category === sub;
                    return (
                      <TouchableOpacity 
                        key={sub} 
                        style={[
                          styles.kwChip, 
                          { borderColor: accentColor + '40', backgroundColor: softColor },
                          isActiveSub && { backgroundColor: accentColor, borderColor: accentColor }
                        ]} 
                        onPress={() => handleSubCategorySelect(sub)}
                      >
                        <Text style={[styles.kwTxt, { color: accentColor }, isActiveSub && { color: Colors.white }]}>
                          + {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          {/* Form Fields */}
          <SectionHeader title="Product Details" />
          
          <TextInput
            mode="outlined" label="Product Name" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))}
            style={styles.input} activeOutlineColor={accentColor}
          />
          
          <View style={styles.row}>
            <TextInput
              mode="outlined" label="Category" value={form.category} onChangeText={t => setForm(f => ({ ...f, category: t }))}
              style={[styles.input, { flex: 1, marginRight: 8 }]} activeOutlineColor={accentColor}
              editable={false}
            />
            <TextInput
              mode="outlined" label="Sub Category" value={form.sub_category} onChangeText={t => setForm(f => ({ ...f, sub_category: t }))}
              style={[styles.input, { flex: 1, marginLeft: 8 }]} activeOutlineColor={accentColor}
              editable={false}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              mode="outlined" label="Price (₹)" keyboardType="numeric" value={form.price} onChangeText={t => setForm(f => ({ ...f, price: t }))}
              style={[styles.input, { flex: 1, marginRight: 8 }]} activeOutlineColor={accentColor}
            />
            <TextInput
              mode="outlined" label="Quantity" keyboardType="numeric" value={form.quantity} onChangeText={t => setForm(f => ({ ...f, quantity: t }))}
              style={[styles.input, { flex: 1, marginLeft: 8 }]} activeOutlineColor={accentColor}
            />
          </View>
          
          <TextInput
            mode="outlined" label="Description" multiline numberOfLines={3} value={form.desc} onChangeText={t => setForm(f => ({ ...f, desc: t }))}
            style={styles.input} activeOutlineColor={accentColor}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: accentColor }]} 
            onPress={handleSubmit} 
            disabled={submitting || uploading}
          >
            {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitTxt}>{isEdit ? 'Save Changes' : 'Add Product'}</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Upload Modal */}
      {uploading && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={styles.modalTxt}>Uploading image...</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { paddingRight: Spacing.md },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },

  imageWrap: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  previewWrap: { width: '100%', height: 200, borderRadius: Radius.md, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  removeImgBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  uploadRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 10 },
  uploadBtn: { alignItems: 'center' },
  uploadIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  uploadTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  divider: { width: 1, height: 60, backgroundColor: Colors.border },

  presetWrap: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg,
    borderWidth: 1.5,
  },
  presetLbl: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, marginBottom: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgLight, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  catTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catTxtActive: { color: Colors.white },
  kwGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kwChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1 },
  kwTxt: { fontSize: 13, fontWeight: '700' },

  input: { backgroundColor: Colors.white, marginBottom: 16, fontSize: 14 },
  row: { flexDirection: 'row' },

  submitBtn: {
    borderRadius: Radius.full, paddingVertical: 14,
    alignItems: 'center', marginTop: 10,
  },
  submitTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: Radius.lg, alignItems: 'center' },
  modalTxt: { marginTop: 12, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
});
