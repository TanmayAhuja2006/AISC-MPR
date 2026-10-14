import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ── Thunks ──────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed.');
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed.');
    }
  }
);

export const fetchMe = createAsyncThunk(
  'user/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Session expired.');
    }
  }
);

export const fetchHealthProfile = createAsyncThunk(
  'user/fetchHealthProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users/health-profile');
      return data.healthProfile;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load health profile.');
    }
  }
);

export const saveHealthProfile = createAsyncThunk(
  'user/saveHealthProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      await api.post('/users/health-profile', profileData);
      return profileData;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save health profile.');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────
const userSlice = createSlice({
  name: 'user',
  initialState: {
    user:          null,
    token:         localStorage.getItem('token') || null,
    healthProfile: null,
    loading:       false,
    error:         null,
    isAuthenticated: false,
  },
  reducers: {
    logout(state) {
      state.user          = null;
      state.token         = null;
      state.healthProfile = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginUser.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user    = a.payload.user;
        s.token   = a.payload.token;
        s.isAuthenticated = true;
      })
      .addCase(loginUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

    // register
      .addCase(registerUser.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user    = a.payload.user;
        s.token   = a.payload.token;
        s.isAuthenticated = true;
      })
      .addCase(registerUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

    // fetchMe
      .addCase(fetchMe.pending,   (s) => { s.loading = true; })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.loading = false;
        s.user    = a.payload.user;
        s.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (s) => {
        s.loading = false;
        s.user    = null;
        s.token   = null;
        s.isAuthenticated = false;
        localStorage.removeItem('token');
      })

    // healthProfile
      .addCase(fetchHealthProfile.fulfilled, (s, a) => { s.healthProfile = a.payload; })
      .addCase(saveHealthProfile.fulfilled,  (s, a) => { s.healthProfile = a.payload; });
  },
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;
