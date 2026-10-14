import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, User, Activity } from 'lucide-react';
import { registerUser, clearError } from '../../redux/userSlice';
import CustomInput from '../../common-components/CustomInput/CustomInput';
import CustomButton from '../../common-components/CustomButton/CustomButton';
import CustomAlert from '../../common-components/CustomAlert/CustomAlert';
import './Auth.css';

export default function Register() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.user);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localErr, setLocalErr] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setLocalErr('');
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setLocalErr('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setLocalErr('Password must be at least 6 characters.');
      return;
    }
    dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
  };

  const displayErr = localErr || error;

  return (
    <div className="auth-page">
      <div className="auth-page__orb auth-page__orb--1" />
      <div className="auth-page__orb auth-page__orb--2" />

      <div className="auth-box">
        <div className="auth-box__logo">
          <Activity size={28} className="auth-box__logo-icon" />
          <span>MedRAG AI</span>
        </div>

        <h1 className="auth-box__title">Create account</h1>
        <p className="auth-box__sub">Start your personalised healthcare AI journey</p>

        {displayErr && (
          <CustomAlert type="error" message={displayErr} onDismiss={() => { setLocalErr(''); dispatch(clearError()); }} />
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <CustomInput
            id="reg-name"
            label="Full Name"
            name="name"
            placeholder="Dr. Jane Smith"
            icon={User}
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
          <CustomInput
            id="reg-email"
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
            id="reg-password"
            label="Password"
            type="password"
            name="password"
            placeholder="Min. 6 characters"
            icon={Lock}
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          <CustomInput
            id="reg-confirm"
            label="Confirm Password"
            type="password"
            name="confirm"
            placeholder="Re-enter password"
            icon={Lock}
            value={form.confirm}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <CustomButton type="submit" fullWidth loading={loading} size="lg">
            Create Account
          </CustomButton>
        </form>

        <p className="auth-box__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-box__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
