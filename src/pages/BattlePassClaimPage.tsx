import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClaimPickupInfo, adminClaimRewardForUser, type ClaimPickupInfo } from '../api/battlePass';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  Trophy,
  User,
  CreditCard,
  Package,
  Gift,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

const BattlePassClaimPage: React.FC = () => {
  useDocumentTitle('Récupération récompense');
  const { battlePassId, userId, level, tier } = useParams<{
    battlePassId: string;
    userId: string;
    level: string;
    tier: string;
  }>();
  const { user, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const [info, setInfo] = useState<ClaimPickupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const isAdmin = user?.type === 'ADMIN_BDE' || user?.type === 'ADMIN_PROF';

  useEffect(() => {
    const fetchInfo = async () => {
      if (!battlePassId || !userId || !level || !tier) {
        setError('Paramètres manquants');
        setLoading(false);
        return;
      }
      if (!['FREE', 'PREMIUM'].includes(tier)) {
        setError('Tier invalide');
        setLoading(false);
        return;
      }
      try {
        const data = await getClaimPickupInfo(
          parseInt(battlePassId),
          parseInt(userId),
          parseInt(level),
          tier as 'FREE' | 'PREMIUM'
        );
        setInfo(data);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [battlePassId, userId, level, tier]);

  const handleConfirm = async () => {
    if (!info) return;
    setConfirming(true);
    try {
      const result = await adminClaimRewardForUser(
        info.battlePass.id,
        info.user.id,
        info.level,
        info.tier
      );
      setInfo({ ...info, isClaimed: true });
      if (result.balanceAdded > 0) {
        addNotification('success', `+${result.balanceAdded.toFixed(2)}€ crédités sur le solde de ${info.user.firstName} !`);
      } else {
        addNotification('success', `Récompense validée pour ${info.user.firstName} ${info.user.lastName} !`);
      }
    } catch (err: any) {
      addNotification('error', err.message || 'Erreur lors de la validation');
    } finally {
      setConfirming(false);
    }
  };

  const getRewardIcon = (type: string | null, tier: 'FREE' | 'PREMIUM') => {
    const color = tier === 'PREMIUM' ? 'text-amber-400' : 'text-emerald-400';
    if (type === 'BALANCE') return <CreditCard size={28} className={color} />;
    if (type === 'PRODUCT') return <Package size={28} className={color} />;
    return <Gift size={28} className={color} />;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="bg-dark-bg rounded-2xl border border-red-500/30 p-8 max-w-md text-center">
          <XCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accès refusé</h2>
          <p className="text-gray-400">Seuls les administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="bg-dark-bg rounded-2xl border border-red-500/30 p-8 max-w-md text-center">
          <XCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-gray-400">{error || 'Récompense introuvable'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg min-h-screen">
      {/* Header */}
      <section className="bg-darker-bg py-8 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Trophy size={22} className="text-amber-400" />
            </div>
            <div>
              <span className="text-amber-400 text-sm font-bold uppercase tracking-wider">Pass de combat</span>
              <h1 className="text-4xl md:text-5xl font-koulen text-white mt-1">RECUPERATION RECOMPENSE</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">

          {/* Pass info */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6 mb-6">
            <p className="text-gray-500 text-sm mb-1">Pass de combat</p>
            <h2 className="text-xl font-bold text-white">{info.battlePass.name}</h2>
            <p className="text-gray-500 text-xs mt-1">
              Du {new Date(info.battlePass.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} au {new Date(info.battlePass.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {info.isExpired && <span className="ml-2 text-red-400 font-medium">Expiré</span>}
            </p>
          </div>

          {/* Customer info */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                <User size={28} className="text-accent-mint" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Utilisateur</p>
                <h2 className="text-2xl font-bold text-white">{info.user.firstName} {info.user.lastName}</h2>
                <p className="text-gray-500 text-xs">{info.user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-bg rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Dépenses enregistrées</p>
                <p className="text-white font-bold">{info.currentSpend.toFixed(2)}€</p>
              </div>
              <div className="bg-dark-bg rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Tier premium</p>
                <p className={`font-bold ${info.hasPremium ? 'text-amber-400' : 'text-gray-600'}`}>
                  {info.hasPremium ? '✦ Débloqué' : 'Non débloqué'}
                </p>
              </div>
            </div>
          </div>

          {/* Reward info */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${info.tier === 'PREMIUM' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                {getRewardIcon(info.rewardType, info.tier)}
              </div>
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-1 ${info.tier === 'PREMIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <Trophy size={11} />
                  Niveau {info.level} — Tier {info.tier === 'PREMIUM' ? 'Premium' : 'Gratuit'}
                </div>
                <h3 className="text-lg font-bold text-white">{info.rewardLabel || info.rewardType || 'Récompense'}</h3>
                {info.rewardValue ? (
                  <p className={`font-bold text-sm ${info.tier === 'PREMIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>Valeur : {info.rewardValue.toFixed(2)}€</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Validation */}
          {info.isClaimed ? (
            <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-6 text-center">
              <AlertCircle size={48} className="mx-auto text-yellow-400 mb-3" />
              <p className="text-yellow-400 font-bold text-xl mb-2">RÉCOMPENSE DÉJÀ RÉCUPÉRÉE</p>
              <p className="text-yellow-300/80 text-sm">
                Cette récompense a déjà été validée pour cet utilisateur.
              </p>
              <p className="text-yellow-300/60 text-xs mt-2">
                Ne pas remettre la récompense à nouveau.
              </p>
            </div>
          ) : !info.isUnlocked ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <XCircle size={32} className="mx-auto text-red-400 mb-2" />
              <p className="text-red-400 font-bold">Niveau non débloqué</p>
              <p className="text-gray-500 text-sm mt-1">L'utilisateur n'a pas encore atteint les dépenses requises pour ce niveau.</p>
            </div>
          ) : info.tier === 'PREMIUM' && !info.hasPremium ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <XCircle size={32} className="mx-auto text-red-400 mb-2" />
              <p className="text-red-400 font-bold">Tier Premium non débloqué</p>
              <p className="text-gray-500 text-sm mt-1">L'utilisateur n'a pas souscrit au tier Premium de ce pass.</p>
            </div>
          ) : info.isExpired ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <Clock size={32} className="mx-auto text-red-400 mb-2" />
              <p className="text-red-400 font-bold">Pass expiré</p>
              <p className="text-gray-500 text-sm mt-1">Les récompenses ne sont plus récupérables après la fin du pass.</p>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className={`w-full py-4 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-dark-bg ${info.tier === 'PREMIUM' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
            >
              {confirming ? (
                <span className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={20} />
                  Valider la récupération
                </>
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default BattlePassClaimPage;
