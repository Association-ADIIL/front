import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getBannerSettings, updateBannerSettings, type BannerSettings } from '../api/banner';

interface BannerContextType {
    isOpen: boolean;
    message: string;
    closeAt: string | null;
    loading: boolean;
    update: (data: BannerSettings) => Promise<void>;
}

const BannerContext = createContext<BannerContextType | null>(null);

// setTimeout plafonne à ~24,8 jours (2^31 ms) : au-delà il se déclenche immédiatement
const MAX_TIMEOUT_MS = 2_147_483_647;

export const BannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [closeAt, setCloseAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const applyBanner = (data: BannerSettings) => {
        setIsOpen(data.isOpen);
        setMessage(data.message);
        setCloseAt(data.closeAt ?? null);
    };

    const fetchBanner = useCallback(async () => {
        try {
            applyBanner(await getBannerSettings());
        } catch {
            // Bandeau masqué si l'API est indisponible
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanner();
    }, [fetchBanner]);

    // Refetch à l'heure de fermeture : le backend coupe à la lecture,
    // donc ce fetch renvoie isOpen = false et le bandeau disparaît sans refresh
    useEffect(() => {
        if (!isOpen || !closeAt) return;
        const delay = new Date(closeAt).getTime() - Date.now();
        // +1s de marge pour être sûr que l'heure est passée côté serveur
        const timer = setTimeout(fetchBanner, Math.min(Math.max(delay, 0) + 1000, MAX_TIMEOUT_MS));
        return () => clearTimeout(timer);
    }, [isOpen, closeAt, fetchBanner]);

    const update = async (data: BannerSettings) => {
        applyBanner(await updateBannerSettings(data));
    };

    return (
        <BannerContext.Provider value={{ isOpen, message, closeAt, loading, update }}>
            {children}
        </BannerContext.Provider>
    );
};

export const useBanner = (): BannerContextType => {
    const ctx = useContext(BannerContext);
    if (!ctx) throw new Error('useBanner must be used within BannerProvider');
    return ctx;
};