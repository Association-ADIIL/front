import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Sélectionner...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSelectedLabels = () => {
    return options
      .filter(option => selectedValues.includes(option.value))
      .map(option => option.label);
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-gray-400 font-bold block mb-2 text-sm">{label}</label>

      <div
        onClick={handleToggle}
        className="w-full bg-dark-bg border border-gray-600 rounded px-4 py-2 text-white focus:border-accent-mint outline-none cursor-pointer min-h-[42px] flex items-center justify-between"
      >
        <div className="flex-1 flex flex-wrap gap-1 items-center">
          {selectedLabels.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedLabels.map((label, index) => {
              const option = options.find(opt => opt.label === label);
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-accent-mint text-darker-bg px-2 py-1 rounded text-xs font-semibold"
                >
                  {label}
                  <button
                    onClick={(e) => handleRemove(option!.value, e)}
                    className="hover:bg-darker-bg/20 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          {selectedValues.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-dark-bg border border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-accent-mint text-darker-bg font-semibold'
                    : 'text-white hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="text-darker-bg font-bold">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
