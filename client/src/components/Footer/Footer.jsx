import { Activity, Heart } from 'lucide-react';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Activity size={18} className="footer__brand-icon" />
          <span>MedRAG AI</span>
        </div>
        <p className="footer__disclaimer">
          ⚕️ This platform is for educational purposes only. Always consult a qualified healthcare professional.
        </p>
        <p className="footer__copy">
          © {CURRENT_YEAR} MedRAG AI · Built with <Heart size={12} className="footer__heart" /> using React + FastAPI
        </p>
      </div>
    </footer>
  );
}
