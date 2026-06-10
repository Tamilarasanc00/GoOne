import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, IconButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/apiService';
import { useAppSelector } from '../redux/hooks';
import { showToast } from '../utils/toast';
import { syncService } from '../services/syncService';

type FormData = {
  productName: string;
  category: string;
  price: string;
  quantity: string;
  description: string;
};

// Keyword options configuration for ease of input
const KEYWORD_PRESETS: { [category: string]: string[] } = {
  'Groceries': ['Rice (25kg)', 'Sunflower Oil (5L)', 'Wheat Flour (10kg)', 'Sugar (1kg)', 'Toor Dal (1kg)'],
  'Vegetables': ['Tomatoes (1kg)', 'Onions (1kg)', 'Potatoes (1kg)', 'Green Chillies (100g)', 'Brinjal (1kg)'],
  'Fruits': ['Banana (12 pcs)', 'Apples (1kg)', 'Mangoes (1kg)', 'Papaya (1 pc)', 'Watermelon (1 pc)'],
  'Fertilizers': ['Urea (50kg)', 'DAP (50kg)', 'Organic Compost (25kg)', 'Potash (50kg)', 'Neem Cake (10kg)'],
  'Dairy & Eggs': ['Milk (1L)', 'Fresh Eggs (30 pcs)', 'Butter (500g)', 'Ghee (1L)', 'Curd (500g)']
};

const CATEGORY_LIST = Object.keys(KEYWORD_PRESETS);

