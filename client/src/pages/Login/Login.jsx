import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Activity } from 'lucide-react';
import { loginUser, clearError } from '../../redux/userSlice';
import CustomInput from '../../common-components/CustomInput/CustomInput';
import CustomButton from '../../common-components/CustomButton/CustomButton';
import CustomAlert from '../../common-components/CustomAlert/CustomAlert';
import './Auth.css';

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.user);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-page__orb auth-page__orb--1" />
      <div className="auth-page__orb auth-page__orb--2" />

      <div className="auth-box">
        <div className="auth-box__logo">
          <Activity size={28} className="auth-box__logo-icon" />
          <span>MedRAG AI</span>
        </div>

        <h1 className="auth-box__title">Welcome back</h1>
        <p className="auth-box__sub">Sign in to your healthcare AI assistant</p>

        {error && <CustomAlert type="error" message={error} onDismiss={() => dispatch(clearError())} />}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <CustomInput
            id="login-email"
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <CustomInput
            id="login-password"
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            icon={Lock}
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          <CustomButton type="submit" fullWidth loading={loading} size="lg">
            Sign In
          </CustomButton>
        </form>

        <p className="auth-box__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-box__link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
