import React, { useEffect, useState } from 'react';
import { getMyBalance, createBalanceRecharge, getMyRecharges, type BalanceRecharge } from '../api/balance';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CreditCard, Plus, History, Loader, DollarSign } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<string>('PAYPAL');

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
        addNotification('error', 'Erreur lors du chargement des données');
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
        addNotification('success', 'Recharge créée avec succès');
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
        return <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">Payé</span>;
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">En attente</span>;
      case 'REFUNDED':
        return <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">Remboursé</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-mint"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-accent-mint mb-8 font-koulen">Ma Carte ADIIL</h1>

      {/* Current Balance */}
      <div className="bg-gradient-to-br from-accent-mint to-accent-coral p-8 rounded-2xl shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-darker-bg/70 text-sm font-semibold mb-2">SOLDE ACTUEL</p>
            <p className="text-5xl font-bold text-darker-bg">{balance.toFixed(2)} €</p>
          </div>
          <CreditCard size={64} className="text-darker-bg/20" />
        </div>
      </div>

      {/* Recharge Card */}
      <div className="bg-dark-card p-6 rounded-lg border border-gray-800 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="text-accent-mint" size={24} />
          <h2 className="text-2xl font-bold text-white">Recharger ma carte</h2>
        </div>

        <div className="space-y-4">
          {/* Quick amounts */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Montant rapide</label>
            <div className="grid grid-cols-4 gap-2">
              {['5', '10', '20', '50'].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                    amount === val
                      ? 'bg-accent-mint text-darker-bg'
                      : 'bg-dark-bg text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {val}€
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Montant personnalisé</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-dark-bg border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent-mint"
                placeholder="Entrez un montant"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Méthode de paiement</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-mint"
            >
              <option value="PAYPAL">PayPal</option>
              <option value="HELLOASSO" disabled={parseFloat(amount || '0') < 0.50}>
                HelloAsso {parseFloat(amount || '0') < 0.50 ? '(minimum 0.50€)' : ''}
              </option>
            </select>
            {paymentMethod === 'HELLOASSO' && parseFloat(amount || '0') < 0.50 && (
              <p className="text-xs text-orange-400 mt-2">⚠️ HelloAsso nécessite un montant minimum de 0.50€</p>
            )}
          </div>

          {/* Recharge button */}
          <button
            onClick={handleRecharge}
            disabled={recharging || !amount || parseFloat(amount) <= 0}
            className="w-full bg-accent-mint text-darker-bg font-bold py-3 px-4 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recharging ? (
              <>
                <Loader className="animate-spin" size={20} />
                Traitement...
              </>
            ) : (
              <>
                <Plus size={20} />
                Recharger {parseFloat(amount || '0').toFixed(2)} €
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recharge History */}
      <div className="bg-dark-card p-6 rounded-lg border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-accent-coral" size={24} />
          <h2 className="text-2xl font-bold text-white">Historique des recharges</h2>
        </div>

        {recharges.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucune recharge pour le moment</p>
        ) : (
          <div className="space-y-3">
            {recharges.map((recharge) => (
              <div
                key={recharge.id}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-gray-800"
              >
                <div>
                  <p className="text-white font-semibold">{recharge.amount.toFixed(2)} €</p>
                  <p className="text-sm text-gray-400">
                    {new Date(recharge.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(recharge.paymentStatus)}
                  <p className="text-xs text-gray-500 mt-1">{recharge.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BalancePage;
