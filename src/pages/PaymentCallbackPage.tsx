import React, { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePaymentConfirmation } from '../hooks/usePaymentConfirmation';

const PaymentCallbackPage: React.FC = () => {
  useDocumentTitle('Paiement');
  const { addNotification } = useNotification();
  const { clearCart } = useCart();
  const { processing, result } = usePaymentConfirmation(clearCart);

  // Show notification when result is available
  useEffect(() => {
    if (result) {
      addNotification(result.success ? 'success' : 'error', result.message);
    }
  }, [result, addNotification]);

  if (processing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-mint mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Traitement du paiement...</h2>
        <p className="text-gray-400">Veuillez patienter, nous vérifions votre paiement.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold">Redirection en cours...</h2>
    </div>
  );
};

export default PaymentCallbackPage;
