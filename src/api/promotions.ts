import { fetchJson } from './client';

export type PromotionType =
  | 'BALANCE_RECHARGE_BONUS'
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'FREE_SHIPPING'
  | 'BUY_X_GET_Y';

export interface BalanceRechargeTier {
  minAmount: number;
  maxAmount: number | null;
  bonusPercent: number;
}

export interface BalanceRechargeRules {
  tiers: BalanceRechargeTier[];
  firstRechargeOnly: boolean;
}

// Discount tiers for PERCENTAGE_DISCOUNT and FIXED_DISCOUNT (boutique only)
export interface DiscountTier {
  minOrderAmount: number;
  maxOrderAmount: number | null;
  discountValue: number; // Percentage (0-100) for PERCENTAGE_DISCOUNT, or fixed amount (€) for FIXED_DISCOUNT
}

export interface DiscountRules {
  tiers: DiscountTier[];
  firstOrderOnly: boolean;
}

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: PromotionType;
  displayTitle: string;
  displayMessage: string;
  rules: any;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    usages: number;
  };
}

export interface BalanceBonusCheck {
  eligible: boolean;
  promotionId?: number;
  promotionName?: string;
  bonusAmount: number;
  bonusPercent?: number;
  finalAmount: number;
  message?: string;
  tiers?: BalanceRechargeTier[];
}

export interface PromotionStats {
  totalUsages: number;
  totalBonusGiven: number;
  totalOriginalAmount: number;
  recentUsages: Array<{
    id: number;
    userId: number;
    originalAmount: number;
    bonusAmount: number;
    finalAmount: number;
    createdAt: string;
  }>;
}

// Admin endpoints
export const getAllPromotions = async (): Promise<Promotion[]> => {
  return fetchJson('/promotions');
};

export const getPromotionById = async (id: number): Promise<Promotion> => {
  return fetchJson(`/promotions/${id}`);
};

export const createPromotion = async (data: {
  name: string;
  description?: string;
  type: PromotionType;
  displayTitle: string;
  displayMessage: string;
  rules: any;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  maxUsage?: number;
}): Promise<Promotion> => {
  return fetchJson('/promotions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updatePromotion = async (
  id: number,
  data: Partial<{
    name: string;
    description: string;
    type: PromotionType;
    displayTitle: string;
    displayMessage: string;
    rules: any;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    maxUsage: number | null;
  }>
): Promise<Promotion> => {
  return fetchJson(`/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deletePromotion = async (id: number): Promise<void> => {
  return fetchJson(`/promotions/${id}`, {
    method: 'DELETE',
  });
};

export const getPromotionStats = async (id: number): Promise<PromotionStats> => {
  return fetchJson(`/promotions/${id}/stats`);
};

// Authenticated endpoint
export const checkBalanceRechargeBonus = async (amount: number): Promise<BalanceBonusCheck> => {
  return fetchJson('/promotions/check-balance-bonus', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
};

// Cart discount check (boutique only)
export interface CartDiscountCheck {
  eligible: boolean;
  promotionId?: number;
  promotionName?: string;
  discountAmount: number;
  discountPercent?: number;
  finalAmount: number;
  message?: string;
  tiers?: DiscountTier[];
  type?: PromotionType;
}

export const checkCartDiscount = async (cartTotal: number): Promise<CartDiscountCheck> => {
  return fetchJson('/promotions/check-cart-discount', {
    method: 'POST',
    body: JSON.stringify({ cartTotal }),
  });
};
