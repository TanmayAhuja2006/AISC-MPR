import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import Chat from '../pages/Chat/Chat';
import Profile from '../pages/Profile/Profile';
import Layout from '../components/Layout/Layout';

// Guard: requires authenticated user, otherwise redirects to /login
function ProtectedRoute({ children }) {
  const { isAuthenticated, token } = useSelector((s) => s.user);

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Guard: for guest-only pages (login, register), redirect to /dashboard if logged in
function PublicRoute({ children }) {
  const { isAuthenticated, token } = useSelector((s) => s.user);

  if (token || isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Layout hideFooter>
              <Chat />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:sessionId"
        element={
          <ProtectedRoute>
            <Layout hideFooter>
              <Chat />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}
