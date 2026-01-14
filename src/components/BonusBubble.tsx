import React, { useState, useEffect } from 'react';
import { Gift, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkBalanceRechargeBonus } from '../api/promotions';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

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
        // Check bonus with a reasonable amount (10€) that's likely within promotion tiers
        const result = await checkBalanceRechargeBonus(10);
        if (result.eligible) {
          // Get max bonus percent from tiers if available, otherwise use the direct value
          let bonusPercent = result.bonusPercent;

          if (result.tiers && result.tiers.length > 0) {
            // Find the maximum bonus percentage from all tiers
            const maxFromTiers = Math.max(...result.tiers.map(tier => tier.bonusPercent));
            bonusPercent = Math.max(bonusPercent || 0, maxFromTiers);
          }

          if (bonusPercent && bonusPercent > 0) {
            setMaxBonusPercent(bonusPercent);
          }
        }
      } catch (error) {
        logger.error('Error checking bonus', error);
      } finally {
        setLoading(false);
      }
    };

    checkBonus();
  }, [user]);

  if (loading || maxBonusPercent === null || maxBonusPercent <= 0) {
    return null;
  }

  const handleClick = () => {
    navigate('/balance');
  };

  if (variant === 'overlay') {
    return (
      <button
        onClick={handleClick}
        className={`absolute flex items-center gap-1 bg-yellow-400 text-darker-bg text-xs font-bold pl-1.5 pr-2.5 py-1 rounded-full shadow-lg shadow-yellow-400/40 hover:bg-yellow-300 hover:scale-110 transition-all cursor-pointer z-10 animate-bonus-pulse ${className}`}
      >
        <span className="w-5 h-5 bg-darker-bg/20 rounded-full flex items-center justify-center">
          <Zap size={12} className="fill-current" />
        </span>
        <span className="font-extrabold">+{maxBonusPercent}%</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 bg-yellow-400 text-darker-bg rounded-xl px-4 py-2 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/30 transition-all cursor-pointer ${className}`}
    >
      <span className="w-6 h-6 bg-darker-bg/20 rounded-lg flex items-center justify-center group-hover:bg-darker-bg/30 transition-colors">
        <Gift size={14} />
      </span>
      <span className="text-sm font-bold">
        Jusqu'à <span className="text-base font-extrabold">+{maxBonusPercent}%</span> offerts
      </span>
    </button>
  );
};

export default BonusBubble;
