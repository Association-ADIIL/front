import React, { useEffect, useState } from 'react';
import { getMyBalance, createBalanceRecharge, getMyRecharges, type BalanceRecharge } from '../api/balance';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CreditCard, Plus, History, Wallet, ChevronRight, Euro } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BalancePage: React.FC = () => {
  const { user, token } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [recharges, setRecharges] = useState<BalanceRecharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);
  const [amount, setAmount] = useState<string>('10');
  const [paymentMethod, setPaymentMethod] = useState<string>('HELLOASSO');

  // Auto-switch to PayPal if HelloAsso is selected and amount is below 0.50
  useEffect(() => {
    if (paymentMethod === 'HELLOASSO' && parseFloat(amount || '0') < 0.50) {
      setPaymentMethod('PAYPAL');
    }
  }, [amount, paymentMethod]);

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
        console.error('Error fetching balance data:', error);
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
    } catch (error: any) {
      addNotification('error', error.message || 'Erreur lors de la recharge');
    } finally {
      setRecharging(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">Paye</span>;
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400">En attente</span>;
      case 'REFUNDED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">Rembourse</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400">{status}</span>;
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
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const amountNum = parseFloat(amount || '0');

  return (
    <div className="bg-dark-bg">
      {/* Header */}
      <section className="bg-darker-bg py-8 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Espace personnel</span>
          <h1 className="text-5xl md:text-6xl font-koulen text-white mt-2">MA CARTE ADIIL</h1>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Current Balance Card */}
              <div className="bg-gradient-to-br from-accent-mint to-emerald-400 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-darker-bg/70 text-sm font-semibold mb-1">SOLDE ACTUEL</p>
                    <p className="text-4xl font-koulen text-darker-bg">{balance.toFixed(2)} EUR</p>
                  </div>
                  <div className="w-16 h-16 bg-darker-bg/10 rounded-2xl flex items-center justify-center">
                    <CreditCard size={32} className="text-darker-bg/50" />
                  </div>
                </div>
              </div>

              {/* Recharge History */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-gray-800">
                  <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                    <History size={20} className="text-accent-mint" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Historique</h2>
                </div>

                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {recharges.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm">Aucune recharge pour le moment</p>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {recharges.map((recharge) => (
                        <div key={recharge.id} className="flex items-center justify-between p-4 hover:bg-dark-bg/30 transition-colors">
                          <div>
                            <p className="text-white font-bold">{recharge.amount.toFixed(2)} EUR</p>
                            <p className="text-xs text-gray-500">
                              {new Date(recharge.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {' - '}
                              {getPaymentMethodLabel(recharge.paymentMethod)}
                            </p>
                          </div>
                          {getStatusBadge(recharge.paymentStatus)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column - Recharge Form */}
            <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                  <Plus size={20} className="text-accent-mint" />
                </div>
                <h2 className="text-lg font-bold text-white">Recharger</h2>
              </div>

              <div className="space-y-6">
                {/* Quick amounts */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-3">MONTANT</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['5', '10', '20', '50'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmount(val)}
                        className={`py-3 rounded-xl font-bold transition-all ${
                          amount === val
                            ? 'bg-accent-mint text-darker-bg'
                            : 'bg-dark-bg text-gray-400 hover:bg-gray-800 border border-gray-800'
                        }`}
                      >
                        {val}EUR
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-3">MONTANT PERSONNALISE</label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-dark-bg border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-accent-mint transition-colors"
                      placeholder="Entrez un montant"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-3">MODE DE PAIEMENT</label>
                  <div className="space-y-2">
                    {/* HelloAsso */}
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      amountNum < 0.50 ? 'opacity-50 cursor-not-allowed' :
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
                          disabled={amountNum < 0.50}
                          className="hidden"
                        />
                        <Wallet size={20} className="text-blue-400" />
                        <div>
                          <span className="font-medium text-white">HelloAsso</span>
                          {amountNum < 0.50 && (
                            <p className="text-xs text-orange-400">Minimum 0.50EUR</p>
                          )}
                        </div>
                      </div>
                      {amountNum >= 0.50 && (
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">Recommande</span>
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
                  </div>
                </div>

                {/* Recharge button */}
                <button
                  onClick={handleRecharge}
                  disabled={recharging || !amount || amountNum <= 0}
                  className="w-full bg-accent-mint text-darker-bg font-bold py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {recharging ? (
                    <div className="w-6 h-6 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Recharger {amountNum.toFixed(2)} EUR
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BalancePage;
