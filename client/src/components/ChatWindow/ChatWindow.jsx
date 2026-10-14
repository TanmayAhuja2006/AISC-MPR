import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { sendMessage, addOptimisticMessage } from '../../redux/chatSlice';
import { SkeletonMessage } from '../../common-components/CustomSkeleton/CustomSkeleton';
import './ChatWindow.css';

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--assistant'}`}>
      <div className="chat-msg__avatar">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="chat-msg__content">
        <div className="chat-msg__bubble">
          {isUser ? (
            <p className="chat-msg__text">{msg.content}</p>
          ) : (
            <div className="chat-msg__markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )}
          {msg._optimistic && (
            <div className="chat-msg__typing">
              <Loader2 size={14} className="chat-msg__typing-icon" />
              <span>Thinking…</span>
            </div>
          )}
        </div>

        {/* Source citations */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="chat-sources">
            <button
              className="chat-sources__toggle"
              onClick={() => setShowSources((v) => !v)}
            >
              <FileText size={13} />
              {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
              <ChevronDown
                size={13}
                style={{ transform: showSources ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>
            {showSources && (
              <div className="chat-sources__list">
                {msg.sources.map((s, i) => (
                  <div key={i} className="chat-source-item">
                    <span className="chat-source-item__label">{s.source || 'Document'}</span>
                    <p className="chat-source-item__text">{s.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {msg.created_at && (
          <span className="chat-msg__time">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({ sessionId }) {
  const dispatch  = useDispatch();
  const { messages, sending, loading } = useSelector((s) => s.chat);
  const [input, setInput]   = useState('');
  const bottomRef           = useRef(null);
  const textareaRef         = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || sending || !sessionId) return;

    const userMsg = {
      id:      Date.now(),
      role:    'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    const optimisticAssistant = {
      id:          Date.now() + 1,
      role:        'assistant',
      content:     '',
      sources:     [],
      _optimistic: true,
      created_at:  new Date().toISOString(),
    };

    dispatch(addOptimisticMessage(userMsg));
    dispatch(addOptimisticMessage(optimisticAssistant));

    dispatch(sendMessage({ sessionId, message: input.trim() }));
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!sessionId) {
    return (
      <div className="chat-empty">
        <Bot size={48} className="chat-empty__icon" />
        <h3>Start a Medical AI Conversation</h3>
        <p>Select an existing session or create a new one to begin.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Messages area */}
      <div className="chat-window__messages">
        {loading ? (
          <>
            <SkeletonMessage />
            <SkeletonMessage isUser />
            <SkeletonMessage />
          </>
        ) : messages.length === 0 ? (
          <div className="chat-start-hint">
            <Bot size={36} className="chat-start-hint__icon" />
            <p>Say hello, ask a general question, or ask about your health and uploaded reports.</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chat-input-bar__textarea"
          placeholder="Ask anything… (Shift+Enter for new line)"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
          aria-label="Chat input"
        />
        <button
          type="submit"
          className="chat-input-bar__send"
          disabled={!input.trim() || sending}
          aria-label="Send message"
        >
          {sending ? <Loader2 size={20} className="chat-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
}
