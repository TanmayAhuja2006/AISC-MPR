import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import './CustomAlert.css';

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

export default function CustomAlert({ type = 'info', message, onDismiss, className = '' }) {
  const [visible, setVisible] = useState(true);
  const Icon = ICONS[type];

  if (!visible || !message) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className={`custom-alert custom-alert--${type} ${className}`} role="alert">
      <Icon size={18} className="custom-alert__icon" />
      <span className="custom-alert__msg">{message}</span>
      <button className="custom-alert__close" onClick={dismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
