import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { type Event } from '../api/events';
import { createInscription, type PaymentMethod } from '../api/inscriptions';
import { useNotification } from '../context/NotificationContext';
import { CreditCard, Wallet, Banknote } from 'lucide-react';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({ isOpen, onClose, event }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('HELLOASSO');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedOptions({});
      setPaymentMethod('HELLOASSO');
      setLoading(false);
    }
  }, [isOpen]);

  const handleOptionChange = (optionId: number, checked: boolean) => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      if (checked) {
        newOptions[optionId] = 1;
      } else {
        delete newOptions[optionId];
      }
      return newOptions;
    });
  };

  const totalPrice = (event.price * quantity); // Add option prices if they had prices, but currently EventOption just has name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const optionsArray = Object.entries(selectedOptions).map(([id, qty]) => ({
        eventOptionId: parseInt(id),
        quantity: qty
      }));

      const returnUrl = `${window.location.origin}/payment/callback`;
      const cancelUrl = `${window.location.origin}/events/${event.id}`;

      const response = await createInscription({
        eventId: event.id,
        quantity,
        paymentMethod: totalPrice === 0 ? 'FREE' : paymentMethod,
        options: optionsArray,
        returnUrl,
        cancelUrl
      });

      addNotification('success', response.message);

      // Handle payment redirect
      if (response.paymentUrl) {
          // HelloAsso uses paymentUrl - store inscription ID and redirect
          sessionStorage.setItem('helloasso_inscription_id', response.inscription.id.toString());
          window.location.href = response.paymentUrl;
      } else if (response.payment?.approvalUrl) {
          // PayPal uses approvalUrl - store data and redirect
          sessionStorage.setItem('paypal_inscription_id', response.inscription.id.toString());
          sessionStorage.setItem('paypal_order_id', response.payment.orderId);
          window.location.href = response.payment.approvalUrl;
      }

      onClose();

    } catch (error: any) {
      console.error("Registration failed:", error);
      addNotification('error', error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Inscription : ${event.title}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Quantity */}
        <div>
          <label className="block text-gray-400 mb-2">Nombre de places</label>
          <input 
            type="number" 
            min="1" 
            max="5" 
            value={quantity} 
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
            className="w-full bg-dark-bg border border-gray-600 rounded p-3 text-white focus:border-accent-mint outline-none"
          />
        </div>

        {/* Options */}
        {event.options && event.options.length > 0 && (
          <div>
            <label className="block text-gray-400 mb-2">Options</label>
            <div className="space-y-2">
              {event.options.map(option => (
                <div key={option.id} className="flex items-center p-3 bg-dark-bg border border-gray-700 rounded hover:border-gray-500 cursor-pointer" onClick={() => handleOptionChange(option.id, !selectedOptions[option.id])}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedOptions[option.id]}
                    onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                    className="mr-3 h-5 w-5 accent-accent-mint"
                  />
                  <span>{option.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="p-4 bg-dark-bg/50 rounded-lg border border-gray-700 flex justify-between items-center">
            <span className="text-gray-300">Total à payer</span>
            <span className="text-2xl font-bold text-accent-mint">{totalPrice.toFixed(2)} €</span>
        </div>

        {/* Payment Method */}
        {totalPrice > 0 && (
          <div>
            <label className="block text-gray-400 mb-2">Moyen de paiement</label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'HELLOASSO' ? 'border-accent-mint bg-accent-mint/10' : 'border-gray-700 bg-dark-bg hover:border-gray-500'}`}>
                <div className="flex items-center">
                    <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="HELLOASSO" 
                        checked={paymentMethod === 'HELLOASSO'}
                        onChange={() => setPaymentMethod('HELLOASSO')}
                        className="mr-3"
                    />
                    <div className="flex items-center">
                        <Wallet className="mr-2 text-blue-400" size={20} />
                        <span className="font-bold">HelloAsso</span>
                    </div>
                </div>
                <span className="text-xs text-gray-400 bg-darker-bg px-2 py-1 rounded">Recommandé</span>
              </label>

              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'PAYPAL' ? 'border-accent-mint bg-accent-mint/10' : 'border-gray-700 bg-dark-bg hover:border-gray-500'}`}>
                <div className="flex items-center">
                    <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="PAYPAL" 
                        checked={paymentMethod === 'PAYPAL'}
                        onChange={() => setPaymentMethod('PAYPAL')}
                        className="mr-3"
                    />
                     <div className="flex items-center">
                        <CreditCard className="mr-2 text-indigo-400" size={20} />
                        <span className="font-bold">PayPal</span>
                    </div>
                </div>
              </label>

              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'CASH_CB' ? 'border-accent-mint bg-accent-mint/10' : 'border-gray-700 bg-dark-bg hover:border-gray-500'}`}>
                <div className="flex items-center">
                    <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="CASH_CB" 
                        checked={paymentMethod === 'CASH_CB'}
                        onChange={() => setPaymentMethod('CASH_CB')}
                        className="mr-3"
                    />
                     <div className="flex items-center">
                        <Banknote className="mr-2 text-green-400" size={20} />
                        <span className="font-bold">Espèces / CB (Sur place)</span>
                    </div>
                </div>
              </label>
            </div>
          </div>
        )}

        <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-mint text-darker-bg font-bold py-4 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
        >
            {loading ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-darker-bg"></div> : 'Confirmer l\'inscription'}
        </button>
      </form>
    </Modal>
  );
};

export default EventRegistrationModal;
