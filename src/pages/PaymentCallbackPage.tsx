import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { confirmPayPalPayment, confirmHelloAssoPayment } from '../api/inscriptions';

const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      // PayPal returns ?token=xxx (orderId) when payment is approved
      const paypalToken = searchParams.get('token');

      // HelloAsso renvoie généralement des paramètres comme:
      // ?checkoutIntentId=xxx&code=succeeded
      const checkoutIntentId = searchParams.get('checkoutIntentId');
      const code = searchParams.get('code');

      console.log('Payment callback params:', { paypalToken, checkoutIntentId, code });

      // Handle PayPal payment
      if (paypalToken) {
        try {
          const inscriptionId = sessionStorage.getItem('paypal_inscription_id');
          const orderId = sessionStorage.getItem('paypal_order_id');

          if (!inscriptionId || !orderId) {
            addNotification('error', 'Données de paiement manquantes');
            navigate('/my-account');
            return;
          }

          // Confirm PayPal payment with backend
          await confirmPayPalPayment(parseInt(inscriptionId), orderId);

          // Clear session storage
          sessionStorage.removeItem('paypal_inscription_id');
          sessionStorage.removeItem('paypal_order_id');

          addNotification('success', 'Paiement PayPal effectué avec succès ! Votre inscription est confirmée.');

          setTimeout(() => {
            navigate('/my-account');
          }, 2000);
        } catch (error: any) {
          console.error('PayPal payment confirmation error:', error);
          addNotification('error', error.message || 'Erreur lors de la confirmation du paiement PayPal');
          navigate('/my-account');
        }
        setProcessing(false);
        return;
      }

      // Handle HelloAsso payment
      if (checkoutIntentId) {
        try {
          const inscriptionId = sessionStorage.getItem('helloasso_inscription_id');

          if (!inscriptionId) {
            addNotification('error', 'Données de paiement manquantes');
            navigate('/my-account');
            return;
          }

          // Si le code indique un succès, confirmer le paiement avec le backend
          if (code === 'succeeded') {
            await confirmHelloAssoPayment(parseInt(inscriptionId), checkoutIntentId);

            // Clear session storage
            sessionStorage.removeItem('helloasso_inscription_id');

            addNotification('success', 'Paiement HelloAsso effectué avec succès ! Votre inscription est confirmée.');

            setTimeout(() => {
              navigate('/my-account');
            }, 2000);
          } else {
            addNotification('error', 'Le paiement a été annulé ou a échoué.');
            navigate('/events');
          }
        } catch (error: any) {
          console.error('HelloAsso payment confirmation error:', error);

          // Check if it's a capacity exceeded error
          if (error.message?.includes('capacity exceeded') || error.message?.includes('refunded')) {
            addNotification('error', 'Plus de places disponibles. Votre paiement a été automatiquement remboursé.');
          } else {
            addNotification('error', error.message || 'Erreur lors de la confirmation du paiement HelloAsso');
          }

          navigate('/my-account');
        }
        setProcessing(false);
        return;
      }

      // No payment info found
      addNotification('error', 'Informations de paiement manquantes');
      navigate('/my-account');
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
