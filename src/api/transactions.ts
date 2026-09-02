import { fetchJson } from './client';

export type TransactionType = 'ORDER' | 'BALANCE_RECHARGE' | 'INSCRIPTION';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'HELLOASSO' | 'CASH' | 'CB' | 'FREE' | 'BALANCE';

export interface Transaction {
  id: string;
  type: TransactionType;
  entityId: number;
  userId: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  bonusAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export interface RefreshStatusResult {
  message: string;
  status: PaymentStatus;
  providerStatus: string | null;
  updated: boolean;
  result?: any;
}

/**
 * Get all transactions (admin only)
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  return fetchJson('/admin/transactions');
};

/**
 * Refresh transaction status from payment provider (admin only)
 */
export const refreshTransactionStatus = async (
  type: TransactionType,
  entityId: number
): Promise<RefreshStatusResult> => {
  return fetchJson(`/admin/transactions/${type}/${entityId}/refresh`, {
    method: 'POST',
  });
};

/**
 * Update a balance recharge's payment status (admin only)
 */
export const updateRechargeStatus = async (
  rechargeId: number,
  status: PaymentStatus
): Promise<{ message: string }> => {
  return fetchJson(`/balance/admin/recharges/${rechargeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
};

/**
 * Delete a balance recharge (admin only).
 * By default the linked amount is deducted from the user's balance if the recharge was PAID.
 * Pass { keepBalance: true } to delete the recharge record without touching the user's balance.
 */
export const deleteRecharge = async (
  rechargeId: number,
  options?: { keepBalance?: boolean }
): Promise<{ message: string }> => {
  const query = options?.keepBalance ? '?keepBalance=true' : '';
  return fetchJson(`/balance/admin/recharges/${rechargeId}${query}`, {
    method: 'DELETE',
  });
};