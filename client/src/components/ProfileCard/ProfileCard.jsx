import { useSelector } from 'react-redux';
import { Heart, Pill, AlertTriangle, Droplet, Calendar } from 'lucide-react';
import './ProfileCard.css';

const BLOOD_GROUP_COLORS = {
  'A+': '#ef4444', 'A-': '#f87171',
  'B+': '#f97316', 'B-': '#fb923c',
  'AB+': '#8b5cf6', 'AB-': '#a78bfa',
  'O+': '#22c55e', 'O-': '#4ade80',
};

export default function ProfileCard({ onEditHealth }) {
  const { user, healthProfile } = useSelector((s) => s.user);

  return (
    <div className="profile-card">
      {/* Avatar */}
      <div className="profile-card__header">
        <div className="profile-card__avatar">
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <h3 className="profile-card__name">{user?.name || 'User'}</h3>
          <p className="profile-card__email">{user?.email}</p>
        </div>
      </div>

      <div className="profile-card__divider" />

      {/* Health stats */}
      <div className="profile-card__health-grid">
        <div className="health-stat">
          <Calendar size={14} className="health-stat__icon" />
          <span className="health-stat__label">Age</span>
          <span className="health-stat__value">
            {healthProfile?.age ? `${healthProfile.age} yrs` : '—'}
          </span>
        </div>

        <div className="health-stat">
          <Droplet size={14} className="health-stat__icon" />
          <span className="health-stat__label">Blood</span>
          <span
            className="health-stat__value"
            style={{ color: BLOOD_GROUP_COLORS[healthProfile?.blood_group] || 'inherit' }}
          >
            {healthProfile?.blood_group || '—'}
          </span>
        </div>
      </div>

      {healthProfile?.allergies && (
        <div className="profile-card__info-row">
          <AlertTriangle size={14} className="profile-card__info-icon profile-card__info-icon--warn" />
          <div>
            <span className="profile-card__info-label">Allergies</span>
            <p className="profile-card__info-text">{healthProfile.allergies}</p>
          </div>
        </div>
      )}

      {healthProfile?.pre_existing_cond && (
        <div className="profile-card__info-row">
          <Heart size={14} className="profile-card__info-icon profile-card__info-icon--red" />
          <div>
            <span className="profile-card__info-label">Conditions</span>
            <p className="profile-card__info-text">{healthProfile.pre_existing_cond}</p>
          </div>
        </div>
      )}

      {healthProfile?.current_medications && (
        <div className="profile-card__info-row">
          <Pill size={14} className="profile-card__info-icon profile-card__info-icon--blue" />
          <div>
            <span className="profile-card__info-label">Medications</span>
            <p className="profile-card__info-text">{healthProfile.current_medications}</p>
          </div>
        </div>
      )}

      {!healthProfile && (
        <p className="profile-card__empty">No health profile set up yet.</p>
      )}

      <button className="profile-card__edit-btn" onClick={onEditHealth}>
        {healthProfile ? 'Edit Health Profile' : 'Set Up Health Profile'}
      </button>
    </div>
  );
}
