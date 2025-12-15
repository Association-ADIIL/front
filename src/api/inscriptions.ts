import { fetchJson, API_BASE_URL } from './client';

export type PaymentMethod = 'HELLOASSO' | 'PAYPAL' | 'CASH_CB' | 'FREE' | 'BALANCE';

export interface InscriptionOption {
  eventOptionId: number;
  quantity: number;
}

export interface FormFieldResponse {
  fieldId: number;
  value: string;
}

export interface CreateInscriptionData {
  eventId: number;
  quantity: number;
  paymentMethod: PaymentMethod;
  options?: InscriptionOption[];
  formResponses?: FormFieldResponse[];
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
  payment?: {
    approvalUrl?: string;
    orderId?: string;
  };
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

export const getAllInscriptions = async (filters?: {
  paymentStatus?: string;
  paymentMethod?: string;
  eventId?: number;
}): Promise<Inscription[]> => {
  const params = new URLSearchParams();
  if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
  if (filters?.eventId) params.append('eventId', filters.eventId.toString());

  const queryString = params.toString();
  const url = queryString ? `/inscriptions/all?${queryString}` : '/inscriptions/all';

  return fetchJson(url);
};

export const updateInscriptionPaymentStatus = async (id: number, paymentStatus: string): Promise<Inscription> => {
  return fetchJson(`/inscriptions/${id}/payment-status`, {
    method: 'PUT',
    body: JSON.stringify({ paymentStatus }),
  });
};

export const confirmPayPalPayment = async (inscriptionId: number, orderId: string): Promise<any> => {
  return fetchJson(`/inscriptions/${inscriptionId}/payment/paypal/confirm`, {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
};

export const confirmHelloAssoPayment = async (inscriptionId: number, checkoutIntentId: string): Promise<any> => {
  return fetchJson(`/inscriptions/${inscriptionId}/payment/helloasso/confirm`, {
    method: 'POST',
    body: JSON.stringify({ checkoutIntentId }),
  });
};

export const refundInscription = async (id: number): Promise<Inscription> => {
  return fetchJson(`/inscriptions/${id}/refund`, {
    method: 'POST',
  });
};

export const exportEventInscriptionsCsv = async (eventId: number): Promise<Blob> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/inscriptions/event/${eventId}/export/csv`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to export inscriptions' }));
    throw new Error(errorBody.message || 'Failed to export inscriptions');
  }

  return response.blob();
};
