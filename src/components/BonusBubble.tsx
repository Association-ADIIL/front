import React, { useState, useEffect } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkBalanceRechargeBonus } from '../api/promotions';
import { useNavigate } from 'react-router-dom';

interface BonusBubbleProps {
  className?: string;
  variant?: 'inline' | 'overlay';
}

const BonusBubble: React.FC<BonusBubbleProps> = ({ className = '', variant = 'inline' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [maxBonusPercent, setMaxBonusPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBonus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check bonus for a high amount to get the maximum bonus percentage
        const result = await checkBalanceRechargeBonus(100);
        if (result.eligible && result.bonusPercent) {
          setMaxBonusPercent(result.bonusPercent);
        }
      } catch (error) {
        console.error('Error checking bonus:', error);
      } finally {
        setLoading(false);
      }
    };

    checkBonus();
  }, [user]);

  if (loading || !maxBonusPercent) {
    return null;
  }

  const handleClick = () => {
    navigate('/balance');
  };

  if (variant === 'overlay') {
    return (
      <button
        onClick={handleClick}
        className={`absolute -top-2 -right-2 flex items-center gap-1 bg-gradient-to-r from-accent-mint to-yellow-500 text-darker-bg text-xs font-bold px-2 py-1 rounded-full shadow-lg hover:scale-105 transition-transform cursor-pointer z-10 ${className}`}
      >
        <Gift size={12} />
        <span>+{maxBonusPercent}%</span>
        <Sparkles size={10} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-accent-mint/20 to-yellow-500/20 border border-accent-mint/40 rounded-full px-3 py-1.5 hover:from-accent-mint/30 hover:to-yellow-500/30 transition-colors cursor-pointer ${className}`}
    >
      <Gift size={14} className="text-accent-mint" />
      <span className="text-xs font-bold text-accent-mint">
        Jusqu'à +{maxBonusPercent}% offerts
      </span>
      <Sparkles size={12} className="text-yellow-400" />
    </button>
  );
};

export default BonusBubble;
