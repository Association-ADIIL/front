import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  getPublicBattlePasses,
  getMyBattlePass,
  unlockPremium,
  joinBattlePass,
  type BattlePass,
  type BattlePassLevel,
  type UserBattlePass,
} from '../api/battlePass';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Lock, CheckCircle, Crown, Trophy, Clock, Euro,
  Coffee, Package, Zap, Star, Gift, QrCode, X,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

const XP_RATIO = 5; // 1€ dépensé = 5 XP
const toXp = (euros: number) => Math.round(euros * XP_RATIO);
const fmtXp = (euros: number) => toXp(euros).toLocaleString('fr-FR');

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const getDaysLeft = (endDate: string) =>
  Math.max(0, Math.floor((new Date(endDate).getTime() - Date.now()) / 86400000));

const RewardIcon: React.FC<{ type: string | null; size?: number }> = ({ type, size = 22 }) => {
  if (type === 'BALANCE') return <Euro size={size} />;
  if (type === 'PRODUCT') return <Coffee size={size} />;
  return <Package size={size} />;
};

// ─── Reward Cell ──────────────────────────────────────────────────────────────

interface RewardCellProps {
  lvl: BattlePassLevel;
  tier: 'FREE' | 'PREMIUM';
  userPass: UserBattlePass | null;
  isUnlocked: boolean;
  onShowQr: (level: number, tier: 'FREE' | 'PREMIUM', label: string | null) => void;
  isExpired: boolean;
}

const CELL_W = 140; // px — synced between premium, node and free rows

