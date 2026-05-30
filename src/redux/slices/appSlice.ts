import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { storage, StorageKeys, loadJSON, saveJSON } from '../../services/storage';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AppState {
  isDarkMode: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  role: string | null;
}

const getInitialTheme = () => {
  const savedTheme = storage.getString(StorageKeys.THEME);
  return savedTheme === 'dark';
};

const getInitialUser = (): User | null => {
  return loadJSON<User>(StorageKeys.USER_PROFILE);
};

const initialState: AppState = {
  isDarkMode: getInitialTheme(),
  user: getInitialUser(),
  loading: false,
  error: null,
  role: null,
};

export const fetchRandomUser = createAsyncThunk(
  'app/fetchRandomUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<User>('/users/1');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch data');
    }
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
      storage.set(StorageKeys.THEME, state.isDarkMode ? 'dark' : 'light');
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRandomUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRandomUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        saveJSON(StorageKeys.USER_PROFILE, action.payload);
      })
      .addCase(fetchRandomUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { toggleTheme, setRole } = appSlice.actions;
export default appSlice.reducer;
