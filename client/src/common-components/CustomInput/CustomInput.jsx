import { forwardRef } from 'react';
import './CustomInput.css';

const CustomInput = forwardRef(function CustomInput(
  {
    label,
    id,
    type = 'text',
    placeholder,
    error,
    icon: Icon,
    className = '',
    ...rest
  },
  ref
) {
  return (
    <div className={`custom-input-wrapper ${error ? 'custom-input-wrapper--error' : ''} ${className}`}>
      {label && <label className="custom-input__label" htmlFor={id}>{label}</label>}
      <div className="custom-input__field-wrap">
        {Icon && <span className="custom-input__icon"><Icon size={16} /></span>}
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          className={`custom-input__field ${Icon ? 'custom-input__field--icon' : ''}`}
          {...rest}
        />
      </div>
      {error && <span className="custom-input__error">{error}</span>}
    </div>
  );
});

export default CustomInput;
