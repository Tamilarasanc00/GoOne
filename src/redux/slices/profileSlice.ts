import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';

interface ProfileState {
  isProfileCompleted: boolean;
  role: string | null;
  user: any | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  isProfileCompleted: false,
  role: null,
  user: null,
  profile: null,
  loading: false,
  error: null,
};

// Check profile status from backend
export const checkProfileStatus = createAsyncThunk(
  'profile/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await apiService.profile.checkStatus();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check status');
    }
  }
);

// Submit profile details to backend
export const completeProfile = createAsyncThunk(
  'profile/complete',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response: any = await apiService.profile.completeProfile(profileData);
      return { response, role: profileData.role };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete profile');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileCompleted: (state, action) => {
      state.isProfileCompleted = action.payload;
    },
    setProfileRole: (state, action) => {
      state.role = action.payload;
    },
    resetProfile: (state) => {
      state.isProfileCompleted = false;
      state.role = null;
      state.user = null;
      state.profile = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // check status
      .addCase(checkProfileStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkProfileStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isProfileCompleted = action.payload.is_profile_completed;
        state.role = action.payload.role;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
      })
      .addCase(checkProfileStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // complete profile
      .addCase(completeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isProfileCompleted = true;
        state.role = action.payload.role;
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProfileCompleted, resetProfile, setProfileRole } = profileSlice.actions;
export default profileSlice.reducer;
