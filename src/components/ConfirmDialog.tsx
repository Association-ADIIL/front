import React, { useEffect } from 'react';
import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'warning',
  loading = false,
}) => {
  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertCircle,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-400',
          button: 'bg-red-500 hover:bg-red-400',
          border: 'border-red-500/20',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-yellow-500/10',
          iconColor: 'text-yellow-400',
          button: 'bg-yellow-500 hover:bg-yellow-400 text-darker-bg',
          border: 'border-yellow-500/20',
        };
      case 'info':
        return {
          icon: Info,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-400',
          button: 'bg-blue-500 hover:bg-blue-400',
          border: 'border-blue-500/20',
        };
      default:
        return {
          icon: AlertTriangle,
          iconBg: 'bg-yellow-500/10',
          iconColor: 'text-yellow-400',
          button: 'bg-yellow-500 hover:bg-yellow-400 text-darker-bg',
          border: 'border-yellow-500/20',
        };
    }
  };

  const config = getVariantConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-darker-bg border border-gray-800 ${config.border} rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn`}>
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center`}>
              <IconComponent size={20} className={config.iconColor} />
            </div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-gray-400 text-sm mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-dark-bg border border-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.button}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
