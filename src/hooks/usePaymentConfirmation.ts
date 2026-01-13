import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPayPalPayment, confirmHelloAssoPayment } from '../api/inscriptions';
import { confirmPayPalOrderPayment, confirmHelloAssoOrderPayment } from '../api/orders';
import { confirmPayPalBalanceRecharge, confirmHelloAssoBalanceRecharge } from '../api/balance';
import { logger } from '../utils/logger';
import { getErrorMessage, isCapacityExceededError } from '../types/errors';

type PaymentType = 'recharge' | 'order' | 'inscription';
type PaymentProvider = 'paypal' | 'helloasso';

interface PaymentResult {
  success: boolean;
  type: PaymentType | null;
  provider: PaymentProvider | null;
  message: string;
  redirectTo: string;
}

interface PaymentStorageData {
  type: PaymentType;
  id: number;
  storageKey: string;
}

/**
 * Safely parse an integer from storage
 * Returns null if invalid to prevent manipulation attacks
 */
const safeParseInt = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > Number.MAX_SAFE_INTEGER) {
    return null;
  }
  return parsed;
};

/**
 * Get payment data from sessionStorage
 * Centralizes access and cleanup of payment IDs
 */
const getPaymentStorageData = (provider: PaymentProvider): PaymentStorageData | null => {
  const prefix = provider === 'paypal' ? 'paypal' : 'helloasso';

  // Check in order of priority: recharge, order, inscription
  const types: PaymentType[] = ['recharge', 'order', 'inscription'];

  for (const type of types) {
    const storageKey = `${prefix}_${type}_id`;
    const rawId = sessionStorage.getItem(storageKey);
    const id = safeParseInt(rawId);

    if (id !== null) {
      return { type, id, storageKey };
    }
  }

  return null;
};

/**
 * Clear payment data from sessionStorage
 */
const clearPaymentStorage = (storageKey: string): void => {
  sessionStorage.removeItem(storageKey);
};

/**
 * Process PayPal payment confirmation
 */
const confirmPayPal = async (
  type: PaymentType,
  id: number,
  paypalToken: string
): Promise<void> => {
  switch (type) {
    case 'recharge':
      await confirmPayPalBalanceRecharge(id, paypalToken);
      break;
    case 'order':
      await confirmPayPalOrderPayment(id, paypalToken);
      break;
    case 'inscription':
      await confirmPayPalPayment(id, paypalToken);
      break;
  }
};

/**
 * Process HelloAsso payment confirmation
 */
const confirmHelloAsso = async (
  type: PaymentType,
  id: number,
  checkoutIntentId: string
): Promise<void> => {
  switch (type) {
    case 'recharge':
      await confirmHelloAssoBalanceRecharge(id, { checkoutIntentId });
      break;
    case 'order':
      await confirmHelloAssoOrderPayment(id, checkoutIntentId);
      break;
    case 'inscription':
      await confirmHelloAssoPayment(id, checkoutIntentId);
      break;
  }
};

/**
 * Get success message based on payment type
 */
const getSuccessMessage = (type: PaymentType, provider: PaymentProvider): string => {
  const providerName = provider === 'paypal' ? 'PayPal' : 'HelloAsso';

  switch (type) {
    case 'recharge':
      return 'Recharge effectuée avec succès ! Votre solde a été mis à jour.';
    case 'order':
      return `Paiement ${providerName} effectué avec succès ! Votre commande est confirmée.`;
    case 'inscription':
      return `Paiement ${providerName} effectué avec succès ! Votre inscription est confirmée.`;
  }
};

/**
 * Get redirect path based on payment type
 */
const getRedirectPath = (type: PaymentType): string => {
  return type === 'recharge' ? '/balance' : '/my-account';
};

/**
 * Hook for handling payment callback confirmation
 */
export function usePaymentConfirmation(clearCart: () => void) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const processPayment = useCallback(async (): Promise<PaymentResult> => {
    // PayPal returns ?token=xxx
    const paypalToken = searchParams.get('token');
    // HelloAsso returns ?checkoutIntentId=xxx&code=succeeded
    const checkoutIntentId = searchParams.get('checkoutIntentId');
    const helloassoCode = searchParams.get('code');

    // Handle PayPal payment
    if (paypalToken) {
      const paymentData = getPaymentStorageData('paypal');

      if (!paymentData) {
        return {
          success: false,
          type: null,
          provider: 'paypal',
          message: 'Données de paiement manquantes pour PayPal.',
          redirectTo: '/my-account',
        };
      }

      try {
        await confirmPayPal(paymentData.type, paymentData.id, paypalToken);
        clearPaymentStorage(paymentData.storageKey);

        if (paymentData.type === 'order') {
          clearCart();
        }

        return {
          success: true,
          type: paymentData.type,
          provider: 'paypal',
          message: getSuccessMessage(paymentData.type, 'paypal'),
          redirectTo: getRedirectPath(paymentData.type),
        };
      } catch (error) {
        logger.error('PayPal payment confirmation error', error);
        return {
          success: false,
          type: paymentData.type,
          provider: 'paypal',
          message: getErrorMessage(error),
          redirectTo: '/my-account',
        };
      }
    }

    // Handle HelloAsso payment
    if (checkoutIntentId) {
      const paymentData = getPaymentStorageData('helloasso');

      if (!paymentData) {
        return {
          success: false,
          type: null,
          provider: 'helloasso',
          message: 'Données de paiement manquantes pour HelloAsso.',
          redirectTo: '/my-account',
        };
      }

      // Check if payment was cancelled
      if (helloassoCode !== 'succeeded') {
        clearPaymentStorage(paymentData.storageKey);
        return {
          success: false,
          type: paymentData.type,
          provider: 'helloasso',
          message: 'Le paiement a été annulé ou a échoué.',
          redirectTo: paymentData.type === 'inscription' ? '/events' : '/my-account',
        };
      }

      try {
        await confirmHelloAsso(paymentData.type, paymentData.id, checkoutIntentId);
        clearPaymentStorage(paymentData.storageKey);

        if (paymentData.type === 'order') {
          clearCart();
        }

        return {
          success: true,
          type: paymentData.type,
          provider: 'helloasso',
          message: getSuccessMessage(paymentData.type, 'helloasso'),
          redirectTo: getRedirectPath(paymentData.type),
        };
      } catch (error) {
        logger.error('HelloAsso payment confirmation error', error);

        let errorMessage = getErrorMessage(error);
        if (isCapacityExceededError(error)) {
          errorMessage = 'Problème de capacité ou remboursement automatique.';
        }

        return {
          success: false,
          type: paymentData.type,
          provider: 'helloasso',
          message: errorMessage,
          redirectTo: '/my-account',
        };
      }
    }

    // No payment info found
    return {
      success: false,
      type: null,
      provider: null,
      message: 'Informations de paiement manquantes',
      redirectTo: '/my-account',
    };
  }, [searchParams, clearCart]);

  useEffect(() => {
    if (hasProcessed) return;

    const handlePayment = async () => {
      setHasProcessed(true);
      const paymentResult = await processPayment();
      setResult(paymentResult);
      setProcessing(false);
    };

    handlePayment();
  }, [hasProcessed, processPayment]);

  // Navigate after result is set
  useEffect(() => {
    if (result && !processing) {
      navigate(result.redirectTo);
    }
  }, [result, processing, navigate]);

  return {
    processing,
    result,
  };
}
