import { fetchJson } from './client';

export type RewardType = 'BALANCE' | 'PRODUCT' | 'CUSTOM';
export type BattlePassStatus = 'ACTIVE' | 'ENDED';

export interface BattlePassLevel {
  id: number;
  battlePassId: number;
  level: number;
  requiredSpend: number;
  freeRewardType: RewardType | null;
  freeRewardLabel: string | null;
  freeRewardValue: number | null;
  freeRewardDetails: string | null;
  premiumRewardType: RewardType | null;
  premiumRewardLabel: string | null;
  premiumRewardValue: number | null;
  premiumRewardDetails: string | null;
}

export interface BattlePass {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  premiumPrice: number;
  status: BattlePassStatus;
  levels: BattlePassLevel[];
  _count?: { userPasses: number };
}

export interface UserBattlePass {
  id: number;
  userId: number;
  battlePassId: number;
  hasPremium: boolean;
  premiumUnlockedAt: string | null;
  currentSpend: number;
  claimedFreeRewards: number[];
  claimedPremiumRewards: number[];
  battlePass: BattlePass;
}

export interface UserPassEntry {
  id: number;
  userId: number;
  hasPremium: boolean;
  currentSpend: number;
  claimedFreeRewards: number[];
  claimedPremiumRewards: number[];
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    studentGroup: string | null;
  };
  battlePass: BattlePass;
}

export interface BattlePassStats {
  totalUsers: number;
  premiumUsers: number;
  avgSpend: number;
  maxSpend: number;
  totalSpend: number;
}

// ─── Public ──────────────────────────────────────────────────────────────────

export const getPublicBattlePasses = () =>
  fetchJson<BattlePass[]>('/battle-pass');

export const getBattlePassById = (id: number) =>
  fetchJson<BattlePass>(`/battle-pass/${id}`);

// ─── Utilisateur authentifié ─────────────────────────────────────────────────

export const getMyBattlePass = (id: number) =>
  fetchJson<UserBattlePass>(`/battle-pass/${id}/me`);

export const claimReward = (id: number, level: number, tier: 'FREE' | 'PREMIUM') =>
  fetchJson<{ rewardType: RewardType; rewardLabel: string | null; balanceAdded: number; level: number; tier: string }>(
    `/battle-pass/${id}/claim`,
    { method: 'POST', body: JSON.stringify({ level, tier }) }
  );

export const joinBattlePass = (id: number) =>
  fetchJson<UserBattlePass>(`/battle-pass/${id}/join`, { method: 'POST', body: JSON.stringify({}) });

export const unlockPremium = (id: number) =>
  fetchJson<{ message: string; battlePassId: number; premiumPrice: number }>(
    `/battle-pass/${id}/unlock-premium`,
    { method: 'POST', body: JSON.stringify({}) }
  );

export interface ClaimPickupInfo {
  battlePass: { id: number; name: string; startDate: string; endDate: string; status: BattlePassStatus };
  level: number;
  tier: 'FREE' | 'PREMIUM';
  rewardType: RewardType | null;
  rewardLabel: string | null;
  rewardValue: number | null;
  user: { id: number; firstName: string; lastName: string; email: string };
  isClaimed: boolean;
  isExpired: boolean;
  currentSpend: number;
  isUnlocked: boolean;
  hasPremium: boolean;
}

export const getClaimPickupInfo = (battlePassId: number, userId: number, level: number, tier: 'FREE' | 'PREMIUM') =>
  fetchJson<ClaimPickupInfo>(`/battle-pass/claim-pickup/${battlePassId}/${userId}/${level}/${tier}`);

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminGetAllBattlePasses = () =>
  fetchJson<BattlePass[]>('/battle-pass/admin/all');

export const adminCreateBattlePass = (data: {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  premiumPrice: number;
  levels?: Partial<BattlePassLevel>[];
}) => fetchJson<BattlePass>('/battle-pass/admin/create', { method: 'POST', body: JSON.stringify(data) });

export const adminUpdateBattlePass = (id: number, data: Partial<{
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  premiumPrice: number;
  status: BattlePassStatus;
}>) => fetchJson<BattlePass>(`/battle-pass/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const adminDeleteBattlePass = (id: number) =>
  fetchJson(`/battle-pass/admin/${id}`, { method: 'DELETE' });

export const adminUpsertLevel = (
  battlePassId: number,
  data: {
    level: number;
    requiredSpend: number;
    freeRewardType?: RewardType | null;
    freeRewardLabel?: string | null;
    freeRewardValue?: number | null;
    freeRewardDetails?: string | null;
    premiumRewardType?: RewardType | null;
    premiumRewardLabel?: string | null;
    premiumRewardValue?: number | null;
    premiumRewardDetails?: string | null;
  }
) => fetchJson<BattlePassLevel>(`/battle-pass/admin/${battlePassId}/levels`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const adminDeleteLevel = (battlePassId: number, level: number) =>
  fetchJson(`/battle-pass/admin/${battlePassId}/levels/${level}`, { method: 'DELETE' });

export const adminGetUserPasses = (battlePassId: number) =>
  fetchJson<UserPassEntry[]>(`/battle-pass/admin/${battlePassId}/users`);

export const adminGetStats = (battlePassId: number) =>
  fetchJson<BattlePassStats>(`/battle-pass/admin/${battlePassId}/stats`);

export const adminUnlockPremiumForUser = (battlePassId: number, userId: number) =>
  fetchJson(`/battle-pass/admin/${battlePassId}/unlock/${userId}`, { method: 'POST', body: JSON.stringify({}) });

export const adminSyncAllSpend = (battlePassId: number) =>
  fetchJson(`/battle-pass/admin/${battlePassId}/sync`, { method: 'POST', body: JSON.stringify({}) });

export const adminClaimRewardForUser = (battlePassId: number, userId: number, level: number, tier: 'FREE' | 'PREMIUM') =>
  fetchJson<{ rewardType: RewardType; rewardLabel: string | null; balanceAdded: number; level: number; tier: string }>(
    `/battle-pass/admin/${battlePassId}/claim-for/${userId}`,
    { method: 'POST', body: JSON.stringify({ level, tier }) }
  );

export const adminRevokePremiumForUser = (battlePassId: number, userId: number) =>
  fetchJson(`/battle-pass/admin/${battlePassId}/unlock/${userId}`, { method: 'DELETE' });

export const adminRemoveUserFromBattlePass = (battlePassId: number, userId: number) =>
  fetchJson(`/battle-pass/admin/${battlePassId}/users/${userId}`, { method: 'DELETE' });