const RewardCell: React.FC<RewardCellProps> = ({
  lvl, tier, userPass, isUnlocked, onShowQr, isExpired,
}) => {
  const isPremium = tier === 'PREMIUM';
  const claimed = isPremium
    ? (userPass?.claimedPremiumRewards?.includes(lvl.level) ?? false)
    : (userPass?.claimedFreeRewards?.includes(lvl.level) ?? false);
  const hasPremium = userPass?.hasPremium ?? false;
  const rewardType = isPremium ? lvl.premiumRewardType : lvl.freeRewardType;
  const rewardLabel = isPremium ? lvl.premiumRewardLabel : lvl.freeRewardLabel;
  const rewardDetails = isPremium ? lvl.premiumRewardDetails : lvl.freeRewardDetails;
  const rewardValue = isPremium ? lvl.premiumRewardValue : lvl.freeRewardValue;

  const accessible = isUnlocked && (!isPremium || hasPremium);
  const canClaim = accessible && !claimed && !isExpired && !!rewardType;
  const isLocked = isPremium && !hasPremium;

  // Colors
  //const accentColor = isPremium ? 'amber' : 'emerald';
  const bgActive = isPremium ? 'bg-amber-950/60' : 'bg-emerald-950/50';
  const bgClaimed = isPremium ? 'bg-amber-900/30' : 'bg-emerald-900/30';
  const borderActive = isPremium ? 'border-amber-700/40' : 'border-emerald-700/40';
  const borderClaimed = isPremium ? 'border-amber-600/50' : 'border-emerald-600/50';
  const textActive = isPremium ? 'text-amber-200' : 'text-emerald-200';
  const textClaimed = isPremium ? 'text-amber-400' : 'text-emerald-400';
  const iconColor = isPremium ? 'text-amber-400' : 'text-emerald-400';
  const btnBg = isPremium
    ? 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border-amber-500/30'
    : 'bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 border-emerald-500/30';

  if (!rewardType) {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-2xl border border-slate-800/40 bg-transparent"
        style={{ width: CELL_W, height: 140 }}
      >
        <span className="text-slate-700 text-lg">—</span>
      </div>
    );
  }

  return (
    <div
      className={`flex-shrink-0 rounded-2xl border flex flex-col items-center justify-between p-3 transition-all duration-300 relative overflow-hidden
        ${claimed ? `${bgClaimed} ${borderClaimed}` : accessible ? `${bgActive} ${borderActive}` : 'bg-slate-900/40 border-slate-800/30'}
        ${!isUnlocked ? 'opacity-50' : ''}`}
      style={{ width: CELL_W, height: 140 }}
    >
      {/* Glow effect for claimable */}
      {canClaim && (
        <div className={`absolute inset-0 ${isPremium ? 'bg-amber-500/5' : 'bg-emerald-500/5'} pointer-events-none`} />
      )}

      {/* Icon + Label */}
      <div className="flex flex-col items-center gap-1.5 flex-1 justify-center w-full">
        <div className={`${claimed ? textClaimed : accessible ? iconColor : 'text-slate-600'} transition-colors`}>
          {claimed
            ? <CheckCircle size={24} />
            : isLocked
              ? <Lock size={22} className="text-slate-600" />
              : <RewardIcon type={rewardType} size={24} />
          }
        </div>
        <div className={`text-center text-xs font-bold leading-tight px-1 transition-colors
          ${claimed ? textClaimed : accessible ? textActive : 'text-slate-600'}`}>
          {rewardLabel ?? rewardType}
          {rewardType === 'BALANCE' && rewardValue != null && (
            <div className={`text-sm font-black mt-0.5 ${isPremium ? 'text-amber-400' : 'text-emerald-400'}`}>
              +{fmt(rewardValue)}€
            </div>
          )}
        </div>
        {rewardDetails && accessible && !claimed && (
          <p className="text-[10px] text-slate-500 text-center leading-tight px-1 line-clamp-2">{rewardDetails}</p>
        )}
      </div>

      {/* CTA */}
      <div className="w-full mt-1">
        {claimed ? (
          <div className={`text-center text-[10px] font-bold py-1 ${textClaimed}`}>✓ Réclamé</div>
        ) : canClaim ? (
          <button
            onClick={() => onShowQr(lvl.level, tier, rewardLabel)}
            className={`w-full py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:scale-[1.02] flex items-center justify-center gap-1 ${btnBg}`}
          >
            <QrCode size={12} />QR Code
          </button>
        ) : isLocked ? (
          <div className="text-center text-[10px] text-slate-600 py-1">Premium requis</div>
        ) : !isUnlocked ? (
          <div className="text-center text-[10px] text-slate-600 py-1">Pas encore atteint</div>
        ) : isExpired ? (
          <div className="text-center text-[10px] text-red-600 py-1">Expiré</div>
        ) : null}
      </div>
    </div>
  );
};

// ─── Level Node ───────────────────────────────────────────────────────────────

