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
