import React, { useState, useEffect } from 'react';
import { type Event } from '../api/events';
import { createInscription, type PaymentMethod, getMyInscriptions } from '../api/inscriptions';
import { getMyBalance } from '../api/balance';
import { useNotification } from '../context/NotificationContext';
import { X, CreditCard, Wallet, Banknote, Users, Minus, Plus, ChevronRight, AlertCircle, Check } from 'lucide-react';
import LegalAcceptance from './LegalAcceptance';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../types/errors';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({ isOpen, onClose, event }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [formResponses, setFormResponses] = useState<Record<number, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('HELLOASSO');
  const [loading, setLoading] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number>(event.maxPlacesPerPerson);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const { addNotification } = useNotification();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedOptions({});
      setFormResponses({});
      setPaymentMethod('HELLOASSO');
      setLoading(false);
      setLegalAccepted(false);
      fetchUserQuota();
      fetchUserBalance();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, event.id]);

  const fetchUserBalance = async () => {
    try {
      const data = await getMyBalance();
      setUserBalance(data.balance);
    } catch (error) {
      logger.error('Failed to fetch balance', error);
      setUserBalance(0);
    }
  };

  const fetchUserQuota = async () => {
    setCheckingQuota(true);
    try {
      const myInscriptions = await getMyInscriptions();
      const eventInscriptions = myInscriptions.filter(i =>
        i.eventId === event.id &&
        i.paymentStatus === 'PAID'
      );

      const usedPlaces = eventInscriptions.reduce((sum, i) => sum + i.quantity, 0);
      const remaining = Math.max(0, event.maxPlacesPerPerson - usedPlaces);
      setRemainingQuota(remaining);

      if (remaining === 0) {
        setQuantity(0);
      } else if (quantity > remaining) {
        setQuantity(1);
      }
    } catch (error) {
      logger.error('Failed to check quota', error);
    } finally {
      setCheckingQuota(false);
    }
  };

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

  const totalPrice = (event.price * quantity);
  const hasEnoughBalance = userBalance >= totalPrice;

  // Auto-switch away from HelloAsso if total is below 0.50
  useEffect(() => {
    if (paymentMethod === 'HELLOASSO' && totalPrice > 0 && totalPrice < 0.50) {
      setPaymentMethod('PAYPAL');
    }
    // Auto-switch away from BALANCE if not enough balance
    if (paymentMethod === 'BALANCE' && !hasEnoughBalance) {
      setPaymentMethod('HELLOASSO');
    }
  }, [totalPrice, paymentMethod, hasEnoughBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingQuota <= 0) return;

    // Validate required form fields
    if (event.formFields) {
      const missingFields = event.formFields.filter(
        field => field.required && !formResponses[field.id]?.trim()
      );
      if (missingFields.length > 0) {
        addNotification('error', `Veuillez remplir tous les champs requis`);
        return;
      }
    }

    // Check balance if paying with BALANCE
    if (paymentMethod === 'BALANCE' && !hasEnoughBalance) {
      addNotification('error', 'Solde insuffisant');
      return;
    }

    setLoading(true);

    try {
      const optionsArray = Object.entries(selectedOptions).map(([id, qty]) => ({
        eventOptionId: parseInt(id),
        quantity: qty
      }));

      const formResponsesArray = Object.entries(formResponses).map(([fieldId, value]) => ({
        fieldId: parseInt(fieldId),
        value
      }));

      const returnUrl = `${window.location.origin}/payment/callback`;
      const cancelUrl = `${window.location.origin}/events/${event.id}`;

      const response = await createInscription({
        eventId: event.id,
        quantity,
        paymentMethod: totalPrice === 0 ? 'FREE' : paymentMethod,
        options: optionsArray,
        formResponses: formResponsesArray.length > 0 ? formResponsesArray : undefined,
        returnUrl,
        cancelUrl
      });

      addNotification('success', response.message);

      // Handle payment redirect (only for external payment methods)
      if (response.paymentUrl) {
        sessionStorage.setItem('helloasso_inscription_id', response.inscription.id.toString());
        window.location.href = response.paymentUrl;
      } else if (response.payment?.approvalUrl) {
        sessionStorage.setItem('paypal_inscription_id', response.inscription.id.toString());
        if (response.payment.orderId) {
          sessionStorage.setItem('paypal_order_id', response.payment.orderId);
        }
        window.location.href = response.payment.approvalUrl;
      } else {
        // For BALANCE and CASH_CB, just close the modal and refresh
        onClose();
        window.location.reload();
      }

    } catch (error) {
      logger.error('Registration failed', error);
      addNotification('error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 max-h-[85vh] sm:max-h-[80vh] mt-4 sm:mt-20 mb-4 bg-darker-bg rounded-3xl border border-gray-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="pr-8">
            <p className="text-accent-mint text-sm font-semibold mb-1">INSCRIPTION</p>
            <h2 className="text-xl font-bold text-white line-clamp-2">{event.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          {checkingQuota ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Verification de vos inscriptions...</p>
            </div>
          ) : remainingQuota <= 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <p className="text-red-400 font-bold text-lg mb-2">Limite atteinte</p>
              <p className="text-gray-400 text-sm mb-6">
                Vous avez deja reserve le nombre maximum de places ({event.maxPlacesPerPerson}) pour cet evenement.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quantity Selector */}
              <div className="bg-dark-bg rounded-2xl p-5 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-accent-mint" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Nombre de places</p>
                      <p className="text-xs text-gray-500">Maximum {remainingQuota} place(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-xl bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-2xl font-bold text-white w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(remainingQuota, quantity + 1))}
                      disabled={quantity >= remainingQuota}
                      className="w-10 h-10 rounded-xl bg-accent-mint text-darker-bg flex items-center justify-center hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Options */}
              {event.options && event.options.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-400 mb-3">OPTIONS</p>
                  <div className="space-y-2">
                    {event.options.map(option => (
                      <label
                        key={option.id}
                        className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedOptions[option.id]
                            ? 'bg-accent-mint/10 border-accent-mint'
                            : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-4 transition-colors ${
                          selectedOptions[option.id]
                            ? 'bg-accent-mint border-accent-mint'
                            : 'border-gray-600'
                        }`}>
                          {selectedOptions[option.id] && <Check size={14} className="text-darker-bg" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={!!selectedOptions[option.id]}
                          onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                          className="hidden"
                        />
                        <span className="text-white">{option.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Form Fields */}
              {event.formFields && event.formFields.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-400 mb-3">INFORMATIONS COMPLEMENTAIRES</p>
                  <div className="space-y-4">
                    {event.formFields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm text-white mb-2">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === 'TEXT' && (
                          <input
                            type="text"
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                            required={field.required}
                            className="w-full bg-dark-bg border border-gray-800 rounded-xl p-4 text-white focus:border-accent-mint focus:outline-none transition-colors"
                            placeholder={`Entrez ${field.label.toLowerCase()}`}
                          />
                        )}
                        {field.type === 'TEXTAREA' && (
                          <textarea
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                            required={field.required}
                            rows={3}
                            className="w-full bg-dark-bg border border-gray-800 rounded-xl p-4 text-white focus:border-accent-mint focus:outline-none transition-colors resize-none"
                            placeholder={`Entrez ${field.label.toLowerCase()}`}
                          />
                        )}
                        {field.type === 'SELECT' && field.options && (
                          <select
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                            required={field.required}
                            className="w-full bg-dark-bg border border-gray-800 rounded-xl p-4 text-white focus:border-accent-mint focus:outline-none transition-colors"
                          >
                            <option value="">Choisir une option</option>
                            {field.options.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        {field.type === 'CHECKBOX' && (
                          <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                            formResponses[field.id] === 'true'
                              ? 'bg-accent-mint/10 border-accent-mint'
                              : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                          }`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-4 transition-colors ${
                              formResponses[field.id] === 'true'
                                ? 'bg-accent-mint border-accent-mint'
                                : 'border-gray-600'
                            }`}>
                              {formResponses[field.id] === 'true' && <Check size={14} className="text-darker-bg" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={formResponses[field.id] === 'true'}
                              onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.checked ? 'true' : 'false' }))}
                              className="hidden"
                            />
                            <span className="text-white">{field.label}</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {totalPrice > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-400 mb-3">MODE DE PAIEMENT</p>
                  <div className="space-y-2">
                    {/* BALANCE - Solde ADIIL */}
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      !hasEnoughBalance ? 'opacity-50 cursor-not-allowed' :
                      paymentMethod === 'BALANCE' ? 'bg-accent-mint/10 border-accent-mint' : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'BALANCE' ? 'border-accent-mint' : 'border-gray-600'
                        }`}>
                          {paymentMethod === 'BALANCE' && <div className="w-2.5 h-2.5 rounded-full bg-accent-mint" />}
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BALANCE"
                          checked={paymentMethod === 'BALANCE'}
                          onChange={() => setPaymentMethod('BALANCE')}
                          disabled={!hasEnoughBalance}
                          className="hidden"
                        />
                        <CreditCard size={20} className="text-accent-mint" />
                        <div>
                          <span className="font-medium text-white">Solde ADIIL</span>
                          <p className="text-xs text-gray-400">Solde: {userBalance.toFixed(2)}EUR</p>
                          {!hasEnoughBalance && (
                            <p className="text-xs text-red-400">Solde insuffisant</p>
                          )}
                        </div>
                      </div>
                    </label>

                    {/* HelloAsso */}
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      totalPrice < 0.50 ? 'opacity-50 cursor-not-allowed' :
                      paymentMethod === 'HELLOASSO' ? 'bg-blue-500/10 border-blue-500' : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'HELLOASSO' ? 'border-blue-500' : 'border-gray-600'
                        }`}>
                          {paymentMethod === 'HELLOASSO' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="HELLOASSO"
                          checked={paymentMethod === 'HELLOASSO'}
                          onChange={() => setPaymentMethod('HELLOASSO')}
                          disabled={totalPrice < 0.50}
                          className="hidden"
                        />
                        <Wallet size={20} className="text-blue-400" />
                        <div>
                          <span className="font-medium text-white">HelloAsso</span>
                          {totalPrice < 0.50 && (
                            <p className="text-xs text-orange-400">Minimum 0.50EUR</p>
                          )}
                        </div>
                      </div>
                      {totalPrice >= 0.50 && (
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">Recommandé</span>
                      )}
                    </label>

                    {/* PayPal */}
                    <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'PAYPAL' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'PAYPAL' ? 'border-indigo-500' : 'border-gray-600'
                        }`}>
                          {paymentMethod === 'PAYPAL' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="PAYPAL"
                          checked={paymentMethod === 'PAYPAL'}
                          onChange={() => setPaymentMethod('PAYPAL')}
                          className="hidden"
                        />
                        <CreditCard size={20} className="text-indigo-400" />
                        <span className="font-medium text-white">PayPal</span>
                      </div>
                    </label>

                    {/* Cash/CB */}
                    <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'CASH_CB' ? 'bg-green-500/10 border-green-500' : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'CASH_CB' ? 'border-green-500' : 'border-gray-600'
                        }`}>
                          {paymentMethod === 'CASH_CB' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH_CB"
                          checked={paymentMethod === 'CASH_CB'}
                          onChange={() => setPaymentMethod('CASH_CB')}
                          className="hidden"
                        />
                        <Banknote size={20} className="text-green-400" />
                        <span className="font-medium text-white">Especes / CB sur place</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!checkingQuota && remainingQuota > 0 && (
          <div className="p-6 border-t border-gray-800 bg-dark-bg/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Total a payer</span>
              <span className="text-3xl font-bold text-accent-mint">
                {totalPrice === 0 ? 'Gratuit' : `${totalPrice.toFixed(2)}EUR`}
              </span>
            </div>
            <LegalAcceptance
              accepted={legalAccepted}
              onChange={setLegalAccepted}
              className="mb-4"
            />
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !legalAccepted}
              className="w-full py-4 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Confirmer l'inscription
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrationModal;
