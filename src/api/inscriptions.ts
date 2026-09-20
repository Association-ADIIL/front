import { fetchJson, API_BASE_URL } from './client';

export type PaymentMethod = 'HELLOASSO' | 'CASH' | 'CB' | 'FREE' | 'BALANCE';

export interface InscriptionFieldInput {
  fieldId: number;
  value?: string;
  quantity?: number; // utile seulement pour les champs payants
}

export interface CreateInscriptionData {
  eventId: number;
  quantity: number;
  paymentMethod: PaymentMethod;
  fields?: InscriptionFieldInput[];
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
  paymentUrl?: string;
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
  fieldValues?: Array<{
    id: number;
    inscriptionId: number;
    fieldId: number;
    value?: string;
    quantity: number;
    field?: {
      id: number;
      label: string;
      type: string;
      isPaid?: boolean;
      price?: number;
    };
  }>;
  event?: {
    id: number;
    title: string;
    date: string;
    location: string;
    price: number;
    fields?: Array<{
      id: number;
      label: string;
      type: string;
      required: boolean;
      choices?: string[];
      isPaid?: boolean;
      price?: number;
    }>;
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

export const adminUnregisterInscription = async (id: number, withRefund: boolean): Promise<{ message: string; refunded: boolean }> => {
  return fetchJson(`/inscriptions/${id}/admin`, {
    method: 'DELETE',
    body: JSON.stringify({ withRefund }),
  });
};

export const exportEventInscriptionsToExcel = async (eventId: number): Promise<Blob> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/inscriptions/event/${eventId}/export/excel`, {
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