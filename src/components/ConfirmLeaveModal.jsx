import { AlertTriangle } from 'lucide-react';

/**
 * Modal de confirmation affichée quand l'utilisateur tente de quitter
 * une page avec des modifications non enregistrées.
 */
export default function ConfirmLeaveModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-darker-bg border border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-orange-500/20 p-2 rounded-full">
            <AlertTriangle className="text-orange-400" size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Modifications non enregistrées</h2>
            <p className="text-sm text-gray-400 mt-1">
              Vous avez des modifications non enregistrées. Si vous quittez cette page,
              elles seront perdues.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Rester sur la page
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-orange-500 text-white font-bold py-2 px-6 rounded hover:bg-orange-400 transition-colors"
          >
            Quitter sans enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}