const LevelNode: React.FC<{
  lvl: BattlePassLevel;
  isUnlocked: boolean;
  isCurrent: boolean;
}> = ({ lvl, isUnlocked, isCurrent }) => (
  <div className="flex-shrink-0 flex flex-col items-center justify-center gap-0" style={{ width: CELL_W }}>
    {/* Connector line + node row */}
    <div className="flex items-center w-full h-8 overflow-visible">
      {/* Left line */}
      <div className={`flex-1 h-0.5 -ml-1 transition-all ${isUnlocked ? 'bg-emerald-500/60' : 'bg-slate-700/40'}`} />
      {/* Node */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-500
        ${isCurrent
          ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.6)]'
          : isUnlocked
            ? 'bg-emerald-700 border-emerald-500'
            : 'bg-slate-800 border-slate-600'
        }`}>
        {isUnlocked
          ? <CheckCircle size={14} className="text-white" />
          : <span className="text-[10px] font-black text-slate-500">{lvl.level}</span>
        }
      </div>
      {/* Right line */}
      <div className={`flex-1 h-0.5 -mr-1 transition-all ${isUnlocked ? 'bg-emerald-500/60' : 'bg-slate-700/40'}`} />
    </div>

    {/* Level label + spend */}
    <div className="text-center mt-1">
      <div className={`text-xs font-black tracking-wide ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
        {isCurrent ? <span className="text-emerald-400">NV. {lvl.level}</span> : `NV. ${lvl.level}`}
      </div>
      <div className={`text-[10px] ${isUnlocked ? 'text-emerald-500' : 'text-slate-600'} flex items-center justify-center gap-0.5`}>
        <Zap size={8} />{fmtXp(lvl.requiredSpend)} XP
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const BattlePassPage: React.FC = () => {
  useDocumentTitle('Pass de combat — ADIIL');
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [passes, setPasses] = useState<BattlePass[]>([]);
  const [selectedPass, setSelectedPass] = useState<BattlePass | null>(null);
  const [userPass, setUserPass] = useState<UserBattlePass | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUserPass, setLoadingUserPass] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!selectedPass || !user) return;
    setJoining(true);
    try {
      const newPass = await joinBattlePass(selectedPass.id);
      setUserPass(newPass);
      addNotification('success', 'Inscrit au pass de combat !');
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    } finally {
      setJoining(false);
    }
  };

  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [qrReward, setQrReward] = useState<{ level: number; tier: 'FREE' | 'PREMIUM'; label: string | null } | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPublicBattlePasses()
      .then((data) => {
        setPasses(data);
        if (data.length > 0) setSelectedPass(data[0]);
      })
      .catch(() => addNotification('error', 'Impossible de charger les pass de combat'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPass || !user) { setUserPass(null); return; }

    const fetchUserPass = () => {
      getMyBattlePass(selectedPass.id)
        .then(setUserPass)
        .catch(() => setUserPass(null));
    };

    setLoadingUserPass(true);
    getMyBattlePass(selectedPass.id)
      .then(setUserPass)
      .catch(() => setUserPass(null))
      .finally(() => setLoadingUserPass(false));

    // Re-fetch quand l'onglet redevient actif
    window.addEventListener('focus', fetchUserPass);
    document.addEventListener('visibilitychange', fetchUserPass);

    return () => {
      window.removeEventListener('focus', fetchUserPass);
      document.removeEventListener('visibilitychange', fetchUserPass);
    };
  }, [selectedPass, user]);

  const handleUnlockPremium = async () => {
    if (!selectedPass || !user) return;
    setUnlocking(true);
    try {
      await unlockPremium(selectedPass.id);
      const updated = await getMyBattlePass(selectedPass.id);
      setUserPass(updated);
      setShowUnlockConfirm(false);
      addNotification('success', 'Tier Premium débloqué !');
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur lors du déblocage');
    } finally {
      setUnlocking(false);
    }
  };

  const currentSpend = userPass?.currentSpend ?? 0;
  const levels = selectedPass?.levels ?? [];
  const currentLevel = levels.reduce((max, l) => currentSpend >= l.requiredSpend ? l.level : max, 0);
  const nextLevel = levels.find((l) => l.level === currentLevel + 1);
  const progressToNext = nextLevel
    ? Math.min(100, (currentSpend / nextLevel.requiredSpend) * 100)
    : levels.length > 0 ? 100 : 0;
  const isExpired = selectedPass ? new Date() > new Date(selectedPass.endDate) : false;
  const daysLeft = selectedPass ? getDaysLeft(selectedPass.endDate) : 0;

  const hasPremium = userPass?.hasPremium ?? false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-300 mb-2">Pas de pass actif</h1>
          <p className="text-slate-500">Aucun pass de combat n'est disponible pour le moment. Revenez bientôt !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] left-1/3 w-[700px] h-[500px] bg-amber-600/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-emerald-600/4 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Pass de Combat</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Achète en boutique, progresse et réclame tes récompenses</p>
            </div>
          </div>

          {/* Pass selector */}
          {passes.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {passes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPass(p)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                    selectedPass?.id === p.id
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600/50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPass && (
          <>
            {/* ── Pass hero card ─────────────────────────────────────────────── */}
            <div className="rounded-3xl border border-slate-700/40 mb-6 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f1420 0%, #0a0e1a 100%)' }}>

              {/* Top bar */}
              <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/60 gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-base sm:text-lg font-black text-white">{selectedPass.name}</span>
                  {!isExpired ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 uppercase tracking-wider">
                      Terminé
                    </span>
                  )}
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/40 text-slate-400 border border-slate-600/30">
                    <Zap size={10} className="text-emerald-500" />1€ = {XP_RATIO} XP
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="hidden sm:flex items-center gap-1.5">
                    <Clock size={12} />
                    {formatDate(selectedPass.startDate)} → {formatDate(selectedPass.endDate)}
                  </span>
                  {!isExpired && (
                    <span className={`flex items-center gap-1 font-bold ${daysLeft <= 7 ? 'text-red-400' : 'text-slate-400'}`}>
                      <Zap size={12} />
                      {daysLeft}j restants
                    </span>
                  )}
                </div>
              </div>

              {/* Stats + progress */}
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                {user ? (
                  loadingUserPass ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                      <span className="text-sm text-slate-500">Chargement de ta progression…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-6">
                      {/* Left: current level + spend */}
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Niveau actuel</div>
                          <div className="text-4xl sm:text-5xl font-black text-white leading-none">{currentLevel}</div>
                        </div>
                        <div className="w-px h-10 sm:h-12 bg-slate-800" />
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">XP</div>
                          <div className="text-2xl sm:text-3xl font-black text-emerald-400 leading-none tabular-nums">{fmtXp(currentSpend)} XP</div>
                        </div>
                        {nextLevel && (
                          <>
                            <div className="w-px h-10 sm:h-12 bg-slate-800" />
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Prochain niveau à</div>
                              <div className="text-xl sm:text-2xl font-black text-slate-300 leading-none">{fmtXp(nextLevel.requiredSpend)} XP</div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="flex-1 lg:max-w-xl">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                          <span>Progression vers le niveau {currentLevel + 1}</span>
                          <span className="text-emerald-500 font-bold">{Math.round(progressToNext)}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/30">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${progressToNext}%`,
                              background: 'linear-gradient(90deg, #059669 0%, #34d399 100%)',
                              boxShadow: '0 0 12px rgba(52,211,153,0.4)',
                            }}
                          />
                        </div>
                        {nextLevel && (
                          <div className="text-[10px] text-slate-600 mt-1 text-right">
                            encore {fmtXp(Math.max(0, nextLevel.requiredSpend - currentSpend))} XP
                          </div>
                        )}
                      </div>

                      {/* Premium button */}
                      <div className="flex-shrink-0 flex gap-3">
                        {!userPass && !isExpired && (
                          <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:scale-[1.02] border border-emerald-500/30 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', boxShadow: '0 8px 24px rgba(5,150,105,0.3)' }}
                          >
                            <Star size={18} />
                            <div>
                              <div>Rejoindre</div>
                              <div className="text-[11px] text-emerald-200 font-normal">Tier gratuit</div>
                            </div>
                          </button>
                        )}
                        {userPass && (
                          hasPremium ? (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold text-sm w-full lg:w-auto justify-center lg:justify-start">
                              <Crown size={16} className="text-amber-400" />
                              <div>
                                <div>Premium actif</div>
                                <div className="text-[10px] text-amber-600 font-normal">Toutes les récompenses débloquées</div>
                              </div>
                            </div>
                          ) : !isExpired ? (
                            <button
                              onClick={() => setShowUnlockConfirm(true)}
                              className="w-full lg:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:scale-[1.02] border border-amber-500/30"
                              style={{ background: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)', boxShadow: '0 8px 24px rgba(180,83,9,0.3)' }}
                            >
                              <Crown size={18} />
                              <div>
                                <div>Débloquer Premium</div>
                                <div className="text-[11px] text-amber-200 font-normal">{fmt(selectedPass.premiumPrice)}€ via solde Adiil</div>
                              </div>
                            </button>
                          ) : null
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-slate-400 text-sm">Connecte-toi pour suivre ta progression et réclamer des récompenses.</div>
                    <Link
                      to="/login"
                      className="flex-shrink-0 px-4 py-2 rounded-xl bg-slate-700/60 border border-slate-600/30 text-white text-sm font-semibold hover:bg-slate-600/60 transition-all"
                    >
                      Se connecter
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ── Track ──────────────────────────────────────────────────────────── */}
            {levels.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Gift size={36} className="mx-auto mb-3 opacity-30" />
                <p>Les niveaux de ce pass seront bientôt configurés</p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* ── Tier labels ── */}
                <div className="grid grid-cols-2 gap-4 mb-3 max-w-xs">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-900/20 border border-amber-800/30">
                    <Crown size={12} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Premium</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
                    <Star size={12} className="text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Gratuit</span>
                  </div>
                </div>

                {/* ── Scrollable track ── */}
                <div
                  ref={trackRef}
                  className="overflow-x-auto pb-4"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.25) transparent' }}
                >
                  {/* Outer wrapper : 3 rows stacked */}
                  <div className="inline-flex flex-col min-w-full">

                    {/* ROW 1 : Premium rewards */}
                    <div
                      className="flex gap-2 mb-3 px-2 py-2 rounded-2xl"
                      style={{ background: 'linear-gradient(180deg, rgba(120,53,15,0.15) 0%, rgba(120,53,15,0.03) 100%)' }}
                    >
                      {/* Start spacer */}
                      <div className="flex-shrink-0" style={{ width: 40 }} />

                      {levels.map((lvl) => (
                        <RewardCell
                          key={`prem-${lvl.id}`}
                          lvl={lvl}
                          tier="PREMIUM"
                          userPass={user ? userPass : null}
                          isUnlocked={currentSpend >= lvl.requiredSpend}
                          onShowQr={(level, tier, label) => setQrReward({ level, tier, label })}
                          isExpired={isExpired}
                        />
                      ))}

                      {/* End spacer */}
                      <div className="flex-shrink-0" style={{ width: 56 }} />
                    </div>

                    {/* ROW 2 : Level nodes + connector track */}
                    <div className="flex gap-2 mb-3 ml-2">
                      {/* Start cap : cercle seul, la ligne gauche du premier nœud colle directement */}
                      <div className="flex-shrink-0 h-8 flex items-center" style={{ width: 40 }}>
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
                          <Star size={14} className="text-slate-500" />
                        </div>
                        <div className={`flex-1 h-0.5 -mr-1 ${levels.length > 0 && currentSpend >= levels[0].requiredSpend ? 'bg-emerald-500/60' : 'bg-slate-700/40'}`} />
                      </div>

                      {levels.map((lvl) => (
                        <LevelNode
                          key={`node-${lvl.id}`}
                          lvl={lvl}
                          isUnlocked={currentSpend >= lvl.requiredSpend}
                          isCurrent={lvl.level === currentLevel}
                        />
                      ))}

                      {/* End cap : ligne puis trophée */}
                      <div className="flex-shrink-0 h-8 flex items-center" style={{ width: 48 }}>
                        <div className={`flex-1 h-0.5 -ml-1 ${levels.length > 0 && currentSpend >= levels[levels.length - 1].requiredSpend ? 'bg-emerald-500/60' : 'bg-slate-700/40'}`} />
                        <div className="w-8 h-8 rounded-full border-2 border-amber-600/40 bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                          <Trophy size={16} className="text-amber-500" />
                        </div>
                      </div>
                    </div>

                    {/* ROW 3 : Free rewards */}
                    <div
                      className="flex gap-2 px-2 py-2 rounded-2xl"
                      style={{ background: 'linear-gradient(0deg, rgba(6,78,59,0.15) 0%, rgba(6,78,59,0.03) 100%)' }}
                    >
                      {/* Start spacer */}
                      <div className="flex-shrink-0" style={{ width: 40 }} />

                      {levels.map((lvl) => (
                        <RewardCell
                          key={`free-${lvl.id}`}
                          lvl={lvl}
                          tier="FREE"
                          userPass={user ? userPass : null}
                          isUnlocked={currentSpend >= lvl.requiredSpend}
                          onShowQr={(level, tier, label) => setQrReward({ level, tier, label })}
                          isExpired={isExpired}
                        />
                      ))}

                      {/* End spacer */}
                      <div className="flex-shrink-0" style={{ width: 56 }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Info banner ─────────────────────────────────────────────────── */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/40 text-xs text-slate-600 space-y-1.5">
              <p>• <h2><strong className="text-slate-500">TOUT ACHAT NE PASSANT PAS PAR LE SITE NE POURRA PAS FAIRE AVANCER TA PROGRESSION SUR LE BATTLE PASS</strong></h2></p>
              <p>• <strong className="text-slate-500">Dépenses comptabilisées</strong> : commandes boutique payées pendant la saison (toute méthode, sauf gratuités). Les rechargements de solde et les inscriptions événements ne comptent pas.</p>
              <p>• Chaque pass est <strong className="text-slate-500">indépendant</strong> — payer le Premium d'un pass ne donne pas accès aux suivants.</p>
              <p>• Les récompenses doivent être réclamées <strong className="text-slate-500">avant l'expiration</strong> du pass.</p>
              <p>• Les récompenses <strong className="text-slate-500">Produit</strong> (boissons, snacks…) sont à récupérer au BDE.</p>
            </div>
          </>
        )}
      </div>

      {/* ── Unlock Premium Modal ─────────────────────────────────────────────── */}
      {showUnlockConfirm && selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl border border-amber-600/20 overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #0f1015 0%, #0a0c10 100%)' }}>

            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Crown size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Débloquer Premium</h3>
                  <p className="text-xs text-slate-500">{selectedPass.name}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/30 p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Prix</span>
                  <span className="text-white font-black text-xl">{fmt(selectedPass.premiumPrice)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Paiement</span>
                  <span className="text-slate-300">Solde Adiil</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-6">
                {fmt(selectedPass.premiumPrice)}€ seront débités de ton solde Adiil. Cette action est irréversible et propre à ce pass uniquement.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnlockConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700/30 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUnlockPremium}
                  disabled={unlocking}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 border border-amber-600/30"
                  style={{ background: 'linear-gradient(135deg, #92400e, #d97706)' }}
                >
                  {unlocking ? 'Traitement…' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── QR Code Modal ─────────────────────────────────────────────────── */}
      {qrReward && selectedPass && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl border border-amber-600/20 overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #0f1015 0%, #0a0c10 100%)' }}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <QrCode size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">QR Code récompense</h3>
                  <p className="text-xs text-slate-500">Niveau {qrReward.level} — {qrReward.tier === 'PREMIUM' ? 'Premium' : 'Gratuit'}</p>
                </div>
              </div>
              <button
                onClick={() => setQrReward(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="bg-white rounded-2xl p-4 mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/battle-pass-claim/${selectedPass.id}/${user.id}/${qrReward.level}/${qrReward.tier}`}
                  size={250}
                  level="H"
                  className="w-full h-auto"
                />
              </div>
              <div className="text-center space-y-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${qrReward.tier === 'PREMIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <Trophy size={12} />
                  {qrReward.label || 'Récompense'}
                </div>
                <p className="text-slate-600 text-xs mt-2 bg-slate-900/50 rounded-xl px-3 py-2">
                  Présente ce QR Code au BDE pour valider la récupération
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattlePassPage;