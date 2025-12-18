import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus } from 'lucide-react';
import { getMyBalance } from '../api/balance';
import { useAuth } from '../context/AuthContext';

interface BalanceDisplayProps {
  variant?: 'card' | 'inline' | 'compact';
  showRechargeButton?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  variant = 'inline',
  showRechargeButton = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchBalance = async () => {
        try {
          const data = await getMyBalance();
          setBalance(data.balance);
        } catch (error) {
          console.error('Error fetching balance:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchBalance();
    }
  }, [user]);

  if (!user || loading) {
    return null;
  }

  if (variant === 'card') {
    return (
      <div className="card p-6 bg-gradient-to-br from-accent-mint/10 to-darker-bg border border-accent-mint/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent-mint/20 p-3 rounded-lg">
              <CreditCard size={24} className="text-accent-mint" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Solde ADIIL</p>
              <p className="text-3xl font-bold text-accent-mint">
                {balance !== null ? `${balance.toFixed(2)} €` : '---'}
              </p>
            </div>
          </div>
          {showRechargeButton && (
            <button
              onClick={() => navigate('/balance')}
              className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Recharger
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5 bg-darker-bg/80 backdrop-blur-sm border border-accent-mint/20 rounded-lg p-3 shadow-lg">
        <CreditCard size={20} className="text-accent-mint" />
        <div>
          <p className="text-xs text-gray-400 leading-none mb-0.5">Solde</p>
          <p className="text-base font-bold text-accent-mint leading-tight">
            {balance !== null ? `${balance.toFixed(2)} €` : '---'}
          </p>
        </div>
        {showRechargeButton && (
          <button
            onClick={() => navigate('/balance')}
            className="bg-accent-mint/90 text-darker-bg font-bold py-1.5 px-2.5 rounded hover:bg-accent-mint transition-colors text-sm flex items-center gap-1"
            title="Recharger le solde"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-darker-bg border border-accent-mint/30 rounded-lg p-3">
      <CreditCard size={20} className="text-accent-mint" />
      <div className="flex-grow">
        <p className="text-xs text-gray-400">Solde ADIIL</p>
        <p className="text-lg font-bold text-accent-mint">
          {balance !== null ? `${balance.toFixed(2)} €` : '---'}
        </p>
      </div>
      {showRechargeButton && (
        <button
          onClick={() => navigate('/balance')}
          className="bg-accent-mint text-darker-bg font-bold py-1.5 px-3 rounded hover:bg-white transition-colors text-sm flex items-center gap-1"
        >
          <Plus size={16} />
          Recharger
        </button>
      )}
    </div>
  );
};

export default BalanceDisplay;
