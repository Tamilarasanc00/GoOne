import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
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
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { BASE_URL } from '../config/apiConfig';

const KEYWORD_PRESETS: Record<string, string[]> = {
  'Groceries': ['Rice (25kg)', 'Sunflower Oil (5L)', 'Wheat Flour (10kg)', 'Sugar (1kg)'],
  'Vegetables': ['Tomatoes (1kg)', 'Onions (1kg)', 'Potatoes (1kg)', 'Green Chillies (100g)'],
  'Fruits': ['Banana (12 pcs)', 'Apples (1kg)', 'Mangoes (1kg)', 'Watermelon (1 pc)'],
  'Fertilizers': ['Urea (50kg)', 'DAP (50kg)', 'Organic Compost (25kg)'],
  'Dairy & Eggs': ['Milk (1L)', 'Fresh Eggs (30 pcs)', 'Butter (500g)', 'Curd (500g)']
};
const CATEGORY_LIST = Object.keys(KEYWORD_PRESETS);

export default function AddProductScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const productId = route.params?.productId;
  const isEdit = !!productId;
  const shopProfile = useAppSelector((state: any) => state.profile.profile);

  const [form, setForm] = useState({ name: '', category: '', price: '', quantity: '', desc: '' });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      apiService.products.getDetails(parseInt(productId, 10))
        .then(res => {
          if (res?.product) {
            const p = res.product;
            setForm({ name: p.name, category: p.category, price: String(parseFloat(p.price).toFixed(0)), quantity: String(p.stock_quantity), desc: p.description || '' });
            setImageUri(p.image_url);
            if (CATEGORY_LIST.includes(p.category)) setSelectedCat(p.category);
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
      shop_id: shopProfile?.id, name: form.name, category: form.category,
      price: form.price, stock_quantity: parseInt(form.quantity, 10) || 10,
      image_url: imageUri, description: form.desc
    };

    try {
      if (isEdit) await apiService.products.update(parseInt(productId, 10), payload);
      else await apiService.products.create(payload);
      showToast(isEdit ? 'Updated successfully' : 'Added successfully');
      navigation.goBack();
    } catch (err) {
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
    const options = { mediaType: 'photo' as MediaType, quality: 0.8 };
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

  const handleKeyword = (kw: string) => {
    setForm(f => ({ ...f, name: kw, category: selectedCat || f.category, desc: `Premium quality ${kw} sourced locally.` }));
  };

  if (fetching) return <View style={styles.loaderWrap}><ActivityIndicator size="large" color={Colors.bluePrimary} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={{ fontSize: 24 }}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Product' : 'Add New Product'}</Text>
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

        {/* Easy Fill */}
        <SectionHeader title="💡 Quick Fill Templates" />
        <View style={styles.presetWrap}>
          <Text style={styles.presetLbl}>1. Select Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CATEGORY_LIST.map(cat => {
              const isActive = selectedCat === cat;
              return (
                <TouchableOpacity key={cat} style={[styles.catChip, isActive && styles.catChipActive]} onPress={() => setSelectedCat(cat)}>
                  <Text style={[styles.catTxt, isActive && styles.catTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedCat && (
            <>
              <Text style={styles.presetLbl}>2. Select Item:</Text>
              <View style={styles.kwGrid}>
                {KEYWORD_PRESETS[selectedCat].map(kw => (
                  <TouchableOpacity key={kw} style={styles.kwChip} onPress={() => handleKeyword(kw)}>
                    <Text style={styles.kwTxt}>+ {kw}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Form Fields */}
        <SectionHeader title="Product Details" />
        <TextInput
          mode="outlined" label="Product Name" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))}
          style={styles.input} activeOutlineColor={Colors.bluePrimary}
        />
        <TextInput
          mode="outlined" label="Category" value={form.category} onChangeText={t => setForm(f => ({ ...f, category: t }))}
          style={styles.input} activeOutlineColor={Colors.bluePrimary}
        />
        <View style={styles.row}>
          <TextInput
            mode="outlined" label="Price (₹)" keyboardType="numeric" value={form.price} onChangeText={t => setForm(f => ({ ...f, price: t }))}
            style={[styles.input, { flex: 1, marginRight: 8 }]} activeOutlineColor={Colors.bluePrimary}
          />
          <TextInput
            mode="outlined" label="Quantity" keyboardType="numeric" value={form.quantity} onChangeText={t => setForm(f => ({ ...f, quantity: t }))}
            style={[styles.input, { flex: 1, marginLeft: 8 }]} activeOutlineColor={Colors.bluePrimary}
          />
        </View>
        <TextInput
          mode="outlined" label="Description" multiline numberOfLines={3} value={form.desc} onChangeText={t => setForm(f => ({ ...f, desc: t }))}
          style={styles.input} activeOutlineColor={Colors.bluePrimary}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting || uploading}>
          {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitTxt}>{isEdit ? 'Save Changes' : 'Add Product'}</Text>}
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>

      {/* Upload Modal */}
      {uploading && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ActivityIndicator size="large" color={Colors.bluePrimary} />
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  
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
    borderWidth: 1.5, borderColor: Colors.blueSoft,
  },
  presetLbl: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, marginBottom: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgLight, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  catChipActive: { backgroundColor: Colors.bluePrimary, borderColor: Colors.bluePrimary },
  catTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catTxtActive: { color: Colors.white },
  kwGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kwChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.blueSoft, borderWidth: 1, borderColor: Colors.bluePrimary + '40' },
  kwTxt: { fontSize: 13, fontWeight: '700', color: Colors.bluePrimary },

  input: { backgroundColor: Colors.white, marginBottom: 16, fontSize: 14 },
  row: { flexDirection: 'row' },

  submitBtn: {
    backgroundColor: Colors.bluePrimary, borderRadius: Radius.full, paddingVertical: 14,
    alignItems: 'center', marginTop: 10,
  },
  submitTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: Radius.lg, alignItems: 'center' },
  modalTxt: { marginTop: 12, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
});
