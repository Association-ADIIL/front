import { fetchJson } from './client';
import { type User } from './auth';

export const getAllUsers = async (): Promise<User[]> => {
    return fetchJson('/users');
};

export const getUserById = async (id: string): Promise<User> => {
    return fetchJson(`/users/${id}`);
};

export const createUser = async (data: Partial<User> & { password?: string }): Promise<User> => {
    return fetchJson('/users', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
    return fetchJson(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteUser = async (id: string): Promise<void> => {
    return fetchJson(`/users/${id}`, {
        method: 'DELETE',
    });
};