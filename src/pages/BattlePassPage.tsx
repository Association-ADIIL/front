import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  getPublicBattlePasses,
  getMyBattlePass,
  unlockPremium,
  joinBattlePass,
  claimReward,
  getBattlePassLeaderboard,
  type BattlePass,
  type BattlePassLevel,
  type UserBattlePass,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from '../api/battlePass';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Lock, Check, CheckCircle, Crown, Trophy, Clock, Euro,
  Coffee, Package, Zap, Star, Gift, QrCode, X, AlertTriangle, Info, Medal,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

const XP_RATIO = 5; // 1€ dépensé = 5 XP
const toXp = (euros: number) => Math.round(euros * XP_RATIO);
const fmtXp = (euros: number) => toXp(euros).toLocaleString('fr-FR');

const CELL_W = 140; // px — largeur d'une colonne de palier
const TICKET_W = 168; // px — largeur augmentée pour donner du padding entre ticket et premier palier

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
  onClaimBalance: (level: number, tier: 'FREE' | 'PREMIUM') => void;
  isExpired: boolean;
}

const RewardCell: React.FC<RewardCellProps> = ({
  lvl, tier, userPass, isUnlocked, onShowQr, onClaimBalance, isExpired,
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
  const rewardImageUrl = isPremium ? lvl.premiumRewardImageUrl : lvl.freeRewardImageUrl;

  const accessible = isUnlocked && (!isPremium || hasPremium);
  const canClaim = accessible && !claimed && !isExpired && !!rewardType;
  const reached = accessible || claimed;

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
        className="w-full flex items-center justify-center rounded-2xl border border-slate-800/40 bg-transparent"
        style={{ height: 140 }}
      >
        <span className="text-slate-700 text-lg">—</span>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl border flex flex-col items-center justify-between p-3 transition-all duration-300 relative overflow-hidden group
        ${claimed ? `${bgClaimed} ${borderClaimed}` : `${bgActive} ${borderActive}`}`}
      style={{ height: 140 }}
    >
      {canClaim && (
        <div className={`absolute inset-0 ${isPremium ? 'bg-amber-500/5' : 'bg-emerald-500/5'} pointer-events-none`} />
      )}

      <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 ${
        reached
          ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
          : 'bg-slate-800 border-slate-600'
      }`}>
        {reached
          ? <Check size={13} className="text-white" strokeWidth={3} />
          : <Lock size={12} className="text-slate-400" />
        }
      </div>

      <div className="flex flex-col items-center gap-1.5 flex-1 justify-center w-full">
        {rewardImageUrl ? (
          <>
            <div className={`relative rounded-xl overflow-hidden border border-white/10 flex-shrink-0 ${rewardType === 'BALANCE' ? 'w-14 h-14' : 'w-20 h-20'}`}>
              <img
                src={rewardImageUrl}
                alt={rewardLabel ?? 'Récompense'}
                className="w-full h-full object-cover"
              />
            </div>
            {rewardType === 'BALANCE' && rewardValue != null && (
              <div className={`text-center text-sm font-black transition-colors ${claimed ? textClaimed : textActive}`}>
                +{fmt(rewardValue)}€
              </div>
            )}

            {(rewardDetails || rewardLabel) && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-center p-3 gap-1 pointer-events-none">
                <span className={`text-xs font-black ${isPremium ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {rewardLabel ?? rewardType}
                </span>
                {rewardType === 'BALANCE' && rewardValue != null && (
                  <span className="text-sm font-black text-emerald-400">+{fmt(rewardValue)}€</span>
                )}
                {rewardDetails && (
                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-4">{rewardDetails}</p>
                )}
                {isPremium && !hasPremium && (
                  <span className="text-[10px] text-amber-500 font-bold mt-1">🔒 Premium requis</span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className={`${claimed ? textClaimed : iconColor} transition-colors`}>
              {claimed ? <CheckCircle size={24} /> : <RewardIcon type={rewardType} size={24} />}
            </div>
            <div className={`text-center text-xs font-bold leading-tight px-1 transition-colors ${claimed ? textClaimed : textActive}`}>
              {rewardLabel ?? rewardType}
              {rewardType === 'BALANCE' && rewardValue != null && (
                <div className={`text-sm font-black mt-0.5 ${isPremium ? 'text-amber-400' : 'text-emerald-400'}`}>
                  +{fmt(rewardValue)}€
                </div>
              )}
            </div>
            {rewardDetails && !claimed && (
              <p className="text-[10px] text-slate-500 text-center leading-tight px-1 line-clamp-2">{rewardDetails}</p>
            )}
          </>
        )}
      </div>

      <div className="w-full mt-1">
        {claimed ? (
          <div className={`text-center text-[10px] font-bold py-1 ${textClaimed}`}>✓ Réclamé</div>
        ) : canClaim ? (
          rewardType === 'BALANCE' ? (
            <button
              onClick={() => onClaimBalance(lvl.level, tier)}
              className={`w-full py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:scale-[1.02] flex items-center justify-center gap-1 ${btnBg}`}
            >
              <Euro size={12} />Réclamer
            </button>
          ) : (
            <button
              onClick={() => onShowQr(lvl.level, tier, rewardLabel)}
              className={`w-full py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:scale-[1.02] flex items-center justify-center gap-1 ${btnBg}`}
            >
              <QrCode size={12} />QR Code
            </button>
          )
        ) : isPremium && !hasPremium ? (
          <div className="text-center text-[10px] text-slate-500 py-1">Premium requis</div>
        ) : !isUnlocked ? (
          <div className="text-center text-[10px] text-slate-500 py-1">Pas encore atteint</div>
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
  <div className="w-full flex flex-col items-center justify-center relative">
    <div className="h-8 flex items-center justify-center relative z-10">
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
    </div>

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

// ─── Pass Tickets (Premium / Free) ────────────────────────────────────────────
const PAGE_BG = '#0a0e1a';

const PassTicket: React.FC<{
  variant: 'premium' | 'free';
  active: boolean;
  serial: string;
  onClick?: () => void;
}> = ({ variant, active, serial, onClick }) => {
  const isPremium = variant === 'premium';

  const body    = isPremium ? '#f59e0b' : active ? '#10b981' : '#475569';
  const light   = isPremium ? '#fde68a' : active ? '#6ee7b7' : '#94a3b8';
  const outline = isPremium ? '#78350f' : active ? '#065f46' : '#1e293b';
  const textOn  = isPremium ? '#78350f' : '#ffffff';

  const NOTCH_R = 42;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative block w-full aspect-[3/2] min-w-0 transition-transform duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.04]' : 'cursor-default'}`}
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }}
    >
      <svg viewBox="0 0 750 500" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <rect x="3" y="3" width="744" height="494" rx="20" fill={body} stroke={outline} strokeWidth="6" />

        <rect x="190" y="0" width="560" height="100" fill={light} />
        <rect x="190" y="400" width="560" height="100" fill={light} />
        <line x1="190" y1="100" x2="750" y2="100" stroke={outline} strokeWidth="3" />
        <line x1="190" y1="400" x2="750" y2="400" stroke={outline} strokeWidth="3" />

        <line x1="230" y1="50" x2="700" y2="50" stroke={outline} strokeWidth="7" strokeDasharray="24 16" />
        <line x1="230" y1="450" x2="700" y2="450" stroke={outline} strokeWidth="7" strokeDasharray="24 16" />

        <rect x="30" y="60" width="130" height="380" rx="6" fill="none" stroke={outline} strokeWidth="4" />
        {Array.from({ length: 13 }).map((_, i) => (
          <circle key={i} cx="190" cy={30 + i * 36} r="4" fill={outline} />
        ))}

        <rect x="200" y="112" width="540" height="276" rx="10" fill="none" stroke={outline} strokeWidth="2" strokeOpacity="0.35" />

        <text
          x="95" y="250"
          textAnchor="middle"
          fill={outline}
          fontFamily="monospace"
          fontSize="26"
          letterSpacing="4"
          transform="rotate(-90 95 250)"
        >
          №{serial}
        </text>

        <circle cx="0"   cy="0"   r={NOTCH_R} fill={PAGE_BG} stroke={outline} strokeWidth="6" />
        <circle cx="750" cy="0"   r={NOTCH_R} fill={PAGE_BG} stroke={outline} strokeWidth="6" />
        <circle cx="0"   cy="500" r={NOTCH_R} fill={PAGE_BG} stroke={outline} strokeWidth="6" />
        <circle cx="750" cy="500" r={NOTCH_R} fill={PAGE_BG} stroke={outline} strokeWidth="6" />
      </svg>

      <div
        className="absolute flex flex-col items-center justify-center gap-1"
        style={{ left: '25.3%', right: 0, top: '20%', bottom: '20%' }}
      >
        {isPremium ? (
          <Crown size={26} color={textOn} />
        ) : (
          <Star size={22} color={textOn} />
        )}
        <span className="font-black text-xs sm:text-sm tracking-wider uppercase" style={{ color: textOn }}>
          {isPremium ? 'Premium' : 'Gratuit'}
        </span>
        {active && (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-90" style={{ color: textOn }}>
            {isPremium ? 'Actif' : 'Débloqué'}
          </span>
        )}
      </div>
    </button>
  );
};

