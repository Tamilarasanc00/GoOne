import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { SectionHeader } from '../components/GoOneUI';

const CATEGORIES = ['Vegetables', 'Fruits', 'Rice', 'Seeds', 'Milk'];
const PRESET_KEYWORDS: Record<string, string[]> = {
  Vegetables: ['Tomato', 'Onion', 'Potato', 'Brinjal', 'Drumstick', 'Chilli'],
  Fruits: ['Banana', 'Mango', 'Apple', 'Orange', 'Papaya', 'Guava'],
  Rice: ['Premium Ponni Rice', 'Basmati Rice', 'Raw Rice', 'Boiled Rice'],
  Seeds: ['Paddy Seeds', 'Tomato Seeds', 'Chilli Seeds', 'Cotton Seeds'],
  Milk: ['Cow Milk', 'Buffalo Milk', 'Organic Ghee'],
};

export default function AddCropScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const cropId = route.params?.cropId;
  const isEdit = !!cropId;

  const [form, setForm] = useState({ name: '', category: 'Vegetables', price: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEdit && cropId) {
      setFetching(true);
      apiService.crops.getDetails(parseInt(cropId, 10))
        .then(res => {
          if (res?.crop) {
            const c = res.crop;
            setForm({ name: c.crop_name, category: c.category || 'Vegetables', price: String(parseFloat(c.price_per_kg).toFixed(0)), quantity: String(parseFloat(c.quantity_available).toFixed(0)) });
          }
        })
        .finally(() => setFetching(false));
    }
  }, [isEdit, cropId]);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.quantity) return showToast('Fill all fields');
    
    setLoading(true);
    const payload = { crop_name: form.name, quantity_available: parseFloat(form.quantity), price_per_kg: parseFloat(form.price) };

    try {
      if (isEdit) await apiService.crops.update(parseInt(cropId, 10), payload);
      else await apiService.crops.create(payload);
      showToast(isEdit ? 'Updated successfully' : 'Listed successfully');
      navigation.goBack();
    } catch (err: any) {
      showToast(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={styles.loaderWrap}><ActivityIndicator size="large" color={Colors.greenPrimary} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={{ fontSize: 24 }}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Crop' : 'List New Crop'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Templates */}
        <SectionHeader title="Step 1: Category & Templates" />
        <View style={styles.presetWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CATEGORIES.map(cat => {
              const isActive = form.category === cat;
              return (
                <TouchableOpacity key={cat} style={[styles.catChip, isActive && styles.catChipActive]} onPress={() => setForm(f => ({ ...f, category: cat }))}>
                  <Text style={[styles.catTxt, isActive && styles.catTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.kwGrid}>
            {(PRESET_KEYWORDS[form.category] || []).map(kw => (
              <TouchableOpacity key={kw} style={styles.kwChip} onPress={() => setForm(f => ({ ...f, name: kw }))}>
                <Text style={styles.kwTxt}>+ {kw}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Fields */}
        <SectionHeader title="Step 2: Details" />
        <View style={styles.formCard}>
          <TextInput
            mode="outlined" label="Crop Name" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))}
            style={styles.input} activeOutlineColor={Colors.greenPrimary}
          />
          <TextInput
            mode="outlined" label="Price per kg (₹)" keyboardType="numeric" value={form.price} onChangeText={t => setForm(f => ({ ...f, price: t }))}
            style={styles.input} activeOutlineColor={Colors.greenPrimary}
          />
          <TextInput
            mode="outlined" label="Quantity Available (kg)" keyboardType="numeric" value={form.quantity} onChangeText={t => setForm(f => ({ ...f, quantity: t }))}
            style={styles.input} activeOutlineColor={Colors.greenPrimary}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitTxt}>{isEdit ? 'Update Listing' : 'Publish Crop'}</Text>}
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
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

  presetWrap: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgLight, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  catChipActive: { backgroundColor: Colors.greenPrimary, borderColor: Colors.greenPrimary },
  catTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catTxtActive: { color: Colors.white },
  kwGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kwChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.greenSoft, borderWidth: 1, borderColor: Colors.greenPrimary + '40' },
  kwTxt: { fontSize: 13, fontWeight: '700', color: Colors.greenPrimary },

  formCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  input: { backgroundColor: Colors.white, marginBottom: 16, fontSize: 14 },

  submitBtn: {
    backgroundColor: Colors.greenPrimary, borderRadius: Radius.full, paddingVertical: 14,
    alignItems: 'center',
  },
  submitTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },
});
