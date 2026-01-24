import { fetchJson } from './client';

export interface BalanceRecharge {
  id: number;
  userId: number;
  amount: number;
  bonusAmount: number;
  promotionId: number | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getMyBalance = async (): Promise<{ balance: number }> => {
  return fetchJson('/balance/my-balance');
};

export const createBalanceRecharge = async (data: {
  amount: number;
  paymentMethod: string;
  returnUrl?: string;
  cancelUrl?: string;
  promotionId?: number;
  bonusAmount?: number;
}): Promise<any> => {
  return fetchJson('/balance/recharge', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const confirmPayPalBalanceRecharge = async (
  rechargeId: number,
  orderId: string
): Promise<any> => {
  return fetchJson(`/balance/recharge/${rechargeId}/confirm-paypal`, {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
};

export const confirmHelloAssoBalanceRecharge = async (
  rechargeId: number,
  data: { paymentId?: string; checkoutIntentId?: string }
): Promise<any> => {
  return fetchJson(`/balance/recharge/${rechargeId}/confirm-helloasso`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getMyRecharges = async (): Promise<BalanceRecharge[]> => {
  return fetchJson('/balance/recharges');
};

export const purchaseWithBalance = async (data: {
  items: Array<{ productId: number; quantity: number; variantId?: number; selectedOptions?: Array<{ categoryId: number; categoryName: string; optionId: number; optionName: string; priceModifier: number }> }>;
  promotionId?: number;
}): Promise<any> => {
  return fetchJson('/balance/purchase', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export interface BalanceStats {
  totalBalance: number;
  totalRecharged: number;
  rechargedThisMonth: number;
  totalRecharges: number;
  rechargesThisMonth: number;
}

export const getBalanceStats = async (): Promise<BalanceStats> => {
  return fetchJson('/balance/stats');
};

export const addBalanceManually = async (data: {
  userId: number;
  amount: number;
}): Promise<{ message: string; balance: number }> => {
  return fetchJson('/balance/add-manually', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Admin: Get a specific user's balance
export const getUserBalance = async (userId: string): Promise<{ balance: number }> => {
  return fetchJson(`/balance/user/${userId}`);
};
