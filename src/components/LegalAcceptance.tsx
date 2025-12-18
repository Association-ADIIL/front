import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

interface LegalAcceptanceProps {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
  className?: string;
}

const LegalAcceptance: React.FC<LegalAcceptanceProps> = ({ accepted, onChange, className = '' }) => {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={accepted}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors pointer-events-none ${
          accepted
            ? 'bg-accent-mint border-accent-mint'
            : 'border-gray-600 group-hover:border-gray-500'
        }`}
      >
        {accepted && <Check size={14} className="text-darker-bg" />}
      </div>
      <span className="text-sm text-gray-400 leading-relaxed">
        J'accepte les{' '}
        <Link
          to="/cgu"
          target="_blank"
          className="text-accent-mint hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          CGU
        </Link>,{' '}
        les{' '}
        <Link
          to="/cgv"
          target="_blank"
          className="text-accent-mint hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          CGV
        </Link>{' '}
        et la{' '}
        <Link
          to="/confidentialite"
          target="_blank"
          className="text-accent-mint hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Politique de Confidentialité
        </Link>
      </span>
    </label>
  );
};

export default LegalAcceptance;
