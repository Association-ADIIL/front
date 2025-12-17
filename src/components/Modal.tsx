import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto pt-4 sm:pt-24">
      <div className="bg-darker-bg border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl relative animate-fadeIn flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-8rem)] my-2 sm:my-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold font-koulen text-accent-mint">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;