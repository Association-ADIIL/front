import React, { useState } from 'react';
import { Megaphone, Save, Eye, EyeOff, Clock } from 'lucide-react';
import { useBanner } from '../context/BannerContext';
import { useNotification } from '../context/NotificationContext';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const PRESETS = [
    { label: '+30 min', minutes: 30 },
    { label: '+1 h', minutes: 60 },
    { label: '+2 h', minutes: 120 },
    { label: '+4 h', minutes: 240 },
];

const AdminBannerPage: React.FC = () => {
    const { isOpen, message, closeAt, loading, update } = useBanner();
    const { addNotification } = useNotification();

    const [localOpen, setLocalOpen] = useState<boolean | null>(null);
    const [localMessage, setLocalMessage] = useState<string | null>(null);
    const [localDate, setLocalDate] = useState<string | null>(null);
    const [localTime, setLocalTime] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const todayStr = toDateInput(new Date());
    const savedCloseAt = closeAt ? new Date(closeAt) : null;

    // Valeurs affichées : état local (non sauvegardé) sinon contexte
    const displayOpen = localOpen !== null ? localOpen : isOpen;
    const displayMessage = localMessage !== null ? localMessage : message;
    const displayDate = localDate ?? (savedCloseAt ? toDateInput(savedCloseAt) : todayStr);
    const displayTime = localTime ?? (savedCloseAt ? toTimeInput(savedCloseAt) : '');

    // Programmé uniquement si une heure est renseignée
    const scheduledDate = displayTime ? new Date(`${displayDate || todayStr}T${displayTime}`) : null;

    const isDirty =
        localOpen !== null ||
        localMessage !== null ||
        localTime !== null ||
        (localDate !== null && displayTime !== '');

    const applyPreset = (minutes: number) => {
        const d = new Date(Date.now() + minutes * 60000);
        setLocalDate(toDateInput(d));
        setLocalTime(toTimeInput(d));
    };

    const clearSchedule = () => {
        setLocalTime('');
        setLocalDate(todayStr);
    };

    const handleSave = async () => {
        let closeAtIso: string | null = null;
        if (displayOpen && scheduledDate) {
            if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
                addNotification('error', "L'heure de fermeture doit être dans le futur.");
                return;
            }
            closeAtIso = scheduledDate.toISOString();
        }

        setSaving(true);
        try {
            await update({ isOpen: displayOpen, message: displayMessage, closeAt: closeAtIso });
            setLocalOpen(null);
            setLocalMessage(null);
            setLocalDate(null);
            setLocalTime(null);
            addNotification('success', 'Bandeau mis à jour avec succès.');
        } catch {
            addNotification('error', 'Impossible de sauvegarder le bandeau.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Megaphone size={20} className="text-yellow-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-koulen text-white">Bandeau d'information</h1>
                    <p className="text-sm text-gray-400">Gérez le bandeau affiché sous le logo du site</p>
                </div>
            </div>

            {/* Aperçu */}
            <div className="bg-dark-bg/50 rounded-xl border border-gray-800 p-5 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aperçu</p>
                {displayOpen && displayMessage.trim() ? (
                    <div className="bg-accent-mint text-darker-bg rounded-lg py-3 px-4 text-sm font-semibold text-center">
                        {displayMessage}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-gray-700 py-3 px-4 text-sm text-gray-500 text-center">
                        {!displayOpen ? 'Bandeau masqué' : 'Aucun message saisi'}
                    </div>
                )}
                {displayOpen && scheduledDate && (
                    <p className="text-xs text-yellow-400 text-center">
                        Se masquera le {scheduledDate.toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                )}
            </div>

            {/* Contrôles */}
            <div className="bg-dark-bg/50 rounded-xl border border-gray-800 p-5 space-y-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuration</p>

                {/* Toggle état */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium text-white">État du bandeau</p>
                        <p className="text-xs text-gray-400">Afficher ou masquer le bandeau pour tous les visiteurs</p>
                    </div>
                    <button
                        onClick={() => setLocalOpen(!displayOpen)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-dark-bg ${
                            displayOpen ? 'bg-yellow-400' : 'bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={displayOpen}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                displayOpen ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* Indicateur d'état */}
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    displayOpen
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}>
                    {displayOpen ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span className="font-medium">{displayOpen ? 'Bandeau visible' : 'Bandeau masqué'}</span>
                </div>

                {/* Champ message */}
                <div className="space-y-2">
                    <label htmlFor="banner-message" className="text-sm font-medium text-white">
                        Message affiché
                    </label>
                    <textarea
                        id="banner-message"
                        value={displayMessage}
                        onChange={(e) => setLocalMessage(e.target.value)}
                        rows={3}
                        maxLength={300}
                        placeholder="Ex : La boutique est fermée jusqu'au 15 juin. Les commandes reprennent ensuite normalement."
                        className="w-full bg-darker-bg border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 resize-none"
                    />
                    <p className="text-xs text-gray-500 text-right">{displayMessage.length}/300 caractères</p>
                </div>

                {/* Fermeture automatique : toujours visible, grisée si le bandeau est éteint */}
                <div className={`space-y-3 transition-opacity ${displayOpen ? '' : 'opacity-40 pointer-events-none select-none'}`}>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-yellow-400" />
                        <p className="text-sm font-medium text-white">Fermeture automatique (optionnel)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label htmlFor="banner-close-date" className="text-xs text-gray-400">Date</label>
                            <input
                                id="banner-close-date"
                                type="date"
                                value={displayDate}
                                min={todayStr}
                                max="9999-12-31"
                                disabled={!displayOpen}
                                onChange={(e) => setLocalDate(e.target.value)}
                                className="w-full bg-darker-bg border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="banner-close-time" className="text-xs text-gray-400">Heure</label>
                            <input
                                id="banner-close-time"
                                type="time"
                                value={displayTime}
                                step={60}
                                disabled={!displayOpen}
                                onChange={(e) => setLocalTime(e.target.value)}
                                className="w-full bg-darker-bg border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                type="button"
                                disabled={!displayOpen}
                                onClick={() => applyPreset(p.minutes)}
                                className="px-3 py-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                        {displayTime && (
                            <button
                                type="button"
                                disabled={!displayOpen}
                                onClick={clearSchedule}
                                className="px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-700 rounded-lg"
                            >
                                Effacer
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-gray-500">
                        {displayOpen
                            ? "Heure vide = le bandeau reste affiché jusqu'à ce que tu le désactives."
                            : "Disponible quand le bandeau est visible."}
                    </p>
                </div>
            </div>

            {/* Bouton sauvegarder */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isDirty && !saving
                            ? 'bg-yellow-400 text-darker-bg hover:bg-yellow-300'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
            </div>
        </div>
    );
};

export default AdminBannerPage;