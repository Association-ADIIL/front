import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getBannerSettings, updateBannerSettings, type BannerSettings } from '../api/banner';

interface BannerContextType {
    isOpen: boolean;
    message: string;
    loading: boolean;
    update: (data: BannerSettings) => Promise<void>;
}

const BannerContext = createContext<BannerContextType | null>(null);

export const BannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchBanner = useCallback(async () => {
        try {
            const data = await getBannerSettings();
            setIsOpen(data.isOpen);
            setMessage(data.message);
        } catch {
            // Bandeau masqué si l'API est indisponible
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanner();
    }, [fetchBanner]);

    const update = async (data: BannerSettings) => {
        const updated = await updateBannerSettings(data);
        setIsOpen(updated.isOpen);
        setMessage(updated.message);
    };

    return (
        <BannerContext.Provider value={{ isOpen, message, loading, update }}>
            {children}
        </BannerContext.Provider>
    );
};

export const useBanner = (): BannerContextType => {
    const ctx = useContext(BannerContext);
    if (!ctx) throw new Error('useBanner must be used within BannerProvider');
    return ctx;
};
