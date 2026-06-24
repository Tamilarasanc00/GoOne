import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';
import { API_URL } from '../config/apiConfig';
import { showToast } from '../utils/toast';

// ----------------------------------------------------------------------------
// AXIOS CLIENT CONFIGURATION
// ----------------------------------------------------------------------------
export const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into request headers
client.interceptors.request.use(
  (config) => {
    const token = storage.getString('APP_JWT_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

import { navigateAndReset } from '../navigation/navigationRef';

// Response error handler (e.g. logouts on 401 token expiry)
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[Session Expired] Logging out...');
      storage.remove('APP_JWT_TOKEN');
      showToast('Session expired. Please log in again.');
      navigateAndReset('Login');
    }
    const errData = error.response?.data || { message: error.message || 'Network error' };
    return Promise.reject(errData);
  }
);

// ----------------------------------------------------------------------------
// CONSOLIDATED SERVICES
// ----------------------------------------------------------------------------
export const apiService = {
  auth: {
    sendOtp: (phone_number: string): Promise<any> =>
      client.post('/auth/send-otp', { phone_number }),

    verifyOtp: (phone_number: string, otp_code: string): Promise<any> =>
      client.post('/auth/verify-otp', { phone_number, otp_code }),

    logout: (): Promise<any> =>
      client.post('/auth/logout'),

    getProfile: (): Promise<any> =>
      client.get('/auth/profile'),
  },

  profile: {
    checkStatus: (): Promise<any> =>
      client.get('/profile/status'),

    completeProfile: (payload: any): Promise<any> =>
      client.post('/profile/complete', payload),

    updateRole: (role: string): Promise<any> =>
      client.put('/profile/role', { role }),
  },

  upload: {
    image: async (uri: string, type: string = 'image/jpeg', name: string = 'upload.jpg'): Promise<any> => {
      const formData = new FormData();
      formData.append('image', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type,
        name,
      } as any);

      return client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
  },

  shops: {
    create: (payload: any): Promise<any> =>
      client.post('/shops', payload),

    update: (id: number, payload: any): Promise<any> =>
      client.put(`/shops/${id}`, payload),

    getDetails: (id: number): Promise<any> =>
      client.get(`/shops/${id}`),

    getNearby: (latitude: number, longitude: number, radius?: number): Promise<any> =>
      client.get('/shops/nearby', { params: { latitude, longitude, radius } }),

    getOffers: (): Promise<any> =>
      client.get('/shops/offers'),

    createOffer: (payload: any): Promise<any> =>
      client.post('/shops/offers', payload),

    delete: (id: number): Promise<any> =>
      client.delete(`/shops/${id}`),
  },

  products: {
    create: (payload: any): Promise<any> =>
      client.post('/products', payload),

    update: (id: number, payload: any): Promise<any> =>
      client.put(`/products/${id}`, payload),

    delete: (id: number): Promise<any> =>
      client.delete(`/products/${id}`),

    list: (shopId: number): Promise<any> =>
      client.get('/products', { params: { shopId } }),

    getDetails: (id: number): Promise<any> =>
      client.get(`/products/${id}`),
  },

  bookings: {
    create: (payload: any): Promise<any> =>
      client.post('/bookings', payload),

    accept: (id: number): Promise<any> =>
      client.post(`/bookings/${id}/accept`),

    reject: (id: number): Promise<any> =>
      client.post(`/bookings/${id}/reject`),

    complete: (id: number): Promise<any> =>
      client.post(`/bookings/${id}/complete`),

    history: (): Promise<any> =>
      client.get('/bookings'),
  },

  reviews: {
    add: (payload: any): Promise<any> =>
      client.post('/reviews', payload),

    get: (targetType: string, targetId: number): Promise<any> =>
      client.get(`/reviews/${targetType}/${targetId}`),
  },

  help: {
    updateLocation: (latitude: number, longitude: number): Promise<any> =>
      client.put('/help/location', { latitude, longitude }),

    createRequest: (payload: any): Promise<any> =>
      client.post('/help/request', payload),

    acceptRequest: (id: number): Promise<any> =>
      client.post(`/help/accept/${id}`),

    activeRequests: (): Promise<any> =>
      client.get('/help/active'),
  },

  banners: {
    getBanners: (): Promise<any> =>
      client.get('/banners'),
  },

  crops: {
    list: (category?: string, search?: string): Promise<any> =>
      client.get('/crops', { params: { category, search } }),

    listMyCrops: (): Promise<any> =>
      client.get('/crops/my'),

    getDetails: (id: number): Promise<any> =>
      client.get(`/crops/${id}`),

    create: (payload: any): Promise<any> =>
      client.post('/crops', payload),

    update: (id: number, payload: any): Promise<any> =>
      client.put(`/crops/${id}`, payload),

    delete: (id: number): Promise<any> =>
      client.delete(`/crops/${id}`),
  },

  workers: {
    list: (category?: string, search?: string): Promise<any> =>
      client.get('/workers', { params: { category, search } }),

    getDetails: (id: number): Promise<any> =>
      client.get(`/workers/${id}`),

    getMyProfile: (): Promise<any> =>
      client.get('/workers/my'),

    toggleAvailability: (): Promise<any> =>
      client.post('/workers/availability'),
  },

  rentals: {
    list: (category?: string, search?: string): Promise<any> =>
      client.get('/rentals', { params: { category, search } }),

    listMyRentals: (): Promise<any> =>
      client.get('/rentals/my'),

    getDetails: (id: number): Promise<any> =>
      client.get(`/rentals/${id}`),

    create: (payload: any): Promise<any> =>
      client.post('/rentals', payload),

    update: (id: number, payload: any): Promise<any> =>
      client.put(`/rentals/${id}`, payload),

    delete: (id: number): Promise<any> =>
      client.delete(`/rentals/${id}`),
  },

  jobs: {
    list: (category?: string, search?: string): Promise<any> =>
      client.get('/jobs', { params: { category, search } }),

    apply: (jobId: number): Promise<any> =>
      client.post('/bookings', { target_id: jobId, target_type: 'Job', total_amount: 0 }),

    listMyJobs: (): Promise<any> =>
      client.get('/jobs/my'),

    getDetails: (id: number): Promise<any> =>
      client.get(`/jobs/${id}`),

    create: (payload: any): Promise<any> =>
      client.post('/jobs', payload),

    update: (id: number, payload: any): Promise<any> =>
      client.put(`/jobs/${id}`, payload),

    delete: (id: number): Promise<any> =>
      client.delete(`/jobs/${id}`),

    getApplications: (id: number): Promise<any> =>
      client.get(`/jobs/${id}/applications`),
  },

  notifications: {
    list: (): Promise<any> =>
      client.get('/notifications'),

    markAsRead: (id: number): Promise<any> =>
      client.post(`/notifications/${id}/read`),

    markAllAsRead: (): Promise<any> =>
      client.post('/notifications/read-all'),

    getUnreadCount: (): Promise<any> =>
      client.get('/notifications/unread-count'),
  },

  payments: {
    createOrder: (payload: any): Promise<any> =>
      client.post('/payments/create-order', payload),

    verifyPayment: (payload: any): Promise<any> =>
      client.post('/payments/verify-payment', payload),

    getPlans: (): Promise<any> =>
      client.get('/payments/plans'),

    getMySubscription: (): Promise<any> =>
      client.get('/payments/my-subscription'),
  },

  admin: {
    login: (payload: any): Promise<any> =>
      client.post('/admin/auth/login', payload),
      
    getStats: (): Promise<any> =>
      client.get('/admin/stats'),
      
    getRevenue: (params?: any): Promise<any> =>
      client.get('/admin/revenue', { params }),
      
    getUsers: (params?: any): Promise<any> =>
      client.get('/admin/users', { params }),
      
    toggleUserStatus: (id: number, is_active: boolean): Promise<any> =>
      client.patch(`/admin/users/${id}/status`, { is_active }),
      
    getShops: (params?: any): Promise<any> =>
      client.get('/admin/shops', { params }),
      
    updateShopStatus: (id: number, approval_status: string): Promise<any> =>
      client.patch(`/admin/shops/${id}/status`, { approval_status }),
      
    getJobs: (params?: any): Promise<any> =>
      client.get('/admin/jobs', { params }),
      
    updateJobStatus: (id: number, approval_status: string): Promise<any> =>
      client.patch(`/admin/jobs/${id}/status`, { approval_status }),
      
    getPayments: (params?: any): Promise<any> =>
      client.get('/admin/payments', { params }),
  },
};
