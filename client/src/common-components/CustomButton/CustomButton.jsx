import './CustomButton.css';

/**
 * CustomButton – variants: primary | secondary | danger | ghost
 */
export default function CustomButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`custom-btn custom-btn--${variant} custom-btn--${size} ${fullWidth ? 'custom-btn--full' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <span className="custom-btn__spinner" aria-hidden="true" />
      ) : null}
      <span className={loading ? 'custom-btn__label--loading' : ''}>{children}</span>
    </button>
  );
}
