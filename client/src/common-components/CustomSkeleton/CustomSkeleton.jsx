import './CustomSkeleton.css';

export default function CustomSkeleton({ width = '100%', height = '1rem', rounded = false, className = '' }) {
  return (
    <div
      className={`custom-skeleton ${rounded ? 'custom-skeleton--rounded' : ''} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonBlock({ lines = 3 }) {
  return (
    <div className="skeleton-block">
      {Array.from({ length: lines }).map((_, i) => (
        <CustomSkeleton
          key={i}
          width={i === lines - 1 ? '65%' : '100%'}
          height="0.9rem"
        />
      ))}
    </div>
  );
}

export function SkeletonMessage({ isUser = false }) {
  return (
    <div className={`skeleton-message ${isUser ? 'skeleton-message--user' : ''}`}>
      {!isUser && <CustomSkeleton width="2rem" height="2rem" rounded className="skeleton-avatar" />}
      <div className="skeleton-message__body">
        <CustomSkeleton width={isUser ? '60%' : '85%'} height="0.9rem" />
        <CustomSkeleton width={isUser ? '40%' : '70%'} height="0.9rem" />
      </div>
    </div>
  );
}
