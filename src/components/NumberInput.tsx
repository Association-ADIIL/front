import React, { type InputHTMLAttributes } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: string | number;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
  showArrows?: boolean;
  step?: number;
  min?: number;
  max?: number;
}

/**
 * Number input component that accepts both . and , as decimal separators
 * With optional increment/decrement arrows
 */
const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  allowDecimals = true,
  showArrows = true,
  step = 1,
  min,
  max,
  className = '',
  disabled,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Replace comma with dot for decimal separator
    inputValue = inputValue.replace(',', '.');

    // Allow empty string, numbers, and one decimal point
    if (allowDecimals) {
      // Allow: empty, digits, one dot, negative sign at start
      if (inputValue === '' || inputValue === '-' || /^-?\d*\.?\d*$/.test(inputValue)) {
        onChange(inputValue);
      }
    } else {
      // Only allow integers
      if (inputValue === '' || inputValue === '-' || /^-?\d*$/.test(inputValue)) {
        onChange(inputValue);
      }
    }
  };

  // Disable scroll wheel changing the value
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const increment = () => {
    if (disabled) return;
    const currentValue = parseFloat(String(value).replace(',', '.')) || 0;
    let newValue = currentValue + step;
    if (max !== undefined && newValue > max) newValue = max;
    onChange(allowDecimals ? newValue.toString() : Math.round(newValue).toString());
  };

  const decrement = () => {
    if (disabled) return;
    const currentValue = parseFloat(String(value).replace(',', '.')) || 0;
    let newValue = currentValue - step;
    if (min !== undefined && newValue < min) newValue = min;
    onChange(allowDecimals ? newValue.toString() : Math.round(newValue).toString());
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onWheel={handleWheel}
        disabled={disabled}
        className={`${className} ${showArrows ? 'pr-6' : ''}`}
        {...props}
      />
      {showArrows && (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-gray-600">
          <button
            type="button"
            onClick={increment}
            disabled={disabled || (max !== undefined && parseFloat(String(value).replace(',', '.')) >= max)}
            className="flex-1 px-1 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            onClick={decrement}
            disabled={disabled || (min !== undefined && parseFloat(String(value).replace(',', '.')) <= min)}
            className="flex-1 px-1 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors border-t border-gray-600"
            tabIndex={-1}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NumberInput;
