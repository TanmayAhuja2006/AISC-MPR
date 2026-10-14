import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Activity, Plus, TrendingUp, Shield, Zap } from 'lucide-react';
import { fetchSessions, createSession } from '../../redux/chatSlice';
import { fetchHealthProfile } from '../../redux/userSlice';
import ProfileCard from '../../components/ProfileCard/ProfileCard';
import CustomCard from '../../common-components/CustomCard/CustomCard';
import CustomButton from '../../common-components/CustomButton/CustomButton';
import './Dashboard.css';

const FEATURES = [
  {
    icon: Shield,
    color: '#22c55e',
    title: 'Safety Classifier',
    desc: 'Every query is screened by our fine-tuned BERT model before processing.',
  },
  {
    icon: Zap,
    color: '#f59e0b',
    title: 'RAG-Powered',
    desc: 'Answers are grounded in your actual uploaded medical documents via FAISS.',
  },
  {
    icon: TrendingUp,
    color: '#8b5cf6',
    title: 'Personalised',
    desc: 'Your health profile — age, conditions, medications — is injected into every answer.',
  },
];

export default function Dashboard() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { sessions, creating, error } = useSelector((s) => s.chat);

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchHealthProfile());
  }, [dispatch]);

  const handleNewChat = async () => {
    if (creating) return;
    try {
      const session = await dispatch(createSession('New Chat')).unwrap();
      navigate('/chat', { state: { sessionId: session.id } });
    } catch {
      // Error is stored on chatSlice; button stays enabled so the user can retry.
    }
  };

  return (
    <div className="dashboard">
      {/* Hero */}
      <section className="dashboard__hero">
        <div className="dashboard__hero-inner">
          <div className="dashboard__hero-badge">
            <Activity size={13} />
            <span>Healthcare AI Assistant</span>
          </div>
          <h1 className="dashboard__hero-title">
            Your Personalised<br />
            <span className="dashboard__hero-gradient">Medical AI</span>
          </h1>
          <p className="dashboard__hero-sub">
            Upload medical reports, ask questions, and get AI-powered answers
            grounded in your documents and tailored to your health profile.
          </p>
          <div className="dashboard__hero-actions">
            <CustomButton size="lg" onClick={handleNewChat} loading={creating} disabled={creating}>
              <Plus size={18} />
              Start New Chat
            </CustomButton>
            <CustomButton size="lg" variant="secondary" onClick={() => navigate('/chat')}>
              <MessageCircle size={18} />
              View Chats
            </CustomButton>
          </div>
          {error && (
            <p className="dashboard__hero-sub" role="alert" style={{ color: '#f87171', marginTop: '0.75rem' }}>
              {error}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="dashboard__stats">
          <div className="stat-chip">
            <MessageCircle size={16} className="stat-chip__icon" />
            <span className="stat-chip__val">{sessions.length}</span>
            <span className="stat-chip__label">Sessions</span>
          </div>
          <div className="stat-chip">
            <Shield size={16} className="stat-chip__icon stat-chip__icon--green" />
            <span className="stat-chip__val">100%</span>
            <span className="stat-chip__label">Safe</span>
          </div>
          <div className="stat-chip">
            <Zap size={16} className="stat-chip__icon stat-chip__icon--yellow" />
            <span className="stat-chip__val">RAG</span>
            <span className="stat-chip__label">Powered</span>
          </div>
          {error && (
            <p className="dashboard__hero-sub" role="alert" style={{ color: '#f87171', marginTop: '0.75rem' }}>
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Main grid */}
      <section className="dashboard__grid">
        {/* Left: Profile */}
        <aside className="dashboard__sidebar">
          <h2 className="dashboard__section-title">Your Profile</h2>
          <ProfileCard onEditHealth={() => navigate('/profile')} />
        </aside>

        {/* Right: Features + recent sessions */}
        <div className="dashboard__content">
          {/* Feature cards */}
          <h2 className="dashboard__section-title">How It Works</h2>
          <div className="dashboard__features">
            {FEATURES.map((f) => (
              <CustomCard key={f.title} glass hover className="feature-card">
                <div className="feature-card__icon" style={{ color: f.color, background: `${f.color}18` }}>
                  <f.icon size={20} />
                </div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </CustomCard>
            ))}
          </div>

          {/* Recent sessions */}
          <h2 className="dashboard__section-title">Recent Chats</h2>
          {sessions.length === 0 ? (
            <div className="dashboard__empty">
              <MessageCircle size={32} />
              <p>No chat sessions yet. Start one above!</p>
            </div>
          ) : (
            <div className="dashboard__sessions">
              {sessions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  className="session-row"
                  onClick={() => navigate('/chat', { state: { sessionId: s.id } })}
                >
                  <MessageCircle size={16} className="session-row__icon" />
                  <span className="session-row__title">{s.title}</span>
                  <span className="session-row__date">
                    {new Date(s.updated_at || s.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
