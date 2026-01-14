import React, { useEffect, useState, useCallback } from 'react';
import { getMyBalance, createBalanceRecharge, getMyRecharges, type BalanceRecharge } from '../api/balance';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CreditCard, Plus, History, Wallet, ChevronRight, Euro, Gift, Zap, Star, TrendingUp, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import NumberInput from '../components/NumberInput';
import BonusBubble from '../components/BonusBubble';
import { checkBalanceRechargeBonus, type BalanceBonusCheck, type BalanceRechargeTier } from '../api/promotions';
import LegalAcceptance from '../components/LegalAcceptance';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../types/errors';

const BalancePage: React.FC = () => {
  useDocumentTitle('Mon Solde ADIIL');
  const { token } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [recharges, setRecharges] = useState<BalanceRecharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);
  const [amount, setAmount] = useState<string>('10');
  const [paymentMethod, setPaymentMethod] = useState<string>('HELLOASSO');
  const [bonusInfo, setBonusInfo] = useState<BalanceBonusCheck | null>(null);
  const [checkingBonus, setCheckingBonus] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  // Auto-switch to PayPal if HelloAsso is selected and amount is below 0.50
  useEffect(() => {
    if (paymentMethod === 'HELLOASSO' && parseFloat(amount || '0') < 0.50) {
      setPaymentMethod('PAYPAL');
    }
  }, [amount, paymentMethod]);

  // Check for bonus when amount changes
  const checkBonus = useCallback(async (amountValue: number) => {
    if (!token || amountValue <= 0) {
      setBonusInfo(null);
      return;
    }

    setCheckingBonus(true);
    try {
      const result = await checkBalanceRechargeBonus(amountValue);
      setBonusInfo(result);
    } catch (error) {
      logger.error('Error checking bonus', error);
      setBonusInfo(null);
    } finally {
      setCheckingBonus(false);
    }
  }, [token]);

  useEffect(() => {
    const amountValue = parseFloat(amount || '0');
    const timeoutId = setTimeout(() => {
      checkBonus(amountValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [amount, checkBonus]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [balanceData, rechargesData] = await Promise.all([
          getMyBalance(),
          getMyRecharges(),
        ]);
        setBalance(balanceData.balance);
        setRecharges(rechargesData);
      } catch (error) {
        logger.error('Error fetching balance data', error);
        addNotification('error', 'Erreur lors du chargement des donnees');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate, addNotification]);

  const handleRecharge = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      addNotification('error', 'Montant invalide');
      return;
    }

    setRecharging(true);
    try {
      const response = await createBalanceRecharge({
        amount: amountNum,
        paymentMethod,
        returnUrl: `${window.location.origin}/payment/callback`,
        cancelUrl: `${window.location.origin}/balance`,
        promotionId: bonusInfo?.eligible ? bonusInfo.promotionId : undefined,
        bonusAmount: bonusInfo?.eligible ? bonusInfo.bonusAmount : undefined,
      });

      // Store recharge ID for callback handling
      if (response.recharge?.id) {
        if (paymentMethod === 'PAYPAL') {
          sessionStorage.setItem('paypal_recharge_id', response.recharge.id.toString());
        } else if (paymentMethod === 'HELLOASSO') {
          sessionStorage.setItem('helloasso_recharge_id', response.recharge.id.toString());
        }
      }

      if (response.payment?.approvalUrl) {
        window.location.href = response.payment.approvalUrl;
      } else if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        addNotification('success', 'Recharge creee avec succes');
      }
    } catch (error) {
      addNotification('error', getErrorMessage(error));
    } finally {
      setRecharging(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'PENDING':
        return <Clock size={16} className="text-yellow-400" />;
      case 'REFUNDED':
        return <RefreshCw size={16} className="text-red-400" />;
      default:
        return <XCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Payé';
      case 'PENDING': return 'En attente';
      case 'REFUNDED': return 'Remboursé';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'HELLOASSO': return 'HelloAsso';
      case 'PAYPAL': return 'PayPal';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const amountNum = parseFloat(amount || '0');

  return (
    <div className="bg-dark-bg min-h-screen">
      {/* Header */}
      <section className="bg-darker-bg py-12 border-b border-gray-800 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-accent-mint/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] bg-emerald-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(119,241,190,0.5) 40px,
            rgba(119,241,190,0.5) 41px
          )`
        }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-1 h-14 bg-accent-mint rounded-full hidden sm:block" />
            <div>
              <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Espace personnel</span>
              <h1 className="text-5xl md:text-6xl font-koulen text-white mt-1">MON SOLDE</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Bonus Promotion Banner */}
          {bonusInfo?.eligible && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400/30 via-yellow-500/40 to-yellow-400/30 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500 animate-pulse-slow" />
                <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 rounded-xl p-[2px]">
                  <div className="bg-darker-bg rounded-[10px] p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-400 rounded-xl shrink-0">
                        <Gift className="text-darker-bg" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{bonusInfo.promotionName || 'Bonus sur recharge'}</h3>
                          <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                        </div>
                        {bonusInfo.message && (
                          <p className="text-gray-400 text-sm">{bonusInfo.message}</p>
                        )}
                      </div>
                      <div className="hidden sm:flex gap-2">
                        {bonusInfo.tiers && bonusInfo.tiers.length > 0 ? (
                          bonusInfo.tiers.slice(0, 3).map((tier: BalanceRechargeTier, index: number) => (
                            <div
                              key={index}
                              className="bg-darker-bg border border-yellow-400/30 rounded-lg px-3 py-2 text-center min-w-[70px]"
                            >
                              <p className="text-[10px] text-gray-500 mb-0.5">
                                {tier.maxAmount ? `${tier.minAmount}-${tier.maxAmount}€` : `${tier.minAmount}€+`}
                              </p>
                              <p className="text-lg font-extrabold text-yellow-400">+{tier.bonusPercent}%</p>
                            </div>
                          ))
                        ) : (
                          <div className="bg-darker-bg border border-yellow-400/30 rounded-lg px-4 py-2 text-center">
                            <p className="text-[10px] text-gray-500 mb-0.5">Bonus</p>
                            <p className="text-xl font-extrabold text-yellow-400">+{bonusInfo.bonusPercent}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left column - Balance & History */}
              <div className="lg:col-span-2 space-y-6">
                {/* Balance Card */}
                <div className="relative overflow-visible">
                  <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="bg-gradient-to-br from-accent-mint via-emerald-400 to-teal-500 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Wallet size={24} className="text-white" />
                        </div>
                        <TrendingUp size={20} className="text-white/60" />
                      </div>
                      <p className="text-white/70 text-sm font-medium mb-1">Solde disponible</p>
                      <p className="text-4xl font-koulen text-white">{balance.toFixed(2)} EUR</p>
                    </div>
                    <div className="p-4 bg-darker-bg">
                      <p className="text-gray-500 text-xs text-center">
                        Utilisable pour vos achats sur la boutique et evenements
                      </p>
                    </div>
                  </div>
                  <BonusBubble variant="overlay" className="-top-3 -right-3" />
                </div>

                {/* History Card */}
                <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="flex items-center gap-3 p-5 border-b border-gray-800">
                    <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                      <History size={18} className="text-accent-mint" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Historique</h2>
                      <p className="text-xs text-gray-500">{recharges.length} recharge{recharges.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    {recharges.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <CreditCard size={20} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Aucune recharge</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800/50">
                        {recharges.map((recharge) => (
                          <div key={recharge.id} className="p-4 hover:bg-dark-bg/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(recharge.paymentStatus)}
                                <span className="text-white font-bold">{recharge.amount.toFixed(2)}€</span>
                                {recharge.bonusAmount > 0 && (
                                  <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Star size={10} className="fill-yellow-400" />
                                    +{recharge.bonusAmount.toFixed(2)}€
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {getStatusLabel(recharge.paymentStatus)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{getPaymentMethodLabel(recharge.paymentMethod)}</span>
                              <span>
                                {new Date(recharge.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - Recharge Form */}
              <div className="lg:col-span-3">
                <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                      <Plus size={18} className="text-accent-mint" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Recharger mon solde</h2>
                  </div>

                  <div className="space-y-5">
                    {/* Quick amounts */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Montant rapide</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['5', '10', '20', '50'].map((val) => (
                          <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`py-3.5 rounded-xl font-bold text-sm transition-all ${
                              amount === val
                                ? 'bg-accent-mint text-darker-bg shadow-lg shadow-accent-mint/20'
                                : 'bg-dark-bg text-gray-400 hover:bg-gray-800 border border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            {val}€
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom amount */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Montant personnalise</label>
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                        <NumberInput
                          value={amount}
                          onChange={setAmount}
                          className="w-full bg-dark-bg border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-white text-lg font-medium focus:outline-none focus:border-accent-mint focus:ring-1 focus:ring-accent-mint/20 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Bonus Display */}
                    {bonusInfo?.eligible && bonusInfo.bonusAmount > 0 && (
                      <div className="bg-gradient-to-r from-yellow-400/10 via-yellow-500/15 to-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-yellow-400 rounded-xl shrink-0">
                            <Zap className="text-darker-bg" size={18} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-yellow-400 mb-0.5">Bonus applique</p>
                            <p className="text-white text-sm">
                              <span className="text-yellow-400 font-bold">+{bonusInfo.bonusAmount.toFixed(2)}€</span>
                              <span className="text-gray-400 ml-1">({bonusInfo.bonusPercent}%)</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total credite</p>
                            <p className="text-lg font-bold text-yellow-400">{bonusInfo.finalAmount.toFixed(2)}€</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {checkingBonus && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                        <div className="w-4 h-4 border-2 border-accent-mint border-t-transparent rounded-full animate-spin" />
                        Verification du bonus...
                      </div>
                    )}

                    {/* Payment method */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Mode de paiement</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* HelloAsso */}
                        <button
                          onClick={() => amountNum >= 0.50 && setPaymentMethod('HELLOASSO')}
                          disabled={amountNum < 0.50}
                          className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                            amountNum < 0.50
                              ? 'opacity-40 cursor-not-allowed border-gray-800 bg-dark-bg'
                              : paymentMethod === 'HELLOASSO'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                          }`}
                        >
                          {paymentMethod === 'HELLOASSO' && amountNum >= 0.50 && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 size={12} className="text-white" />
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              paymentMethod === 'HELLOASSO' && amountNum >= 0.50 ? 'bg-blue-500' : 'bg-gray-800'
                            }`}>
                              <Wallet size={18} className={paymentMethod === 'HELLOASSO' && amountNum >= 0.50 ? 'text-white' : 'text-gray-400'} />
                            </div>
                            <div>
                              <p className="font-bold text-white">HelloAsso</p>
                              {amountNum < 0.50 ? (
                                <p className="text-xs text-orange-400">Min. 0.50€</p>
                              ) : (
                                <p className="text-xs text-blue-400">Recommande</p>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* PayPal */}
                        <button
                          onClick={() => setPaymentMethod('PAYPAL')}
                          className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                            paymentMethod === 'PAYPAL'
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                          }`}
                        >
                          {paymentMethod === 'PAYPAL' && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 size={12} className="text-white" />
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              paymentMethod === 'PAYPAL' ? 'bg-indigo-500' : 'bg-gray-800'
                            }`}>
                              <CreditCard size={18} className={paymentMethod === 'PAYPAL' ? 'text-white' : 'text-gray-400'} />
                            </div>
                            <div>
                              <p className="font-bold text-white">PayPal</p>
                              <p className="text-xs text-gray-500">Carte ou compte</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Legal acceptance */}
                    <LegalAcceptance
                      accepted={legalAccepted}
                      onChange={setLegalAccepted}
                    />

                    {/* Recharge button */}
                    <button
                      onClick={handleRecharge}
                      disabled={recharging || !amount || amountNum <= 0 || !legalAccepted}
                      className="w-full bg-accent-mint text-darker-bg font-bold py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-accent-mint/20 disabled:shadow-none"
                    >
                      {recharging ? (
                        <div className="w-6 h-6 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {bonusInfo?.eligible && bonusInfo.bonusAmount > 0 ? (
                            <>
                              <span>Payer {amountNum.toFixed(2)}€</span>
                              <span className="bg-yellow-400 text-darker-bg text-sm font-extrabold px-2.5 py-1 rounded-full">
                                +{bonusInfo.bonusAmount.toFixed(2)}€
                              </span>
                            </>
                          ) : (
                            <span>Recharger {amountNum.toFixed(2)}€</span>
                          )}
                          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BalancePage;
