import { fetchJson } from './client';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  totalPrice: number;
  originalPrice?: number | null; // Price before any discount
  productDiscountAmount?: number; // Amount discounted from product promotions
  cartDiscountAmount?: number; // Amount discounted from cart/global promotions
  discountAmount: number; // Total amount discounted
  promotionId?: number | null;
  promotion?: {
    id: number;
    name: string;
    type: string;
  } | null;
  hasDiscount?: boolean;
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
    originalPrice?: number | null; // Price before product discount
    price: number; // Final price after product discount
    refundedQuantity: number;
    variantId?: number;
    product: {
      id: number;
      name: string;
      description: string;
      price: number;
      imageUrl?: string;
      variants?: Array<{
        id: number;
        name: string;
        priceModifier: number;
      }>;
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
  paymentMethod: 'HELLOASSO' | 'PAYPAL' | 'CASH_CB' | 'FREE';
  returnUrl?: string;
  cancelUrl?: string;
  promotionId?: number; // Optional: specify which promotion to apply
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

export interface OrderPickupInfo {
  id: number;
  customerName: string;
  paymentMethod: 'HELLOASSO' | 'PAYPAL' | 'CASH_CB' | 'FREE' | 'BALANCE';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  orderStatus: 'PENDING' | 'PAID' | 'COLLECTED' | 'CANCELLED';
  totalPrice: number;
  originalPrice?: number | null;
  productDiscountAmount: number; // Amount discounted from product promotions
  cartDiscountAmount: number; // Amount discounted from cart/global promotions
  discountAmount: number; // Total discount (product + cart)
  refundedAmount: number;
  promotion?: {
    id: number;
    name: string;
    type: string;
  } | null;
  items: Array<{
    id: number;
    productName: string;
    variantName: string | null;
    quantity: number;
    refundedQuantity: number;
    originalPrice?: number | null; // Price before product discount (null if no product discount)
    price: number; // Final price after product discount
  }>;
  createdAt: string;
}

export const getOrderPickupInfo = async (id: number): Promise<OrderPickupInfo> => {
  return fetchJson(`/orders/${id}/pickup-info`);
};

export const confirmOrderPickup = async (id: number): Promise<{ order: Order; message: string }> => {
  return fetchJson(`/orders/${id}/confirm-pickup`, {
    method: 'POST',
  });
};