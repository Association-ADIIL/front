import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { confirmPayPalPayment, confirmHelloAssoPayment } from '../api/inscriptions';
import { confirmPayPalOrderPayment, confirmHelloAssoOrderPayment } from '../api/orders';
import { confirmPayPalBalanceRecharge, confirmHelloAssoBalanceRecharge } from '../api/balance';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PaymentCallbackPage: React.FC = () => {
  useDocumentTitle('Paiement');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { clearCart } = useCart();
  const [processing, setProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (hasProcessed) return;

    const processPayment = async () => {
      setHasProcessed(true);
      // PayPal returns ?token=xxx (orderId) when payment is approved
      const paypalToken = searchParams.get('token');

      // HelloAsso renvoie généralement des paramètres comme:
      // ?checkoutIntentId=xxx&code=succeeded
      const checkoutIntentId = searchParams.get('checkoutIntentId');
      const code = searchParams.get('code');

      // Handle PayPal payment
      if (paypalToken) {
        try {
          // Check if it's a recharge
          const paypalRechargeId = sessionStorage.getItem('paypal_recharge_id');
          if (paypalRechargeId) {
            await confirmPayPalBalanceRecharge(parseInt(paypalRechargeId), paypalToken);
            sessionStorage.removeItem('paypal_recharge_id');
            addNotification('success', 'Recharge effectuée avec succès ! Votre solde a été mis à jour.');
            navigate('/balance');
            setProcessing(false);
            return;
          }

          // Check if it's an order
          const paypalOrderId = sessionStorage.getItem('paypal_order_id');
          if (paypalOrderId) {
            await confirmPayPalOrderPayment(parseInt(paypalOrderId), paypalToken);
            sessionStorage.removeItem('paypal_order_id');
            clearCart();
            addNotification('success', 'Paiement PayPal effectué avec succès ! Votre commande est confirmée.');
            navigate('/my-account');
            setProcessing(false);
            return;
          }

          // Check if it's an inscription
          const paypalInscriptionId = sessionStorage.getItem('paypal_inscription_id');
          if (paypalInscriptionId) {
            await confirmPayPalPayment(parseInt(paypalInscriptionId), paypalToken);
            sessionStorage.removeItem('paypal_inscription_id');
            addNotification('success', 'Paiement PayPal effectué avec succès ! Votre inscription est confirmée.');
            navigate('/my-account');
            setProcessing(false);
            return;
          }

          // No matching ID found
          addNotification('error', 'Données de paiement manquantes pour PayPal.');
          navigate('/my-account');
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
          // Check if it's a recharge
          const helloassoRechargeId = sessionStorage.getItem('helloasso_recharge_id');
          if (helloassoRechargeId) {
            if (code === 'succeeded') {
              await confirmHelloAssoBalanceRecharge(parseInt(helloassoRechargeId), { checkoutIntentId });
              sessionStorage.removeItem('helloasso_recharge_id');
              addNotification('success', 'Recharge effectuée avec succès ! Votre solde a été mis à jour.');
              navigate('/balance');
            } else {
              addNotification('error', 'Le paiement a été annulé ou a échoué.');
              navigate('/balance');
            }
            setProcessing(false);
            return;
          }

          // Check if it's an order
          const helloassoOrderId = sessionStorage.getItem('helloasso_order_id');
          if (helloassoOrderId) {
            if (code === 'succeeded') {
              await confirmHelloAssoOrderPayment(parseInt(helloassoOrderId), checkoutIntentId);
              sessionStorage.removeItem('helloasso_order_id');
              clearCart();
              addNotification('success', 'Paiement HelloAsso effectué avec succès ! Votre commande est confirmée.');
              navigate('/my-account');
            } else {
              addNotification('error', 'Le paiement a été annulé ou a échoué.');
              navigate('/my-account');
            }
            setProcessing(false);
            return;
          }

          // Check if it's an inscription
          const helloassoInscriptionId = sessionStorage.getItem('helloasso_inscription_id');
          if (helloassoInscriptionId) {
            if (code === 'succeeded') {
              await confirmHelloAssoPayment(parseInt(helloassoInscriptionId), checkoutIntentId);
              sessionStorage.removeItem('helloasso_inscription_id');
              addNotification('success', 'Paiement HelloAsso effectué avec succès ! Votre inscription est confirmée.');
              navigate('/my-account');
            } else {
              addNotification('error', 'Le paiement a été annulé ou a échoué.');
              navigate('/events');
            }
            setProcessing(false);
            return;
          }

          // No matching ID found
          addNotification('error', 'Données de paiement manquantes pour HelloAsso.');
          navigate('/my-account');
        } catch (error: any) {
          console.error('HelloAsso payment confirmation error:', error);
          if (error.message?.includes('capacity exceeded') || error.message?.includes('refunded')) {
            addNotification('error', 'Problème de capacité ou remboursement automatique.');
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
  }, [searchParams, navigate, addNotification, clearCart]);

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
