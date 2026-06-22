import React, { useState, useEffect } from 'react';
import { type Event } from '../api/events';
import { createInscription, type PaymentMethod, getMyInscriptions } from '../api/inscriptions';
import { getMyBalance } from '../api/balance';
import { useNotification } from '../context/NotificationContext';
import { X, CreditCard, Wallet, Banknote, Users, Minus, Plus, ChevronRight, AlertCircle, Check, CheckCircle2, Ticket } from 'lucide-react';
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
            } else {
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

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-darker-bg rounded-2xl border border-gray-800 shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="relative p-5 border-b border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
              <Ticket size={18} className="text-accent-mint" />
            </div>
            <div>
              <p className="text-accent-mint text-xs font-bold uppercase tracking-wide">Inscription</p>
              <h2 className="text-base font-bold text-white line-clamp-1">{event.title}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
          {checkingQuota ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm">Verification de vos inscriptions...</p>
            </div>
          ) : remainingQuota <= 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Quantity Selector */}
              <div className="bg-dark-bg rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                      <Users size={18} className="text-accent-mint" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Nombre de places</p>
                      <p className="text-xs text-gray-500">Max. {remainingQuota}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-9 h-9 rounded-lg bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-xl font-bold text-white w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(remainingQuota, quantity + 1))}
                      disabled={quantity >= remainingQuota}
                      className="w-9 h-9 rounded-lg bg-accent-mint text-darker-bg flex items-center justify-center hover:bg-accent-mint/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Options */}
              {event.options && event.options.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Options</label>
                  <div className="space-y-2">
                    {event.options.map(option => (
                      <label
                        key={option.id}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedOptions[option.id]
                            ? 'bg-accent-mint/10 border-accent-mint'
                            : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-3 transition-colors ${
                          selectedOptions[option.id]
                            ? 'bg-accent-mint border-accent-mint'
                            : 'border-gray-600'
                        }`}>
                          {selectedOptions[option.id] && <Check size={12} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={!!selectedOptions[option.id]}
                          onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                          className="hidden"
                        />
                        <span className="text-white text-sm">{option.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Form Fields */}
              {event.formFields && event.formFields.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informations complementaires</label>
                  <div className="space-y-3">
                    {event.formFields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm text-gray-400 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === 'TEXT' && (
                          <input
                            type="text"
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                            required={field.required}
                            className="w-full bg-dark-bg border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-mint focus:outline-none transition-colors"
                            placeholder={`Entrez ${field.label.toLowerCase()}`}
                          />
                        )}
                        {field.type === 'TEXTAREA' && (
                          <textarea
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                            required={field.required}
                            rows={3}
                            className="w-full bg-dark-bg border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-mint focus:outline-none transition-colors resize-none"
                            placeholder={`Entrez ${field.label.toLowerCase()}`}
                          />
                        )}
                        {field.type === 'SELECT' && field.options && (
                          <select
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                            required={field.required}
                            className="w-full bg-dark-bg border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-mint focus:outline-none transition-colors"
                          >
                            <option value="">Choisir une option</option>
                            {field.options.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        {field.type === 'CHECKBOX' && (
                          <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            formResponses[field.id] === 'true'
                              ? 'bg-accent-mint/10 border-accent-mint'
                              : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                          }`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-3 transition-colors ${
                              formResponses[field.id] === 'true'
                                ? 'bg-accent-mint border-accent-mint'
                                : 'border-gray-600'
                            }`}>
                              {formResponses[field.id] === 'true' && <Check size={12} className="text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={formResponses[field.id] === 'true'}
                              onChange={(e) => setFormResponses(prev => ({ ...prev, [field.id]: e.target.checked ? 'true' : 'false' }))}
                              className="hidden"
                            />
                            <span className="text-white text-sm">{field.label}</span>
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* BALANCE - Solde ADIIL */}
                    <button
                      type="button"
                      onClick={() => hasEnoughBalance && setPaymentMethod('BALANCE')}
                      disabled={!hasEnoughBalance}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        !hasEnoughBalance
                          ? 'opacity-40 cursor-not-allowed border-gray-800 bg-dark-bg'
                          : paymentMethod === 'BALANCE'
                            ? 'border-accent-mint bg-accent-mint/10'
                            : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                      }`}
                    >
                      {paymentMethod === 'BALANCE' && hasEnoughBalance && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-accent-mint rounded-full flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-darker-bg" />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        paymentMethod === 'BALANCE' && hasEnoughBalance ? 'bg-accent-mint' : 'bg-gray-800'
                      }`}>
                        <Wallet size={14} className={paymentMethod === 'BALANCE' && hasEnoughBalance ? 'text-darker-bg' : 'text-gray-400'} />
                      </div>
                      <p className="font-bold text-white text-xs">Solde ADIIL</p>
                      <p className={`text-[10px] ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                        {userBalance.toFixed(2)}€
                      </p>
                    </button>

                    {/* HelloAsso */}
                    <button
                      type="button"
                      onClick={() => totalPrice >= 0.50 && setPaymentMethod('HELLOASSO')}
                      disabled={totalPrice < 0.50}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        totalPrice < 0.50
                          ? 'opacity-40 cursor-not-allowed border-gray-800 bg-dark-bg'
                          : paymentMethod === 'HELLOASSO'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                      }`}
                    >
                      {paymentMethod === 'HELLOASSO' && totalPrice >= 0.50 && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        paymentMethod === 'HELLOASSO' && totalPrice >= 0.50 ? 'bg-blue-500' : 'bg-gray-800'
                      }`}>
                        <Wallet size={14} className={paymentMethod === 'HELLOASSO' && totalPrice >= 0.50 ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <p className="font-bold text-white text-xs">HelloAsso</p>
                      {totalPrice < 0.50 ? (
                        <p className="text-[10px] text-orange-400">Min. 0.50€</p>
                      ) : (
                        <p className="text-[10px] text-blue-400">Recommande</p>
                      )}
                    </button>

                    {/* CASH */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'CASH'
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                      }`}
                    >
                      {paymentMethod === 'CASH' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        paymentMethod === 'CASH' ? 'bg-indigo-500' : 'bg-gray-800'
                      }`}>
                        <CreditCard size={14} className={paymentMethod === 'CASH' ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <p className="font-bold text-white text-xs">Sur place</p>
                      <p className="text-[10px] text-gray-500">Espèces</p>
                    </button>

                    {/*CB */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CB')}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'CB'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                      }`}
                    >
                      {paymentMethod === 'CB' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        paymentMethod === 'CB' ? 'bg-green-500' : 'bg-gray-800'
                      }`}>
                        <Banknote size={14} className={paymentMethod === 'CB' ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <p className="font-bold text-white text-xs">Sur place</p>
                      <p className="text-[10px] text-gray-500">CB</p>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!checkingQuota && remainingQuota > 0 && (
          <div className="p-5 border-t border-gray-800 bg-dark-bg/50 flex-shrink-0">
            {/* Price summary */}
            <div className="flex items-center justify-between mb-4 p-3 bg-darker-bg rounded-xl border border-gray-800">
              <div>
                <p className="text-xs text-gray-500">Total a payer</p>
                <p className="text-xs text-gray-400">{quantity} place{quantity > 1 ? 's' : ''}</p>
              </div>
              <span className="text-2xl font-koulen text-accent-mint">
                {totalPrice === 0 ? 'Gratuit' : `${totalPrice.toFixed(2)}€`}
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
              className="w-full py-4 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-accent-mint/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-lg shadow-accent-mint/20 disabled:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Confirmer l'inscription
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
