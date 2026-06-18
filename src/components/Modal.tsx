import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  zIndex?: number;
  isDirty?: boolean; // true si des champs ont été remplis -> demande confirmation avant de fermer
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  zIndex?: number;
  isDirty?: boolean; // true si des champs ont été remplis -> demande confirmation avant de fermer
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, zIndex = 1000, isDirty = false }) => {
  // Lock body scroll when modal is open
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

  // Avertit avant fermeture d'onglet / rafraîchissement si la modale est ouverte avec des données non enregistrées
  useEffect(() => {
    if (!isOpen || !isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, isDirty]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    if (isDirty && !window.confirm('Des champs ont été remplis. Voulez-vous vraiment fermer sans enregistrer ?')) {
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      style={{ zIndex }}
      onClick={handleRequestClose}
    >
      <div
        className="bg-darker-bg border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl relative animate-fadeIn flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-bold font-koulen text-white">{title}</h2>
          <button
            onClick={handleRequestClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;