import './CustomCard.css';

export default function CustomCard({ children, className = '', glass = false, hover = false, ...rest }) {
  return (
    <div
      className={`custom-card ${glass ? 'custom-card--glass' : ''} ${hover ? 'custom-card--hover' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
