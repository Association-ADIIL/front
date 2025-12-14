import { fetchJson } from './client';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  totalPrice: number;
  paymentMethod: 'HELLOASSO' | 'PAYPAL' | 'CASH_CB' | 'FREE';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  orderStatus: 'PENDING' | 'PAID' | 'COLLECTED' | 'CANCELLED';
  paymentTransactionId?: string;
  refundTransactionId?: string;
  refundedBy?: number;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;
    refundedQuantity: number;
    product: {
      id: number;
      name: string;
      description: string;
      price: number;
      imageUrl?: string;
    };
  }>;
  user?: {
      firstName: string;
      lastName: string;
      email: string;
  };
  refundedAmount: number;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  paymentMethod: 'HELLOASSO' | 'PAYPAL' | 'CASH_CB';
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreateOrderResponse {
  order: Order;
  payment?: {
    method: 'PAYPAL' | 'HELLOASSO';
    orderId?: string; // For PayPal
    approvalUrl?: string; // For PayPal
    checkoutId?: string; // For HelloAsso
    redirectUrl?: string; // For HelloAsso
  };
  paymentUrl?: string; // For HelloAsso
  message: string;
}

export const createOrder = async (data: CreateOrderPayload): Promise<CreateOrderResponse> => {
  return fetchJson('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const confirmPayPalOrderPayment = async (orderId: number, paypalOrderId: string): Promise<Order> => {
  return fetchJson(`/orders/${orderId}/payment/paypal/confirm`, {
    method: 'POST',
    body: JSON.stringify({ orderId: paypalOrderId }),
  });
};

export const confirmHelloAssoOrderPayment = async (orderId: number, checkoutIntentId?: string, paymentId?: string): Promise<Order> => {
  return fetchJson(`/orders/${orderId}/payment/helloasso/confirm`, {
    method: 'POST',
    body: JSON.stringify({ checkoutIntentId, paymentId }),
  });
};

export const getOrderById = async (id: number): Promise<Order> => {
  return fetchJson(`/orders/${id}`);
};

export const getMyOrders = async (): Promise<Order[]> => {
  return fetchJson('/orders/my');
};

export const getAllOrders = async (): Promise<Order[]> => {
  return fetchJson('/orders');
};

export const updateOrderStatus = async (id: number, orderStatus: string): Promise<Order> => {
  return fetchJson(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ orderStatus }),
  });
};

export const updatePaymentStatus = async (id: number, paymentStatus: string): Promise<Order> => {
  return fetchJson(`/orders/${id}/payment-status`, {
    method: 'PUT',
    body: JSON.stringify({ paymentStatus }),
  });
};

export const refundOrderItems = async (id: number, items: { orderItemId: number; quantity: number }[]): Promise<any> => {
  return fetchJson(`/orders/${id}/refund-items`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
};