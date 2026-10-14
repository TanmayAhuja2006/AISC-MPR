import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './redux/store';
import { ThemeProvider } from './context/ThemeProvider';
import AppRouter from './routes/AppRouter';
import { fetchMe, fetchHealthProfile } from './redux/userSlice';
import './index.css';

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchMe());
      dispatch(fetchHealthProfile());
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-surface, #1e293b)',
            color: 'var(--color-text, #f1f5f9)',
            border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
            borderRadius: '12px',
            fontSize: '0.875rem',
            padding: '12px 16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <AppRouter />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}
