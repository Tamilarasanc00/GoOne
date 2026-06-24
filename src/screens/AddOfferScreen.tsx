import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, IconButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/apiService';
import { useAppSelector } from '../redux/hooks';
import { showToast } from '../utils/toast';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { BASE_URL } from '../config/apiConfig';

type FormData = {
  title: string;
  discount: string;
  description: string;
};

export default function AddOfferScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const shopProfile = useAppSelector((state) => state.profile.profile);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: '',
      discount: '',
      description: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    showToast('Submitting offer...');
    try {
      const payload = {
        title: data.title,
        discount: data.discount,
        description: data.description,
        image_url: imageUri || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
        shop_name: shopProfile?.name || 'My Shop'
      };

      const res = await apiService.shops.createOffer(payload);
      if (res && res.success) {
        showToast('Offer added successfully!');
        navigation.goBack();
      } else {
        showToast('Failed to add offer');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving offer');
    } finally {
      setLoading(false);
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
            showToast('Offer flyer uploaded!');
          }
        } catch (e) {
          showToast('Failed to upload flyer');
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text variant="titleLarge" style={styles.headerTitle}>Add New Offer</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Flyer Image Section */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Offer Flyer / Photo</Text>
        <Surface style={styles.imageUploadContainer} elevation={1}>
          {uploading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Uploading flyer...</Text>
              </View>
          ) : imageUri ? (
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
              <TouchableOpacity style={styles.uploadButton} onPress={() => handleUpload('camera')}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <MaterialCommunityIcons name="camera" size={32} color={theme.colors.primary} />
                </View>
                <Text style={{ marginTop: 8, fontWeight: '500' }}>Take Photo</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.uploadButton} onPress={() => handleUpload('gallery')}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondary + '15' }]}>
                  <MaterialCommunityIcons name="image-multiple" size={32} color={theme.colors.secondary} />
                </View>
                <Text style={{ marginTop: 8, fontWeight: '500' }}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </Surface>

        {/* Form Fields */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Offer Details</Text>
        
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{ required: 'Offer Title is required' }}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                label="Offer Title"
                placeholder="e.g. 50% OFF on Tomatoes"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.title}
              />
            )}
          />
          {errors.title && <HelperText type="error">{errors.title.message}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{ required: 'Discount tag is required' }}
            name="discount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                label="Discount Tag"
                placeholder="e.g. 50% OFF or Buy 1 Get 1"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.discount}
              />
            )}
          />
          {errors.discount && <HelperText type="error">{errors.discount.message}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{ required: 'Description is required' }}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                label="Description"
                placeholder="Describe details of the deal"
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
          loading={loading}
          disabled={loading || uploading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Publish Offer
        </Button>
        
      </ScrollView>
      </KeyboardAvoidingView>
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
  submitButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  submitButtonContent: {
    height: 50,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
