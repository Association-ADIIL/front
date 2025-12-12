import { fetchJson } from './client';

export type PaymentMethod = 'HELLOASSO' | 'PAYPAL' | 'CASH_CB' | 'FREE';

export interface InscriptionOption {
  eventOptionId: number;
  quantity: number;
}

export interface CreateInscriptionData {
  eventId: number;
  quantity: number;
  paymentMethod: PaymentMethod;
  options?: InscriptionOption[];
  returnUrl?: string;
  cancelUrl?: string;
}

export interface InscriptionResponse {
  inscription: {
    id: number;
    eventId: number;
    userId: number;
    quantity: number;
    totalPrice: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
    createdAt: string;
  };
  message: string;
  amount?: number;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  paymentUrl?: string; // Some backends might return this directly
}

export interface Inscription {
  id: number;
  eventId: number;
  userId: number;
  quantity: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: string;
  event?: {
    id: number;
    title: string;
    date: string;
    location: string;
    price: number;
  };
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const createInscription = async (data: CreateInscriptionData): Promise<InscriptionResponse> => {
  return fetchJson('/inscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getMyInscriptions = async (): Promise<Inscription[]> => {
  return fetchJson('/inscriptions/my-inscriptions');
};

export const getAllInscriptions = async (): Promise<Inscription[]> => {
  return fetchJson('/inscriptions/all');
};

export const updateInscriptionPaymentStatus = async (id: number, paymentStatus: string): Promise<Inscription> => {
  return fetchJson(`/inscriptions/${id}/payment-status`, {
    method: 'PUT',
    body: JSON.stringify({ paymentStatus }),
  });
};
