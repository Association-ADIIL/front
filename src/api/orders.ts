import { fetchJson } from './client';
import { type Product } from './products';

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number; // Snapshot price
    product?: Product;
}

export interface Order {
    id: string;
    userId: string;
    totalAmount: number;
    status: 'PENDING' | 'PAID' | 'DELIVERED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
    createdAt: string;
    updatedAt: string;
    items?: OrderItem[];
    // Add user info if returned by admin endpoints
    user?: {
        firstName: string;
        lastName: string;
        email: string;
    }
}

// User endpoints
export const getMyOrders = async (): Promise<Order[]> => {
    return fetchJson('/orders/my');
};

export const createOrder = async (items: { productId: string; quantity: number }[]): Promise<Order> => {
    return fetchJson('/orders', {
        method: 'POST',
        body: JSON.stringify({ items }),
    });
};

export const getOrderById = async (id: string): Promise<Order> => {
    return fetchJson(`/orders/${id}`);
};

// Admin endpoints
export const getAllOrders = async (): Promise<Order[]> => {
    return fetchJson('/orders');
};

export const updateOrderStatus = async (id: string, status: string): Promise<Order> => {
    return fetchJson(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
};

export const updatePaymentStatus = async (id: string, paymentStatus: string): Promise<Order> => {
    return fetchJson(`/orders/${id}/payment-status`, {
        method: 'PUT',
        body: JSON.stringify({ paymentStatus }),
    });
};