export default function AddProductScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Edit mode states
  const productId = route.params?.productId;
  const isEdit = !!productId;
  
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Upload simulation states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Selected preset category for keyword chip mapping
  const [selectedPresetCat, setSelectedPresetCat] = useState<string | null>(null);

  const shopProfile = useAppSelector((state) => state.profile.profile);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      productName: '',
      category: '',
      price: '',
      quantity: '',
      description: '',
    }
  });

  // Load product details in edit mode
  useEffect(() => {
    if (isEdit) {
      const loadProduct = async () => {
        setFetchingProduct(true);
        showToast('Loading product details...');
        try {
          const res = await apiService.products.getDetails(parseInt(productId, 10));
          if (res && res.success && res.product) {
            const prod = res.product;
            setValue('productName', prod.name);
            setValue('category', prod.category);
            setValue('price', String(parseFloat(prod.price).toFixed(0)));
            setValue('quantity', String(prod.stock_quantity || '10'));
            setValue('description', prod.description || '');
            setImageUri(prod.image_url);
            
            // Auto match preset category list
            if (CATEGORY_LIST.includes(prod.category)) {
              setSelectedPresetCat(prod.category);
            }
            showToast('Product loaded');
          } else {
            showToast('Product details not found');
          }
        } catch (err: any) {
          showToast(err.message || 'Failed to fetch product');
        } finally {
          setFetchingProduct(false);
        }
      };
      loadProduct();
    }
  }, [productId, isEdit]);

  const onSubmit = async (data: FormData) => {
    if (!imageUri) {
      showToast('Product image is required');
      Alert.alert('Missing Image', 'Please upload a product image.');
      return;
    }

    setSubmitting(true);
    showToast(isEdit ? 'Saving changes...' : 'Adding product...');

    const payload = {
      shop_id: shopProfile?.id,
      name: data.productName,
      category: data.category,
      price: data.price,
      stock_quantity: parseInt(data.quantity, 10) || 10,
      image_url: imageUri
    };

    try {
      let res;
      if (isEdit) {
        res = await apiService.products.update(parseInt(productId, 10), payload);
      } else {
        res = await apiService.products.create(payload);
      }

      if (res && res.success) {
        showToast(isEdit ? 'Product updated successfully!' : 'Product added successfully!');
        navigation.goBack();
      } else {
        showToast('Operation failed');
      }
    } catch (err: any) {
      if (!syncService.getIsConnected()) {
        syncService.queueAction('ADD_PRODUCT', payload);
        showToast('Offline: Product queued');
        Alert.alert(
          'Offline Mode',
          'Your product addition has been saved offline. It will submit automatically when your connection is restored.'
        );
        navigation.goBack();
      } else {
        showToast(err.message || 'Failed to save product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateUpload = (type: 'camera' | 'gallery') => {
    setUploading(true);
    setUploadProgress(0);
    showToast(type === 'camera' ? 'Opening Camera...' : 'Opening Gallery...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const mockUrl = type === 'camera'
            ? 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80'
            : 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80';
          setImageUri(mockUrl);
          setUploading(false);
          setImageModalVisible(false);
          showToast('Product image uploaded!');
        }, 200);
      }
    }, 100);
  };

  const handleVoiceInput = () => {
    showToast('Listening...');
    setTimeout(() => {
      setValue('productName', 'Premium Ponni Rice');
      showToast('Recognized: Premium Ponni Rice');
    }, 1500);
  };

  // Keyword Option select handle
  const handleKeywordSelect = (productKeyword: string) => {
    setValue('productName', productKeyword);
    if (selectedPresetCat) {
      setValue('category', selectedPresetCat);
    }
    // Auto populate description for usability
    setValue('description', `Fresh and organic premium quality ${productKeyword} directly sourced for local consumers in Sankarapuram. Sourced under strict quality controls.`);
    showToast(`Pre-populated ${productKeyword}`);
  };

  if (fetchingProduct) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12 }}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {isEdit ? 'Edit Product Details' : 'Add New Product'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Image Upload Section */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Product Image</Text>
        <Surface style={styles.imageUploadContainer} elevation={1}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <IconButton 
                icon="close-circle" 
                size={24} 
                iconColor="#FFF" 
                style={styles.removeImageIcon} 
                onPress={() => setImageUri(null)} 
              />
            </View>
          ) : (
            <View style={styles.uploadButtonsContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={() => {
                setImageModalVisible(true);
                handleSimulateUpload('camera');
              }}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <MaterialCommunityIcons name="camera" size={32} color={theme.colors.primary} />
                </View>
                <Text style={{ marginTop: 8, fontWeight: '500' }}>Take Photo</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.uploadButton} onPress={() => {
                setImageModalVisible(true);
                handleSimulateUpload('gallery');
              }}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondary + '15' }]}>
                  <MaterialCommunityIcons name="image-multiple" size={32} color={theme.colors.secondary} />
                </View>
                <Text style={{ marginTop: 8, fontWeight: '500' }}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </Surface>

        {/* Easy Keyword Options Selector */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          💡 Easy Fill: Select Product Keyword
        </Text>
        <Surface style={styles.presetContainer} elevation={1}>
          <Text variant="bodySmall" style={styles.presetLabel}>1. Select Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CATEGORY_LIST.map((cat) => {
              const isSelected = selectedPresetCat === cat;
              return (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => {
                    setSelectedPresetCat(cat);
                    setValue('category', cat);
                  }}
                  style={[styles.presetChip, isSelected ? styles.presetChipActive : null]}
                >
                  <Text style={[styles.presetChipText, isSelected ? styles.presetChipTextActive : null]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedPresetCat && (
            <>
              <Text variant="bodySmall" style={styles.presetLabel}>2. Select Item Keyword:</Text>
              <View style={styles.keywordGrid}>
                {KEYWORD_PRESETS[selectedPresetCat].map((kw) => (
                  <TouchableOpacity 
                    key={kw} 
                    onPress={() => handleKeywordSelect(kw)}
                    style={styles.keywordOptionChip}
                  >
                    <MaterialCommunityIcons name="plus" size={14} color={theme.colors.primary} />
                    <Text style={styles.keywordOptionText}>{kw}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </Surface>

        {/* Form Fields */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Product Details</Text>
        
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{ required: 'Product name is required' }}
            name="productName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                label="Product Name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.productName}
                right={<TextInput.Icon icon="microphone" onPress={handleVoiceInput} color={theme.colors.primary} />}
              />
            )}
          />
          {errors.productName && <HelperText type="error">{errors.productName.message}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{ required: 'Category is required' }}
            name="category"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                label="Category (e.g. Vegetables, Groceries)"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.category}
              />
            )}
          />
          {errors.category && <HelperText type="error">{errors.category.message}</HelperText>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Controller
              control={control}
              rules={{ required: 'Price is required' }}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  label="Price (₹)"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={!!errors.price}
                />
              )}
            />
            {errors.price && <HelperText type="error">{errors.price.message}</HelperText>}
          </View>

          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Controller
              control={control}
              rules={{ required: 'Quantity is required' }}
              name="quantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  label="Stock Quantity"
                  keyboardType="numeric"
                  placeholder="e.g. 10"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={!!errors.quantity}
                />
              )}
            />
            {errors.quantity && <HelperText type="error">{errors.quantity.message}</HelperText>}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{ required: 'Description is required' }}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                label="Product Description"
                multiline
                numberOfLines={4}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.description}
              />
            )}
          />
          {errors.description && <HelperText type="error">{errors.description.message}</HelperText>}
        </View>

        <Button 
          mode="contained" 
          onPress={handleSubmit(onSubmit)} 
          loading={submitting}
          disabled={submitting || uploading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {isEdit ? 'Save Changes' : 'Add Product'}
        </Button>
        
      </ScrollView>

      {/* Simulated Upload Status Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={4}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.progressText}>
              Simulating photo upload: {uploadProgress}%
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  imageUploadContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    minHeight: 160,
    justifyContent: 'center',
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  uploadButton: {
    alignItems: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: '#E0E0E0',
  },
  previewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  submitButtonContent: {
    height: 50,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Presets styling
  presetContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  presetLabel: {
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  presetChipActive: {
    backgroundColor: '#E6F0FF',
    borderColor: '#0066FF',
  },
  presetChipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: '#0066FF',
  },
  keywordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CCE0FF',
  },
  keywordOptionText: {
    fontSize: 13,
    color: '#0066FF',
    fontWeight: '500',
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: 250,
  },
  progressText: {
    marginTop: 12,
    fontWeight: 'bold',
  },
});
