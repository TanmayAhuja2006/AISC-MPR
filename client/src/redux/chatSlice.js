import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ── Thunks ──────────────────────────────────────────────────────────────
export const fetchSessions = createAsyncThunk(
  'chat/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/chat/sessions');
      return data.sessions;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sessions.');
    }
  }
);

export const createSession = createAsyncThunk(
  'chat/createSession',
  async (title, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/chat/sessions', { title: title || 'New Chat' });
      const sessionId = data.session_id ?? data.sessionId;
      if (!sessionId) {
        return rejectWithValue('Server did not return a session id.');
      }
      return {
        id: sessionId,
        title: title || 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create session.');
    }
  }
);

export const loadSession = createAsyncThunk(
  'chat/loadSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/chat/sessions/${sessionId}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load session.');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, message }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/chat/sessions/${sessionId}/message`, { message });
      return data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send message.');
    }
  }
);

export const deleteSession = createAsyncThunk(
  'chat/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      return sessionId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete session.');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    sessions:        [],
    activeSessionId: null,
    messages:        [],
    loading:         false,
    creating:        false,
    sending:         false,
    error:           null,
  },
  reducers: {
    setActiveSession(state, action) {
      state.activeSessionId = action.payload;
      state.messages        = [];
    },
    clearChatError(state) {
      state.error = null;
    },
    addOptimisticMessage(state, action) {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // fetchSessions
    builder
      .addCase(fetchSessions.pending,   (s) => { s.loading = true; })
      .addCase(fetchSessions.fulfilled, (s, a) => { s.loading = false; s.sessions = a.payload; })
      .addCase(fetchSessions.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

    // createSession
      .addCase(createSession.pending,   (s) => { s.creating = true; s.error = null; })
      .addCase(createSession.fulfilled, (s, a) => {
        s.creating        = false;
        s.sessions.unshift(a.payload);
        s.activeSessionId = a.payload.id;
        s.messages        = [];
      })
      .addCase(createSession.rejected,  (s, a) => { s.creating = false; s.error = a.payload; })

    // loadSession
      .addCase(loadSession.pending,   (s) => { s.loading = true; })
      .addCase(loadSession.fulfilled, (s, a) => {
        s.loading         = false;
        s.activeSessionId = a.payload.session.id;
        s.messages        = a.payload.messages;
      })
      .addCase(loadSession.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

    // sendMessage
      .addCase(sendMessage.pending,   (s) => { s.sending = true; s.error = null; })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.sending = false;
        // Replace the optimistic assistant placeholder
        const lastIdx = s.messages.findLastIndex((m) => m.role === 'assistant' && m._optimistic);
        if (lastIdx !== -1) {
          s.messages[lastIdx] = a.payload;
        } else {
          s.messages.push(a.payload);
        }
        // Update session title in sidebar list
        const session = s.sessions.find((ss) => ss.id === s.activeSessionId);
        if (session) session.updated_at = new Date().toISOString();
      })
      .addCase(sendMessage.rejected,  (s, a) => {
        s.sending = false;
        s.error   = a.payload;
        // Remove optimistic assistant placeholder
        s.messages = s.messages.filter((m) => !m._optimistic);
      })

    // deleteSession
      .addCase(deleteSession.fulfilled, (s, a) => {
        s.sessions = s.sessions.filter((ss) => ss.id !== a.payload);
        if (s.activeSessionId === a.payload) {
          s.activeSessionId = null;
          s.messages        = [];
        }
      });
  },
});

export const { setActiveSession, clearChatError, addOptimisticMessage } = chatSlice.actions;
export default chatSlice.reducer;
