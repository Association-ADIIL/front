import { fetchJson } from './client';

export interface BannerSettings {
    isOpen: boolean;
    message: string;
    closeAt?: string | null; // ISO 8601, fermeture automatique
}

/** GET /settings/banner — public, no auth required */
export const getBannerSettings = (): Promise<BannerSettings> =>
    fetchJson<BannerSettings>('/settings/banner');

/** PUT /settings/banner — admin only */
export const updateBannerSettings = (data: BannerSettings): Promise<BannerSettings> =>
    fetchJson<BannerSettings>('/settings/banner', {
        method: 'PUT',
        body: JSON.stringify(data),
    });