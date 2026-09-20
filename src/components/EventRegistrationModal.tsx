import React, { useState, useEffect } from 'react';
import { type Event } from '../api/events';
import { createInscription, type PaymentMethod, type InscriptionFieldInput, getMyInscriptions } from '../api/inscriptions';
import { getMyBalance } from '../api/balance';
import { useNotification } from '../context/NotificationContext';
import { X, CreditCard, Wallet, Banknote, Users, Minus, Plus, ChevronRight, AlertCircle, Check, CheckCircle2, Ticket } from 'lucide-react';
import LegalAcceptance from './LegalAcceptance';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../types/errors';
import { useAuth } from '../context/AuthContext';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({ isOpen, onClose, event }) => {
  const [quantity, setQuantity] = useState(1);
  // Champs payants sélectionnés (isPaid: true) : fieldId -> quantité
  const [selectedPaidFields, setSelectedPaidFields] = useState<Record<number, number>>({});
  // Réponses aux champs non payants (TEXT / TEXTAREA / SELECT / CHECKBOX informatif) : fieldId -> valeur
  const [fieldResponses, setFieldResponses] = useState<Record<number, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('HELLOASSO');
  const [loading, setLoading] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number>(event.maxPlacesPerPerson);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const isOnSitePaymentBlocked = !!event.restrictOnSitePaymentToInfo && user?.filiere !== 'INFO';

  const paidFields = (event.fields || []).filter(f => f.isPaid);
  const answerFields = (event.fields || []).filter(f => !f.isPaid);

  const isFieldMissing = (field: (typeof answerFields)[number]) => {
    if (!field.required) return false;
    const value = fieldResponses[field.id];
    if (field.type === 'CHECKBOX') return value !== 'true';
    return !value?.trim();
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedPaidFields({});
      setFieldResponses({});
      setPaymentMethod('HELLOASSO');
      setLoading(false);
      setLegalAccepted(false);
      setShowErrors(false);
      fetchUserQuota();
      fetchUserBalance();
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

  const handlePaidFieldChange = (fieldId: number, checked: boolean) => {
    setSelectedPaidFields(prev => {
      const next = { ...prev };
      if (checked) {
        next[fieldId] = 1;
      } else {
        delete next[fieldId];
      }
      return next;
    });
  };

  const paidFieldsPrice = Object.entries(selectedPaidFields).reduce((sum, [id, qty]) => {
    const field = paidFields.find(f => f.id === parseInt(id));
    if (!field) return sum;
    return sum + (field.price ?? 0) * qty;
  }, 0);
  const totalPrice = (event.price * quantity) + paidFieldsPrice;
  const hasEnoughBalance = userBalance >= totalPrice;

  useEffect(() => {
    if (paymentMethod === 'BALANCE' && !hasEnoughBalance) {
      setPaymentMethod('HELLOASSO');
    }
    if (isOnSitePaymentBlocked && (paymentMethod === 'CASH' || paymentMethod === 'CB')) {
      setPaymentMethod('HELLOASSO');
    }
  }, [totalPrice, paymentMethod, hasEnoughBalance, isOnSitePaymentBlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingQuota <= 0) return;

    // Validate required answer fields
        const missingFields = answerFields.filter(isFieldMissing);
        if (missingFields.length > 0) {
          setShowErrors(true);
          document
            .getElementById(`field-${missingFields[0].id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

    if (paymentMethod === 'BALANCE' && !hasEnoughBalance) {
      addNotification('error', 'Solde insuffisant');
      return;
    }

    setLoading(true);

    try {
      const paidFieldsArray: InscriptionFieldInput[] = Object.entries(selectedPaidFields).map(([id, qty]) => ({
        fieldId: parseInt(id),
        quantity: qty
      }));

      const answerFieldsArray: InscriptionFieldInput[] = Object.entries(fieldResponses)
        .filter(([, value]) => value !== '')
        .map(([fieldId, value]) => ({
          fieldId: parseInt(fieldId),
          value
        }));

      const fieldsArray = [...paidFieldsArray, ...answerFieldsArray];

      const returnUrl = `${window.location.origin}/payment/callback`;
      const cancelUrl = `${window.location.origin}/events/${event.id}`;

      const response = await createInscription({
        eventId: event.id,
        quantity,
        paymentMethod: totalPrice === 0 ? 'FREE' : paymentMethod,
        fields: fieldsArray.length > 0 ? fieldsArray : undefined,
        returnUrl,
        cancelUrl
      });

      addNotification('success', response.message);

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
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-darker-bg rounded-2xl border border-gray-800 shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
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

              {/* Paid fields (ex-options) */}
              {paidFields.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Options</label>
                  <div className="space-y-2">
                    {paidFields.map(field => (
                      <label
                        key={field.id}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedPaidFields[field.id]
                            ? 'bg-accent-mint/10 border-accent-mint'
                            : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center mr-3 transition-colors ${
                          selectedPaidFields[field.id]
                            ? 'bg-accent-mint border-accent-mint'
                            : 'border-gray-600'
                        }`}>
                          {selectedPaidFields[field.id] && <Check size={12} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={!!selectedPaidFields[field.id]}
                          onChange={(e) => handlePaidFieldChange(field.id, e.target.checked)}
                          className="hidden"
                        />
                        <span className="text-white text-sm flex-1">{field.label}</span>
                        <span className="text-accent-mint text-sm font-bold ml-2 flex-shrink-0">+{(field.price ?? 0).toFixed(2)}€</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer fields (informational) */}
              {answerFields.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informations complementaires</label>
                  <div className="space-y-3">
                    {answerFields.map(field => {
                      const missing = showErrors && isFieldMissing(field);
                      return (
                        <div key={field.id} id={`field-${field.id}`}>
                          {field.type !== 'CHECKBOX' && (
                            <label className="block text-sm text-gray-400 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                          )}
                          {field.type === 'TEXT' && (
                            <input
                              type="text"
                              value={fieldResponses[field.id] || ''}
                              onChange={(e) => setFieldResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                              required={field.required}
                              className={`w-full bg-dark-bg border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors ${
                                missing ? 'border-red-500' : 'border-gray-800 focus:border-accent-mint'
                              }`}
                              placeholder={`Entrez ${field.label.toLowerCase()}`}
                            />
                          )}
                          {field.type === 'TEXTAREA' && (
                            <textarea
                              value={fieldResponses[field.id] || ''}
                              onChange={(e) => setFieldResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                              required={field.required}
                              rows={3}
                              className={`w-full bg-dark-bg border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors resize-none ${
                                missing ? 'border-red-500' : 'border-gray-800 focus:border-accent-mint'
                              }`}
                              placeholder={`Entrez ${field.label.toLowerCase()}`}
                            />
                          )}
                          {field.type === 'SELECT' && field.choices && (
                            <select
                              value={fieldResponses[field.id] || ''}
                              onChange={(e) => setFieldResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                              required={field.required}
                              className={`w-full bg-dark-bg border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors ${
                                missing ? 'border-red-500' : 'border-gray-800 focus:border-accent-mint'
                              }`}
                            >
                              <option value="">Choisir une option</option>
                              {field.choices.map((choice, idx) => (
                                <option key={idx} value={choice}>{choice}</option>
                              ))}
                            </select>
                          )}
                          {field.type === 'CHECKBOX' && (
                            <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              fieldResponses[field.id] === 'true'
                                ? 'bg-accent-mint/10 border-accent-mint'
                                : missing
                                  ? 'bg-red-500/10 border-red-500'
                                  : 'bg-dark-bg border-gray-800 hover:border-gray-700'
                            }`}>
                              <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center mr-3 transition-colors ${
                                fieldResponses[field.id] === 'true'
                                  ? 'bg-accent-mint border-accent-mint'
                                  : missing
                                    ? 'border-red-500'
                                    : 'border-gray-600'
                              }`}>
                                {fieldResponses[field.id] === 'true' && <Check size={12} className="text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={fieldResponses[field.id] === 'true'}
                                onChange={(e) => setFieldResponses(prev => ({ ...prev, [field.id]: e.target.checked ? 'true' : 'false' }))}
                                className="hidden"
                              />
                              <span className="text-white text-sm flex-1">
                                {field.label}
                                {field.required && <span className="text-red-400 ml-1">*</span>}
                              </span>
                            </label>
                          )}
                          {missing && (
                            <p className="text-red-400 text-xs mt-1.5">
                              {field.type === 'CHECKBOX' ? 'Vous devez cocher cette case pour continuer' : 'Ce champ est obligatoire'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          {/* Payment Method */}
              {totalPrice > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
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
                      <p className="font-bold text-white text-xs">En ligne</p>
                      {totalPrice < 0.50 ? (
                        <p className="text-[10px] text-orange-400">Min. 0.50€</p>
                      ) : (
                        <p className="text-[10px] text-blue-400">Recommande</p>
                      )}
                    </button>

                    {!isOnSitePaymentBlocked && (
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
                    )}

                    {!isOnSitePaymentBlocked && (
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
                    )}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {!checkingQuota && remainingQuota > 0 && (
          <div className="p-5 border-t border-gray-800 bg-dark-bg/50 flex-shrink-0">
            {showErrors && answerFields.some(isFieldMissing) && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">Certains champs obligatoires (*) ne sont pas remplis.</p>
              </div>
            )}
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