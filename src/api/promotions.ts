import { fetchJson } from './client';

export type PromotionType =
  | 'BALANCE_RECHARGE_BONUS'
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'FREE_SHIPPING'
  | 'BUY_X_GET_Y'
  | 'PRODUCT_DISCOUNT'
  | 'BUNDLE_DISCOUNT';

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

export const getPromotionWithProducts = async (id: number) => {
  // Remplace "api" ou l'URL de base selon ta configuration existante (ex: axiosInstance.get)
  const response = await fetch(`/api/promotions/${id}/products`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération de la promotion et de ses produits');
  }

  return response.json();
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

export const checkCartDiscount = async (cartTotal: number, items: any[] = []): Promise<CartDiscountCheck> => {
  return fetchJson('/promotions/check-cart-discount', {
    method: 'POST',
    body: JSON.stringify({ cartTotal, items }),
  });
};

// Product promotions
export interface ProductPromotion {
  promotionId: number;
  name: string;
  displayTitle: string;
  discountPercent: number;
}

export type ProductPromotionsMap = Record<number, ProductPromotion>;

// Get active product promotions (public endpoint)
export const getActiveProductPromotions = async (): Promise<ProductPromotionsMap> => {
  return fetchJson('/promotions/products/active');
};

// Admin endpoints for product promotions
export interface ProductPromotionWithProducts extends Promotion {
  productPromotions: Array<{
    id: number;
    productId: number;
    product: {
      id: number;
      name: string;
      price: number;
      image?: string;
    };
  }>;
}

export const createProductPromotion = async (data: {
  name: string;
  description?: string;
  displayTitle: string;
  displayMessage: string;
  discountPercent: number;
  productIds: number[];
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  maxUsage?: number;
}): Promise<ProductPromotionWithProducts> => {
  return fetchJson('/promotions/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProductPromotion = async (
  id: number,
  data: Partial<{
    name: string;
    description: string;
    displayTitle: string;
    displayMessage: string;
    discountPercent: number;
    productIds: number[];
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    maxUsage: number | null;
  }>
): Promise<ProductPromotionWithProducts> => {
  return fetchJson(`/promotions/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const getProductPromotionById = async (id: number): Promise<ProductPromotionWithProducts> => {
  return fetchJson(`/promotions/products/${id}`);
};

// Récupère les promotions actives pour une page spécifique (ex: 'shop')
export const getActivePromotionsForPage = async (page: string): Promise<Promotion[]> => {
  // CORRECTION ICI : On utilise /active/ au lieu de /page/
  return fetchJson(`/promotions/active/${page}`);
};

