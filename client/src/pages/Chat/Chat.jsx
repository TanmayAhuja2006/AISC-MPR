import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import {
  Plus, Trash2, MessageCircle, Upload, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import {
  fetchSessions, createSession, loadSession, deleteSession
} from '../../redux/chatSlice';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import DocumentUploader from '../../components/DocumentUploader/DocumentUploader';
import './Chat.css';

export default function Chat() {
  const dispatch    = useDispatch();
  const location    = useLocation();
  const { sessionId: routeSessionId } = useParams();
  const { sessions, activeSessionId, creating } = useSelector((s) => s.chat);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab]                 = useState('chat'); // 'chat' | 'docs'

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  // Load the session from navigation state, /chat/:sessionId, or Redux
  useEffect(() => {
    const targetId = location.state?.sessionId || routeSessionId;
    if (targetId && String(targetId) !== String(activeSessionId)) {
      dispatch(loadSession(targetId));
    }
  }, [location.state, routeSessionId, activeSessionId, dispatch]);

  const handleNewChat = async () => {
    if (creating) return;
    try {
      await dispatch(createSession('New Chat')).unwrap();
    } catch {
      // Error lives on chatSlice
    }
  };

  const handleSelectSession = (sid) => {
    if (sid === activeSessionId) return;
    dispatch(loadSession(sid));
  };

  const handleDeleteSession = (e, sid) => {
    e.stopPropagation();
    dispatch(deleteSession(sid));
  };

  return (
    <div className="chat-page">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`chat-sidebar ${sidebarOpen ? '' : 'chat-sidebar--collapsed'}`}>
        <div className="chat-sidebar__header">
          {sidebarOpen && <span className="chat-sidebar__title">Sessions</span>}
          <div className="chat-sidebar__header-actions">
            {sidebarOpen && (
              <button
                className="chat-sidebar__btn"
                onClick={handleNewChat}
                disabled={creating}
                title="New chat"
                aria-label="New chat"
              >
                <Plus size={16} />
              </button>
            )}
            <button
              className="chat-sidebar__btn"
              onClick={() => setSidebarOpen((o) => !o)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="chat-sidebar__sessions">
            {sessions.length === 0 ? (
              <div className="chat-sidebar__empty">
                <MessageCircle size={24} />
                <p>No sessions</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`chat-sidebar__item ${s.id === activeSessionId ? 'chat-sidebar__item--active' : ''}`}
                  onClick={() => handleSelectSession(s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectSession(s.id)}
                >
                  <MessageCircle size={14} className="chat-sidebar__item-icon" />
                  <span className="chat-sidebar__item-title">{s.title}</span>
                  <button
                    className="chat-sidebar__item-del"
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    aria-label={`Delete ${s.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="chat-main">
        {/* Tab bar */}
        <div className="chat-main__tabs">
          <button
            className={`chat-tab ${tab === 'chat' ? 'chat-tab--active' : ''}`}
            onClick={() => setTab('chat')}
          >
            <MessageCircle size={15} />
            Chat
          </button>
          <button
            className={`chat-tab ${tab === 'docs' ? 'chat-tab--active' : ''}`}
            onClick={() => setTab('docs')}
          >
            <Upload size={15} />
            Documents
          </button>

          {/* Create session CTA in header */}
          {!activeSessionId && tab === 'chat' && (
            <button className="chat-new-btn" onClick={handleNewChat} disabled={creating}>
              <Plus size={15} />
              New Chat
            </button>
          )}
        </div>

        {/* Tab content */}
        {tab === 'chat' ? (
          <ChatWindow sessionId={activeSessionId} />
        ) : (
          <div className="chat-docs-panel">
            <h2 className="chat-docs-panel__title">Upload Medical Documents</h2>
            <p className="chat-docs-panel__sub">
              Upload PDF reports or images. They will be parsed, embedded, and indexed
              automatically so the AI can reference them in answers.
            </p>
            <DocumentUploader />
          </div>
        )}
      </div>
    </div>
  );
}
