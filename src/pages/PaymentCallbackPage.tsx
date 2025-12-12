import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      // HelloAsso renvoie généralement des paramètres comme:
      // ?checkoutIntentId=xxx&code=succeeded
      const checkoutIntentId = searchParams.get('checkoutIntentId');
      const code = searchParams.get('code');

      console.log('Payment callback params:', { checkoutIntentId, code });

      if (!checkoutIntentId) {
        addNotification('error', 'Informations de paiement manquantes');
        navigate('/my-account');
        return;
      }

      // Si le code indique un succès
      if (code === 'succeeded') {
        addNotification('success', 'Paiement effectué avec succès ! Votre inscription est confirmée.');

        // TODO: Appeler le backend pour confirmer le paiement si nécessaire
        // Mais HelloAsso envoie aussi un webhook, donc le backend peut déjà avoir confirmé

        setTimeout(() => {
          navigate('/my-account');
        }, 2000);
      } else {
        addNotification('error', 'Le paiement a été annulé ou a échoué.');
        navigate('/events');
      }

      setProcessing(false);
    };

    processPayment();
  }, [searchParams, navigate, addNotification]);

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
