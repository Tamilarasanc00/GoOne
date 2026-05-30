import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, IconButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';

type FormData = {
  productName: string;
  category: string;
  price: string;
  quantity: string;
  description: string;
};

export default function AddProductScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: {
      productName: '',
      category: '',
      price: '',
      quantity: '',
      description: '',
    }
  });

  const onSubmit = (data: FormData) => {
    if (!imageUri) {
      Alert.alert('Missing Image', 'Please upload a product image.');
      return;
    }
    console.log(data);
    Alert.alert('Success', 'Product added successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleCameraUpload = () => {
    // Mock Camera Upload
    Alert.alert("Camera", "Opening Camera to take product photo...");
    setTimeout(() => {
      setImageUri('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80');
    }, 1000);
  };

  const handleGalleryUpload = () => {
    // Mock Gallery Upload
    Alert.alert("Gallery", "Opening Photo Gallery...");
    setTimeout(() => {
      setImageUri('https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80');
    }, 1000);
  };

  const handleVoiceInput = () => {
    // Mock Voice Input
    Alert.alert("Listening...", "Speak the product name.");
    setTimeout(() => {
      setValue('productName', 'Fresh Organic Tomatoes');
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text variant="titleLarge" style={styles.headerTitle}>Add New Product</Text>
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
              <TouchableOpacity style={styles.uploadButton} onPress={handleCameraUpload}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <MaterialCommunityIcons name="camera" size={32} color={theme.colors.primary} />
                </View>
                <Text style={{ marginTop: 8, fontWeight: '500' }}>Take Photo</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.uploadButton} onPress={handleGalleryUpload}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondary + '15' }]}>
                  <MaterialCommunityIcons name="image-multiple" size={32} color={theme.colors.secondary} />
                </View>
                <Text style={{ marginTop: 8, fontWeight: '500' }}>Gallery</Text>
              </TouchableOpacity>
            </View>
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
                  label="Quantity (e.g. 1 kg)"
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
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Add Product
        </Button>
        
      </ScrollView>
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
});
