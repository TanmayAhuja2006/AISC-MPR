import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  Droplet,
  Calendar,
  AlertTriangle,
  Pill,
  Save,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { saveHealthProfile, fetchHealthProfile } from '../../redux/userSlice';
import api from '../../services/api';
import CustomInput from '../../common-components/CustomInput/CustomInput';
import CustomButton from '../../common-components/CustomButton/CustomButton';
import CustomAlert from '../../common-components/CustomAlert/CustomAlert';
import ProfileCard from '../../components/ProfileCard/ProfileCard';
import './Profile.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, healthProfile } = useSelector((s) => s.user);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    age: healthProfile?.age ? String(healthProfile.age) : '',
    blood_group: healthProfile?.blood_group || '',
    allergies: healthProfile?.allergies || '',
    pre_existing_cond: healthProfile?.pre_existing_cond || '',
    current_medications: healthProfile?.current_medications || '',
  }));

  useEffect(() => {
    dispatch(fetchHealthProfile());
  }, [dispatch]);

  // Sync state when health profile or user details arrive from backend
  useEffect(() => {
    if (user || healthProfile) {
      setForm((prev) => ({
        name: user?.name ?? prev.name,
        age: healthProfile?.age ? String(healthProfile.age) : prev.age,
        blood_group: healthProfile?.blood_group ?? prev.blood_group,
        allergies: healthProfile?.allergies ?? prev.allergies,
        pre_existing_cond: healthProfile?.pre_existing_cond ?? prev.pre_existing_cond,
        current_medications: healthProfile?.current_medications ?? prev.current_medications,
      }));
    }
  }, [user, healthProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Update user name if changed
      if (form.name && form.name !== user?.name) {
        await api.put('/users/profile', { name: form.name });
      }

      // 2. Upsert health profile
      const payload = {
        age: form.age ? parseInt(form.age, 10) : null,
        blood_group: form.blood_group || null,
        allergies: form.allergies.trim() || null,
        pre_existing_cond: form.pre_existing_cond.trim() || null,
        current_medications: form.current_medications.trim() || null,
      };

      await dispatch(saveHealthProfile(payload)).unwrap();
      toast.success('Health profile saved successfully!');
      setSuccessMsg('Your health profile has been updated and will be used by MedRAG.');
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to update profile. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <button
          className="profile-page__back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <h1 className="profile-page__title">Health & Account Profile</h1>
        <p className="profile-page__sub">
          Your medical background is securely provided to the RAG engine to deliver
          personalised, context-aware answers.
        </p>
      </div>

      {successMsg && (
        <CustomAlert
          type="success"
          message={successMsg}
          onDismiss={() => setSuccessMsg('')}
        />
      )}
      {errorMsg && (
        <CustomAlert
          type="error"
          message={errorMsg}
          onDismiss={() => setErrorMsg('')}
        />
      )}

      <div className="profile-page__grid">
        {/* Form Column */}
        <div className="profile-page__form-card">
          <form onSubmit={handleSubmit} className="profile-form">
            {/* Account Info */}
            <div className="profile-section">
              <h2 className="profile-section__title">Account Details</h2>
              <div className="profile-fields-row">
                <CustomInput
                  id="profile-name"
                  label="Full Name"
                  name="name"
                  icon={User}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
                <CustomInput
                  id="profile-email"
                  label="Email Address"
                  name="email"
                  value={user?.email || ''}
                  disabled
                  helperText="Email address cannot be changed."
                />
              </div>
            </div>

            {/* Health Info */}
            <div className="profile-section">
              <h2 className="profile-section__title">Medical & Health Profile</h2>

              <div className="profile-fields-row">
                <CustomInput
                  id="profile-age"
                  label="Age"
                  name="age"
                  type="number"
                  min="1"
                  max="130"
                  icon={Calendar}
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 35"
                />

                <div className="profile-select-group">
                  <label htmlFor="profile-blood" className="profile-select-label">
                    <Droplet size={15} />
                    <span>Blood Group</span>
                  </label>
                  <select
                    id="profile-blood"
                    name="blood_group"
                    className="profile-select"
                    value={form.blood_group}
                    onChange={handleChange}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="profile-textarea-group">
                <label htmlFor="profile-allergies" className="profile-textarea-label">
                  <AlertTriangle size={15} className="label-icon-warn" />
                  <span>Known Allergies</span>
                </label>
                <textarea
                  id="profile-allergies"
                  name="allergies"
                  className="profile-textarea"
                  rows={2}
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="e.g., Penicillin, Peanuts, Latex (comma separated)"
                />
              </div>

              <div className="profile-textarea-group">
                <label htmlFor="profile-conditions" className="profile-textarea-label">
                  <Heart size={15} className="label-icon-danger" />
                  <span>Pre-existing Conditions</span>
                </label>
                <textarea
                  id="profile-conditions"
                  name="pre_existing_cond"
                  className="profile-textarea"
                  rows={2}
                  value={form.pre_existing_cond}
                  onChange={handleChange}
                  placeholder="e.g., Type 2 Diabetes, Hypertension, Asthma"
                />
              </div>

              <div className="profile-textarea-group">
                <label htmlFor="profile-medications" className="profile-textarea-label">
                  <Pill size={15} className="label-icon-info" />
                  <span>Current Medications</span>
                </label>
                <textarea
                  id="profile-medications"
                  name="current_medications"
                  className="profile-textarea"
                  rows={2}
                  value={form.current_medications}
                  onChange={handleChange}
                  placeholder="e.g., Metformin 500mg daily, Lisinopril 10mg"
                />
              </div>
            </div>

            <div className="profile-form__actions">
              <CustomButton
                type="submit"
                size="lg"
                loading={saving}
              >
                <Save size={18} />
                Save Health Profile
              </CustomButton>
            </div>
          </form>
        </div>

        {/* Sidebar Preview Column */}
        <aside className="profile-page__sidebar">
          <div className="profile-preview-sticky">
            <h2 className="profile-sidebar__heading">Live Card Preview</h2>
            <ProfileCard />
            <div className="profile-privacy-note">
              <CheckCircle size={15} />
              <span>
                Your health data is stored strictly in your local database and only
                used to contextualize AI responses.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