// ─── Leaderboard ────────────────────────────────────────────────────────────

const PODIUM_HEIGHTS: Record<number, number> = { 1: 96, 2: 68, 3: 52 };

const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const PodiumCard: React.FC<{ entry: LeaderboardEntry; isMe: boolean }> = ({ entry, isMe }) => {
  const isFirst = entry.rank === 1;
  const isSecond = entry.rank === 2;
  const ringColor = isFirst ? 'border-amber-400' : isSecond ? 'border-slate-300' : 'border-amber-700';
  const glow = isFirst ? 'shadow-[0_0_30px_rgba(251,191,36,0.5)]' : '';
  const avatarBg = isFirst
    ? 'bg-gradient-to-br from-amber-400 to-amber-600'
    : isSecond
      ? 'bg-gradient-to-br from-slate-300 to-slate-500'
      : 'bg-gradient-to-br from-amber-700 to-amber-900';
  const pedestalBg = isFirst
    ? 'bg-gradient-to-t from-amber-600/40 to-amber-400/10 border-amber-500/40'
    : isSecond
      ? 'bg-gradient-to-t from-slate-500/30 to-slate-300/10 border-slate-400/30'
      : 'bg-gradient-to-t from-amber-800/30 to-amber-700/10 border-amber-700/30';

  return (
    <div className="flex flex-col items-center" style={{ width: 100 }}>
      {isFirst && (
        <Crown size={20} className="text-amber-400 mb-1 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
      )}
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg border-2 ${ringColor} ${glow} ${avatarBg}`}>
        {getInitials(entry.displayName)}
        {!isFirst && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[9px] font-black text-slate-300">
            {entry.rank}
          </div>
        )}
      </div>
      <div className={`text-xs font-bold mt-2 text-center leading-tight px-1 truncate max-w-[90px] ${isMe ? 'text-emerald-400' : 'text-white'}`}>
        {isMe ? 'Toi' : entry.displayName}
      </div>
      <div className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 mt-0.5">
        <Zap size={9} />{fmtXp(entry.currentSpend)} XP
      </div>
      <div
        className={`w-full mt-2 rounded-t-xl border-t border-x flex items-start justify-center pt-1 ${pedestalBg}`}
        style={{ height: PODIUM_HEIGHTS[entry.rank] }}
      >
        <span className="text-2xl font-black text-white/80">#{entry.rank}</span>
      </div>
    </div>
  );
};

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; isMe: boolean }> = ({ entry, isMe }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${isMe ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-800/40'}`}>
    <span className={`w-6 text-center text-xs font-black ${isMe ? 'text-emerald-400' : 'text-slate-500'}`}>{entry.rank}</span>
    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-200 flex-shrink-0">
      {getInitials(entry.displayName)}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-bold truncate ${isMe ? 'text-emerald-300' : 'text-slate-200'}`}>
        {isMe ? 'Toi' : entry.displayName}
      </div>
      <div className="text-[10px] text-slate-500">Niveau {entry.level}</div>
    </div>
    {entry.hasPremium && <Crown size={12} className="text-amber-500 flex-shrink-0" />}
    <span className="text-xs font-black text-emerald-400 tabular-nums flex-shrink-0">{fmtXp(entry.currentSpend)} XP</span>
  </div>
);

const LeaderboardSection: React.FC<{
  data: LeaderboardResponse | null;
  loading: boolean;
  currentUserId?: string;
}> = ({ data, loading, currentUserId }) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-700/40 mb-6 p-8 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0f1420 0%, #0a0e1a 100%)' }}>
        <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  const entries = data?.entries ?? [];
  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);
  const meInTop = entries.some((e) => String(e.userId) === currentUserId);
  const showMyRankPin = !!currentUserId && !!data?.myRank && !meInTop;

  return (
    <div className="rounded-3xl border border-slate-700/40 mb-6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1420 0%, #0a0e1a 100%)' }}>

      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">Classement</h2>
            <p className="text-[11px] text-slate-500">Les plus grands dépensiers de la saison</p>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-10 px-4 text-slate-500">
          <Medal size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sois le premier à apparaître ici — fais un achat pour lancer le classement !</p>
        </div>
      ) : (
        <div className="px-4 sm:px-6 py-5">
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 sm:gap-6 mb-6">
              {[top3.find((e) => e.rank === 2), top3.find((e) => e.rank === 1), top3.find((e) => e.rank === 3)]
                .filter((e): e is LeaderboardEntry => !!e)
                .map((e) => (
                  <PodiumCard key={e.userId} entry={e} isMe={String(e.userId) === currentUserId} />
                ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-1">
              {rest.map((e) => (
                <LeaderboardRow key={e.userId} entry={e} isMe={String(e.userId) === currentUserId} />
              ))}
            </div>
          )}

          {showMyRankPin && (
            <>
              <div className="flex items-center justify-center gap-2 my-2 text-slate-700">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px]">•••</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="w-6 text-center text-xs font-black text-emerald-400">{data?.myRank}</span>
                <div className="w-8 h-8 rounded-full bg-emerald-700/60 flex items-center justify-center text-[10px] font-black text-emerald-200 flex-shrink-0">
                  Toi
                </div>
                <div className="flex-1 text-sm font-bold text-emerald-300">Ta position</div>
                <span className="text-xs font-bold text-emerald-500 hidden sm:inline">Continue à dépenser pour grimper !</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const BattlePassPage: React.FC = () => {
  useDocumentTitle('Battle PAF — ADIIL');
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
      addNotification('success', 'Inscrit au Battle PAF !');
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    } finally {
      setJoining(false);
    }
  };

  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [qrReward, setQrReward] = useState<{ level: number; tier: 'FREE' | 'PREMIUM'; label: string | null } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'progression' | 'classement'>('progression');

  const trackRef = useRef<HTMLDivElement>(null);

  const levels = selectedPass?.levels ?? [];
  const currentSpend = userPass?.currentSpend ?? 0;
  const currentLevel = levels.reduce((max, l) => currentSpend >= l.requiredSpend ? l.level : max, 0);

  useEffect(() => {
    if (!selectedPass) { setLeaderboard(null); return; }
    setLoadingLeaderboard(true);
    getBattlePassLeaderboard(selectedPass.id, 10)
      .then(setLeaderboard)
      .catch(() => setLeaderboard(null))
      .finally(() => setLoadingLeaderboard(false));
  }, [selectedPass]);

  useEffect(() => {
    getPublicBattlePasses()
      .then((data) => {
        setPasses(data);
        if (data.length > 0) setSelectedPass(data[0]);
      })
      .catch(() => addNotification('error', 'Impossible de charger les Battle PAF'))
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

    window.addEventListener('focus', fetchUserPass);
    document.addEventListener('visibilitychange', fetchUserPass);

    return () => {
      window.removeEventListener('focus', fetchUserPass);
      document.removeEventListener('visibilitychange', fetchUserPass);
    };
  }, [selectedPass, user]);

  const [claimingBalance, setClaimingBalance] = useState(false);

  const handleClaimBalance = async (level: number, tier: 'FREE' | 'PREMIUM') => {
    if (!selectedPass || claimingBalance) return;
    setClaimingBalance(true);
    try {
      const result = await claimReward(selectedPass.id, level, tier);
      const updated = await getMyBattlePass(selectedPass.id);
      setUserPass(updated);
      addNotification('success', `+${result.balanceAdded.toFixed(2).replace('.', ',')}€ crédités sur ton solde !`);
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur lors de la réclamation');
    } finally {
      setClaimingBalance(false);
    }
  };

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

  const nextLevel = levels.find((l) => l.level === currentLevel + 1);
  const progressToNext = nextLevel
    ? Math.min(100, (currentSpend / nextLevel.requiredSpend) * 100)
    : levels.length > 0 ? 100 : 0;
  const isExpired = selectedPass ? new Date() > new Date(selectedPass.endDate) : false;
  const daysLeft = selectedPass ? getDaysLeft(selectedPass.endDate) : 0;

  const hasPremium = userPass?.hasPremium ?? false;

  // Configuration de la grille : première colonne élargie (TICKET_W) pour espacer tickets/paliers
  const gridTemplateColumns = `${TICKET_W}px repeat(${levels.length}, ${CELL_W}px) 48px`;
  const unlockedIndex = levels.reduce((max, l, idx) => currentSpend >= l.requiredSpend ? idx + 1 : max, 0);
  const totalCols = levels.length + 1;
  const trackProgressPercent = totalCols > 0 ? Math.min(100, (unlockedIndex / totalCols) * 100) : 0;

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
          <p className="text-slate-500">Aucun Battle PAF n'est disponible pour le moment. Revenez bientôt !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
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
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Battle PAF</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Achète en boutique, progresse et réclame tes récompenses</p>
            </div>
          </div>

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

        {/* ── Tabs ────────────────────────────────────────────────────────────── */}
        {selectedPass && (
          <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-slate-900/60 border border-slate-800/40 max-w-md">
            <button
              onClick={() => setActiveTab('progression')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'progression'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Zap size={15} />Progression
            </button>
            <button
              onClick={() => setActiveTab('classement')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'classement'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Trophy size={15} />Classement
            </button>
          </div>
        )}

        {selectedPass && (
          <>
            {activeTab === 'progression' && (
              <>
                {/* ── Pass hero card ─────────────────────────────────────────────── */}
                <div className="rounded-3xl border border-slate-700/40 mb-6 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #0f1420 0%, #0a0e1a 100%)' }}>

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

                  <div className="px-4 sm:px-6 py-4 sm:py-5">
                    {user ? (
                      loadingUserPass ? (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                          <span className="text-sm text-slate-500">Chargement de ta progression…</span>
                        </div>
                      ) : (
                        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-6">
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
                                  style={{ background: 'linear-gradient(135deg, #92400e, #b45309 50%, #d97706 100%)', boxShadow: '0 8px 24px rgba(180,83,9,0.3)' }}
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
                  <div
                    ref={trackRef}
                    className="overflow-x-auto pb-4"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.25) transparent' }}
                  >
                    <div className="inline-flex flex-col min-w-full">

                      {/* ROW 1 : Premium ticket + rewards */}
                      <div
                        className="grid gap-3 mb-3 px-3 py-2 rounded-2xl items-center"
                        style={{
                          gridTemplateColumns,
                          background: 'linear-gradient(180deg, rgba(120,53,15,0.15) 0%, rgba(120,53,15,0.03) 100%)',
                        }}
                      >
                        {/* Espace à droite pour séparer le ticket du palier 1 */}
                        <div className="w-full flex items-center pr-7">
                          <PassTicket
                            variant="premium"
                            active={hasPremium}
                            serial={selectedPass ? String(selectedPass.id).padStart(4, '0') : '0000'}
                            onClick={!hasPremium && userPass && !isExpired ? () => setShowUnlockConfirm(true) : undefined}
                          />
                        </div>

                        {levels.map((lvl) => (
                          <RewardCell
                            key={`prem-${lvl.id}`}
                            lvl={lvl}
                            tier="PREMIUM"
                            userPass={user ? userPass : null}
                            isUnlocked={currentSpend >= lvl.requiredSpend}
                            onShowQr={(level, tier, label) => setQrReward({ level, tier, label })}
                            onClaimBalance={handleClaimBalance}
                            isExpired={isExpired}
                          />
                        ))}
                        <div />
                      </div>

                      {/* ROW 2 : Level nodes + connector track */}
                      <div
                        className="relative grid gap-3 mb-4 mt-1 px-3 items-start"
                        style={{ gridTemplateColumns }}
                      >
                        {/* Ligne continue absolue de fond */}
                        <div
                          className="absolute h-0.5"
                          style={{
                            left: `${(TICKET_W - 28) / 2 + 12}px`, /* Centre sur l'étoile (qui est dans la zone sans le padding droit) */
                            right: '28px',                         /* Centre du trophée */
                            top: 16,
                            background: `linear-gradient(90deg, rgba(16, 185, 129, 0.6) ${trackProgressPercent}%, rgba(51, 65, 85, 0.4) ${trackProgressPercent}%)`,
                          }}
                        />

                        {/* Étoile de départ — alignée avec le ticket */}
                        <div className="w-full flex flex-col items-center pr-7">
                          <div className="h-8 flex items-center justify-center relative z-10">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
                              <Star size={14} className="text-slate-500" />
                            </div>
                          </div>
                        </div>

                        {/* Nœuds de niveaux */}
                        {levels.map((lvl) => (
                          <LevelNode
                            key={`node-${lvl.id}`}
                            lvl={lvl}
                            isUnlocked={currentSpend >= lvl.requiredSpend}
                            isCurrent={lvl.level === currentLevel}
                          />
                        ))}

                        {/* Trophée final */}
                        <div className="w-full flex flex-col items-center" style={{ width: 48 }}>
                          <div className="h-8 flex items-center justify-center relative z-10">
                            <div className="w-8 h-8 rounded-full border-2 border-amber-600/40 bg-amber-950/40 flex items-center justify-center">
                              <Trophy size={16} className="text-amber-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ROW 3 : Free ticket + rewards */}
                      <div
                        className="grid gap-3 px-3 py-2 rounded-2xl items-center"
                        style={{
                          gridTemplateColumns,
                          background: 'linear-gradient(0deg, rgba(6,78,59,0.15) 0%, rgba(6,78,59,0.03) 100%)',
                        }}
                      >
                        {/* Espace à droite pour séparer le ticket du palier 1 */}
                        <div className="w-full flex items-center pr-7">
                          <PassTicket
                            variant="free"
                            active={!!userPass}
                            serial={selectedPass ? `F${String(selectedPass.id).padStart(3, '0')}` : 'F000'}
                            onClick={!userPass && !isExpired ? handleJoin : undefined}
                          />
                        </div>

                        {levels.map((lvl) => (
                          <RewardCell
                            key={`free-${lvl.id}`}
                            lvl={lvl}
                            tier="FREE"
                            userPass={user ? userPass : null}
                            isUnlocked={currentSpend >= lvl.requiredSpend}
                            onShowQr={(level, tier, label) => setQrReward({ level, tier, label })}
                            onClaimBalance={handleClaimBalance}
                            isExpired={isExpired}
                          />
                        ))}
                        <div />
                      </div>

                    </div>
                  </div>
                )}

                {/* ── Info banner ─────────────────────────────────────────────────── */}
                <div className="mt-6 rounded-2xl border border-amber-700/30 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(120,53,15,0.12) 0%, rgba(15,20,32,0.6) 100%)' }}>

                  <div className="flex items-center gap-2 px-4 sm:px-5 pt-4">
                    <Info size={16} className="text-amber-500" />
                    <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">Conditions de validité</h3>
                  </div>

                  <div className="px-4 sm:px-5 pb-4 pt-3 space-y-2.5">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm font-bold text-red-300 leading-snug">
                        Tout achat ne passant pas par le site ne pourra pas faire avancer ta progression sur le Battle PAF.
                      </p>
                    </div>

                    <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                      <li className="flex gap-2">
                        <span className="text-amber-600">•</span>
                        <span><strong className="text-slate-300">Dépenses comptabilisées</strong> : commandes boutique payées pendant la saison (toute méthode, sauf gratuités). Les rechargements de solde et les inscriptions événements ne comptent pas.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-600">•</span>
                        <span>Chaque pass est <strong className="text-slate-300">indépendant</strong> — payer le Premium d'un pass ne donne pas accès aux suivants.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-600">•</span>
                        <span>Les récompenses doivent être réclamées <strong className="text-slate-300">avant l'expiration</strong> du pass.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-600">•</span>
                        <span>Les récompenses <strong className="text-slate-300">Produit</strong> (boissons, snacks…) sont à récupérer au BDE.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'classement' && (
              <LeaderboardSection
                data={leaderboard}
                loading={loadingLeaderboard}
                currentUserId={user?.id}
              />
            )}
          </>
        )}
      </div>

      {/* ── Unlock Premium Modal ─────────────────────────────────────────────── */}
      {showUnlockConfirm && selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl border border-amber-600/20 overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #0f1015 0%, #0a0c10 100%)' }}>

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
