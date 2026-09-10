import React, { useEffect, useState, useRef } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNotification } from '../context/NotificationContext';
import {
  adminGetAllBattlePasses,
  adminCreateBattlePass,
  adminUpdateBattlePass,
  adminDeleteBattlePass,
  adminUpsertLevel,
  adminDeleteLevel,
  adminGetUserPasses,
  adminGetStats,
  adminUnlockPremiumForUser,
  adminSyncAllSpend,
  adminRevokePremiumForUser,
  adminRemoveUserFromBattlePass,
  type BattlePass,
  type BattlePassLevel,
  type UserPassEntry,
  type BattlePassStats,
  type RewardType,
} from '../api/battlePass';
import {
  Plus, Pencil, Trash2, Trophy, Crown, Users, Euro, RefreshCw, Save, Star, Gift, BarChart3
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUpload from '../components/ImageUpload';
import { deleteImage } from '../api/upload';

const fmt = (n: number) => n.toFixed(2).replace('.', ',');
const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const toInput = (d: string) => new Date(d).toISOString().slice(0, 16);

const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: 'BALANCE', label: 'Solde Adiil (crédité auto)' },
  { value: 'PRODUCT', label: 'Produit physique' },
  { value: 'CUSTOM', label: 'Récompense personnalisée' },
];

// ─── Pass Form ────────────────────────────────────────────────────────────────

interface PassFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  premiumPrice: string;
  status: 'ACTIVE' | 'ENDED';
}

const emptyPassForm = (): PassFormData => ({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  premiumPrice: '5',
  status: 'ACTIVE',
});

// ─── Level Form ───────────────────────────────────────────────────────────────

interface LevelFormData {
  level: string;
  requiredSpend: string;
  freeRewardType: RewardType | '';
  freeRewardLabel: string;
  freeRewardValue: string;
  freeRewardDetails: string;
  freeRewardImageUrl: string;
  premiumRewardType: RewardType | '';
  premiumRewardLabel: string;
  premiumRewardValue: string;
  premiumRewardDetails: string;
  premiumRewardImageUrl: string;
}

const emptyLevelForm = (nextLevel: number): LevelFormData => ({
  level: String(nextLevel),
  requiredSpend: '',
  freeRewardType: '',
  freeRewardLabel: '',
  freeRewardValue: '',
  freeRewardDetails: '',
  freeRewardImageUrl: '',
  premiumRewardType: '',
  premiumRewardLabel: '',
  premiumRewardValue: '',
  premiumRewardDetails: '',
  premiumRewardImageUrl: '',
});

// ─── Level Form Component ─────────────────────────────────────────────────────

const LevelFormRow: React.FC<{
  form: LevelFormData;
  onChange: (f: LevelFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  onImageCleanup: (url: string) => void;
}> = ({ form, onChange, onSave, onCancel, saving, onImageCleanup }) => {
  const field = (key: keyof LevelFormData, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-[10px] text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={e => onChange({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40"
      />
    </div>
  );

  const select = (key: keyof LevelFormData, label: string) => (
    <div>
      <label className="block text-[10px] text-slate-500 mb-1">{label}</label>
      <select
        value={form[key] as string}
        onChange={e => onChange({ ...form, [key]: e.target.value as RewardType | '' })}
        className="w-full bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/40"
      >
        <option value="">— Aucune —</option>
        {REWARD_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-slate-800/40 border border-amber-500/20 rounded-xl p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field('level', 'Numéro du niveau', 'number', '1')}
        {field('requiredSpend', 'Dépenses requises (€)', 'number', '20')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Free tier */}
        <div className="space-y-2 p-3 rounded-lg bg-slate-900/40 border border-slate-700/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Tier Gratuit</div>
                  {select('freeRewardType', 'Type de récompense')}
                  {field('freeRewardLabel', 'Libellé affiché', 'text', 'Café offert')}
                  {form.freeRewardType === 'BALANCE' && field('freeRewardValue', 'Montant (€)', 'number', '2')}
                  {field('freeRewardDetails', 'Description complémentaire')}
                  <ImageUpload
                                      value={form.freeRewardImageUrl}
                                      onChange={(url) => onChange({ ...form, freeRewardImageUrl: url || '' })}
                                      folder="battle-pass-rewards"
                                      label="Image (optionnel)"
                                      aspectRatio="1:1"
                                      onCleanup={onImageCleanup}
                                      accentColor="mint"
                                    />
                </div>

                {/* Premium tier */}
                <div className="space-y-2 p-3 rounded-lg bg-slate-900/40 border border-amber-700/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1">
                    <Crown size={10} /> Tier Premium
                  </div>
                  {select('premiumRewardType', 'Type de récompense')}
                  {field('premiumRewardLabel', 'Libellé affiché', 'text', 'Bière offerte')}
                  {form.premiumRewardType === 'BALANCE' && field('premiumRewardValue', 'Montant (€)', 'number', '5')}
                  {field('premiumRewardDetails', 'Description complémentaire')}
                  <ImageUpload
                                      value={form.premiumRewardImageUrl}
                                      onChange={(url) => onChange({ ...form, premiumRewardImageUrl: url || '' })}
                                      folder="battle-pass-rewards"
                                      label="Image (optionnel)"
                                      aspectRatio="1:1"
                                      onCleanup={onImageCleanup}
                                      accentColor="amber"
                                    />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 rounded-lg bg-slate-700/40 border border-slate-600/20 transition-all">
          Annuler
        </button>
        <button onClick={onSave} disabled={saving} className="px-4 py-1.5 text-sm font-semibold text-amber-300 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-1.5">
          <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer le niveau'}
        </button>
      </div>
    </div>
  );
};

// ─── Pass Card ────────────────────────────────────────────────────────────────

const PassCard: React.FC<{
  bp: BattlePass;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ bp, onEdit, onDelete, onSelect, isSelected }) => {
  const expired = new Date() > new Date(bp.endDate);
  return (
    <div
      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-amber-500/40 bg-amber-500/5'
          : 'border-slate-700/30 bg-slate-800/30 hover:border-slate-600/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-sm truncate">{bp.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              expired
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : bp.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}>
              {expired ? 'Expiré' : bp.status}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatDate(bp.startDate)} → {formatDate(bp.endDate)}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Crown size={10} className="text-amber-500" />{fmt(bp.premiumPrice)}€</span>
            <span className="flex items-center gap-1"><Star size={10} className="text-slate-500" />{bp.levels.length} niveaux</span>
            {bp._count && <span className="flex items-center gap-1"><Users size={10} className="text-slate-500" />{bp._count.userPasses} utilisateurs</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminBattlePassPage: React.FC = () => {
  useDocumentTitle('Admin — Battle Pass');
  const { addNotification } = useNotification();

  const [passes, setPasses] = useState<BattlePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState<BattlePass | null>(null);
  const [userPasses, setUserPasses] = useState<UserPassEntry[]>([]);
  const [stats, setStats] = useState<BattlePassStats | null>(null);
  const [activeTab, setActiveTab] = useState<'levels' | 'players' | 'stats'>('levels');

  // Pass form
  const [showPassForm, setShowPassForm] = useState(false);
  const [editingPass, setEditingPass] = useState<BattlePass | null>(null);
  const [passForm, setPassForm] = useState<PassFormData>(emptyPassForm());
  const [savingPass, setSavingPass] = useState(false);
  const [deletePassId, setDeletePassId] = useState<number | null>(null);

  // Level form
  const [showLevelForm, setShowLevelForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<BattlePassLevel | null>(null);
  const [levelForm, setLevelForm] = useState<LevelFormData>(emptyLevelForm(1));
  const [savingLevel, setSavingLevel] = useState(false);
  const [deleteLevelTarget, setDeleteLevelTarget] = useState<{ passId: number; level: number } | null>(null);
  const uploadedLevelImagesRef = useRef<string[]>([]);

  const [syncing, setSyncing] = useState(false);
  const [removeUserTarget, setRemoveUserTarget] = useState<number | null>(null);

  const load = async (): Promise<BattlePass[]> => {
    try {
      const data = await adminGetAllBattlePasses();
      setPasses(data);
      if (data.length > 0 && !selectedPass) setSelectedPass(data[0]);
      return data;
    } catch {
      addNotification('error', 'Impossible de charger les Battle Pass');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedPass) return;
    setUserPasses([]);
    setStats(null);

    adminGetUserPasses(selectedPass.id).then(setUserPasses).catch(() => {});
    adminGetStats(selectedPass.id).then(setStats).catch(() => {});
  }, [selectedPass]);

  // ── Pass CRUD ──

  const openCreatePass = () => {
    setEditingPass(null);
    setPassForm(emptyPassForm());
    setShowPassForm(true);
  };

  const openEditPass = (bp: BattlePass) => {
    setEditingPass(bp);
    setPassForm({
      name: bp.name,
      description: bp.description ?? '',
      startDate: toInput(bp.startDate),
      endDate: toInput(bp.endDate),
      premiumPrice: String(bp.premiumPrice),
      status: bp.status,
    });
    setShowPassForm(true);
  };

  const savePass = async () => {
    if (!passForm.name || !passForm.startDate || !passForm.endDate) {
      addNotification('error', 'Nom, date de début et date de fin requis');
      return;
    }
    setSavingPass(true);
    try {
      const data = {
        name: passForm.name,
        description: passForm.description || undefined,
        startDate: passForm.startDate,
        endDate: passForm.endDate,
        premiumPrice: parseFloat(passForm.premiumPrice),
        status: passForm.status,
      };
      if (editingPass) {
        await adminUpdateBattlePass(editingPass.id, data);
        addNotification('success', 'Pass mis à jour');
      } else {
        await adminCreateBattlePass(data);
        addNotification('success', 'Pass créé');
      }
      setShowPassForm(false);
      const freshPasses = await load();
      if (editingPass) {
        const updated = freshPasses.find(p => p.id === editingPass.id);
        if (updated) setSelectedPass(updated);
      }
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    } finally {
      setSavingPass(false);
    }
  };

  const deletePass = async () => {
    if (!deletePassId) return;
    try {
      await adminDeleteBattlePass(deletePassId);
      addNotification('success', 'Pass supprimé');
      if (selectedPass?.id === deletePassId) setSelectedPass(null);
      setDeletePassId(null);
      await load();
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    }
  };

  // ── Level CRUD ──

  const openAddLevel = () => {
      if (!selectedPass) return;
      const nextLevel = selectedPass.levels.length + 1;
      setEditingLevel(null);
      uploadedLevelImagesRef.current = [];
      setLevelForm(emptyLevelForm(nextLevel));
      setShowLevelForm(true);
    };

  const openEditLevel = (lvl: BattlePassLevel) => {
      setEditingLevel(lvl);
      uploadedLevelImagesRef.current = [];
      setLevelForm({
        level: String(lvl.level),
        requiredSpend: String(lvl.requiredSpend),
        freeRewardType: lvl.freeRewardType ?? '',
        freeRewardLabel: lvl.freeRewardLabel ?? '',
        freeRewardValue: lvl.freeRewardValue != null ? String(lvl.freeRewardValue) : '',
        freeRewardDetails: lvl.freeRewardDetails ?? '',
        freeRewardImageUrl: lvl.freeRewardImageUrl ?? '',
        premiumRewardType: lvl.premiumRewardType ?? '',
        premiumRewardLabel: lvl.premiumRewardLabel ?? '',
        premiumRewardValue: lvl.premiumRewardValue != null ? String(lvl.premiumRewardValue) : '',
        premiumRewardDetails: lvl.premiumRewardDetails ?? '',
        premiumRewardImageUrl: lvl.premiumRewardImageUrl ?? '',
      });
      setShowLevelForm(true);
    };

  const saveLevel = async () => {
      if (!selectedPass) return;
      if (!levelForm.level || !levelForm.requiredSpend) {
        addNotification('error', 'Numéro de niveau et dépenses requises obligatoires');
        return;
      }
      setSavingLevel(true);
      try {
        await adminUpsertLevel(selectedPass.id, {
          level: parseInt(levelForm.level),
          requiredSpend: parseFloat(levelForm.requiredSpend),
          freeRewardType: (levelForm.freeRewardType as RewardType) || null,
          freeRewardLabel: levelForm.freeRewardLabel || null,
          freeRewardValue: levelForm.freeRewardValue ? parseFloat(levelForm.freeRewardValue) : null,
          freeRewardDetails: levelForm.freeRewardDetails || null,
          freeRewardImageUrl: levelForm.freeRewardImageUrl || null,
          premiumRewardType: (levelForm.premiumRewardType as RewardType) || null,
          premiumRewardLabel: levelForm.premiumRewardLabel || null,
          premiumRewardValue: levelForm.premiumRewardValue ? parseFloat(levelForm.premiumRewardValue) : null,
          premiumRewardDetails: levelForm.premiumRewardDetails || null,
          premiumRewardImageUrl: levelForm.premiumRewardImageUrl || null,
        });
        addNotification('success', editingLevel ? 'Niveau mis à jour' : 'Niveau ajouté');
        uploadedLevelImagesRef.current = [];
        setShowLevelForm(false);
        const freshPasses = await load();
        const updated = freshPasses.find(p => p.id === selectedPass.id);
        if (updated) setSelectedPass(updated);
      } catch (e: any) {
        addNotification('error', e.message ?? 'Erreur');
      } finally {
        setSavingLevel(false);
      }
    };

  const deleteLevel = async () => {
    if (!deleteLevelTarget) return;
    try {
      await adminDeleteLevel(deleteLevelTarget.passId, deleteLevelTarget.level);
      addNotification('success', 'Niveau supprimé');
      setDeleteLevelTarget(null);
      const freshPasses = await load();
      const updated = freshPasses.find(p => p.id === deleteLevelTarget.passId);
      if (updated) setSelectedPass(updated);
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    }
  };

  // ── Sync ──

  const handleSyncAll = async () => {
    if (!selectedPass) return;
    setSyncing(true);
    try {
      await adminSyncAllSpend(selectedPass.id);
      const updated = await adminGetUserPasses(selectedPass.id);
      setUserPasses(updated);
      const s = await adminGetStats(selectedPass.id);
      setStats(s);
      addNotification('success', 'Dépenses synchronisées');
    } catch {
      addNotification('error', 'Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleAdminUnlock = async (userId: number) => {
    if (!selectedPass) return;
    try {
      await adminUnlockPremiumForUser(selectedPass.id, userId);
      const updated = await adminGetUserPasses(selectedPass.id);
      setUserPasses(updated);
      addNotification('success', 'Premium débloqué pour l\'utilisateur');
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    }
  };

  // ── FIX: moved above return ──

  const handleRevokePremium = async (userId: number) => {
    if (!selectedPass) return;
    try {
      await adminRevokePremiumForUser(selectedPass.id, userId);
      const updated = await adminGetUserPasses(selectedPass.id);
      setUserPasses(updated);
      addNotification('success', 'Premium retiré');
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    }
  };

  const handleRemoveUser = async () => {
    if (!selectedPass || !removeUserTarget) return;
    try {
      await adminRemoveUserFromBattlePass(selectedPass.id, removeUserTarget);
      const updated = await adminGetUserPasses(selectedPass.id);
      setUserPasses(updated);
      const s = await adminGetStats(selectedPass.id);
      setStats(s);
      addNotification('success', 'Utilisateur retiré du Battle Pass');
      setRemoveUserTarget(null);
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy size={22} className="text-amber-400" />
            Battle Pass
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestion des saisons, niveaux et récompenses</p>
        </div>
        <button
          onClick={openCreatePass}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-sm hover:bg-amber-500/25 transition-all"
        >
          <Plus size={16} /> Nouveau pass
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Pass list ────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Pass ({passes.length})</h2>
          {passes.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-700/30 rounded-xl">
              Aucun pass créé
            </div>
          ) : (
            passes.map(bp => (
              <PassCard
                key={bp.id}
                bp={bp}
                onEdit={() => openEditPass(bp)}
                onDelete={() => setDeletePassId(bp.id)}
                onSelect={() => setSelectedPass(bp)}
                isSelected={selectedPass?.id === bp.id}
              />
            ))
          )}
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <div className="xl:col-span-2">
          {!selectedPass ? (
            <div className="flex items-center justify-center h-48 rounded-2xl border border-dashed border-slate-700/30 text-slate-600 text-sm">
              Sélectionner un pass pour le gérer
            </div>
          ) : (
            <>
              {/* Pass header */}
              <div className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-4 mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-white">{selectedPass.name}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(selectedPass.startDate)} → {formatDate(selectedPass.endDate)} · Premium : {fmt(selectedPass.premiumPrice)}€
                  </div>
                </div>
                <button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  title="Recalcule les dépenses de tous les utilisateurs"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-emerald-400 rounded-lg bg-slate-700/40 border border-slate-600/20 hover:border-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                  Sync dépenses
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-slate-800/40 rounded-xl p-1 border border-slate-700/20">
                {([
                  { id: 'levels', label: 'Niveaux & récompenses', icon: Star },
                  { id: 'players', label: 'Utilisateurs', icon: Users },
                  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
                ] as const).map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon size={12} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ── Tab: Levels ───────────────────────────────────────────── */}
              {activeTab === 'levels' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">{selectedPass.levels.length} niveaux</span>
                    <button
                      onClick={openAddLevel}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                    >
                      <Plus size={12} /> Ajouter un niveau
                    </button>
                  </div>

                  {showLevelForm && (
                                      <div className="mb-4">
                                        <LevelFormRow
                                          form={levelForm}
                                          onChange={setLevelForm}
                                          onSave={saveLevel}
                                          onCancel={async () => {
                                            for (const url of uploadedLevelImagesRef.current) {
                                              try { await deleteImage(url); } catch { /* ignore */ }
                                            }
                                            uploadedLevelImagesRef.current = [];
                                            setShowLevelForm(false);
                                          }}
                                          saving={savingLevel}
                                          onImageCleanup={(url) => uploadedLevelImagesRef.current.push(url)}
                                        />
                                      </div>
                                    )}

                  <div className="space-y-2">
                    {selectedPass.levels.length === 0 ? (
                      <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-700/30 rounded-xl">
                        Aucun niveau configuré
                      </div>
                    ) : (
                      selectedPass.levels.map(lvl => (
                        <div key={lvl.id} className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white">Niveau {lvl.level}</span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                  <Euro size={9} />{fmt(lvl.requiredSpend)} requis
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                 <div className="text-[10px] flex items-center gap-1.5">
                                                                  {lvl.freeRewardImageUrl && (
                                                                    <img src={lvl.freeRewardImageUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0 border border-slate-700/40" />
                                                                  )}
                                                                  <div>
                                                                    <div className="text-emerald-500 font-bold mb-0.5 uppercase tracking-wider">Gratuit</div>
                                                                    {lvl.freeRewardType ? (
                                                                      <span className="text-slate-300">{lvl.freeRewardLabel ?? lvl.freeRewardType}{lvl.freeRewardValue ? ` (+${fmt(lvl.freeRewardValue)}€)` : ''}</span>
                                                                    ) : <span className="text-slate-600">—</span>}
                                                                  </div>
                                                                </div>
                                                                <div className="text-[10px] flex items-center gap-1.5">
                                                                  {lvl.premiumRewardImageUrl && (
                                                                    <img src={lvl.premiumRewardImageUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0 border border-amber-700/30" />
                                                                  )}
                                                                  <div>
                                                                    <div className="text-amber-500 font-bold mb-0.5 uppercase tracking-wider flex items-center gap-1"><Crown size={8} />Premium</div>
                                                                    {lvl.premiumRewardType ? (
                                                                      <span className="text-slate-300">{lvl.premiumRewardLabel ?? lvl.premiumRewardType}{lvl.premiumRewardValue ? ` (+${fmt(lvl.premiumRewardValue)}€)` : ''}</span>
                                                                    ) : <span className="text-slate-600">—</span>}
                                                                  </div>
                                                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => openEditLevel(lvl)} className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all">
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteLevelTarget({ passId: selectedPass.id, level: lvl.level })}
                                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Players ──────────────────────────────────────────── */}
              {activeTab === 'players' && (
                <div>
                  <div className="mb-3 text-xs text-slate-500">{userPasses.length} utilisateurs inscrits</div>
                  {userPasses.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-700/30 rounded-xl">
                      Aucun joueur
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.3) transparent' }}>
                      {userPasses.map(up => {
                        const maxLevel = selectedPass.levels.reduce(
                          (max, l) => up.currentSpend >= l.requiredSpend ? l.level : max, 0
                        );
                        const claimedCount = (up.claimedFreeRewards?.length ?? 0) + (up.claimedPremiumRewards?.length ?? 0);
                        return (
                          <div key={up.id} className="rounded-xl border border-slate-700/30 bg-slate-800/20 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white truncate">
                                    {up.user.firstName} {up.user.lastName}
                                  </span>
                                  {up.hasPremium && (
                                    <span className="flex-shrink-0 flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                                      <Crown size={8} />PREM
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500">{up.user.email} {up.user.studentGroup ? `· ${up.user.studentGroup}` : ''}</div>
                                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                                  <span className="flex items-center gap-0.5"><Euro size={9} />{fmt(up.currentSpend)}</span>
                                  <span className="flex items-center gap-0.5"><Star size={9} />Niv. {maxLevel}</span>
                                  <span className="flex items-center gap-0.5"><Gift size={9} />{claimedCount} réclamé(s)</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 flex-shrink-0">
                                {up.hasPremium ? (
                                  <button
                                    onClick={() => handleRevokePremium(up.user.id)}
                                    className="px-2.5 py-1.5 text-[10px] font-semibold text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                  >
                                    <Crown size={10} className="inline mr-1" />Retirer Premium
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdminUnlock(up.user.id)}
                                    className="px-2.5 py-1.5 text-[10px] font-semibold text-amber-400 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                                  >
                                    <Crown size={10} className="inline mr-1" />Grant Premium
                                  </button>
                                )}
                                <button
                                  onClick={() => setRemoveUserTarget(up.user.id)}
                                  className="px-2.5 py-1.5 text-[10px] font-semibold text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                >
                                  <Trash2 size={10} className="inline mr-1" />Retirer
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: Stats ────────────────────────────────────────────── */}
              {activeTab === 'stats' && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Utilisateurs', value: String(stats.totalUsers), icon: Users, color: 'text-blue-400' },
                    { label: 'Premium', value: String(stats.premiumUsers), icon: Crown, color: 'text-amber-400' },
                    { label: 'Revenu premium', value: `${fmt(stats.premiumUsers * selectedPass.premiumPrice)}€`, icon: Euro, color: 'text-emerald-400' },
                    { label: 'Dépense moy.', value: `${fmt(stats.avgSpend)}€`, icon: BarChart3, color: 'text-slate-400' },
                    { label: 'Dépense max', value: `${fmt(stats.maxSpend)}€`, icon: Trophy, color: 'text-amber-400' },
                    { label: 'Dépense totale', value: `${fmt(stats.totalSpend)}€`, icon: Euro, color: 'text-emerald-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-4">
                      <div className={`${color} mb-2`}><Icon size={16} /></div>
                      <div className="text-xl font-black text-white">{value}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Pass Form Modal ──────────────────────────────────────────────────── */}
      {showPassForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/20 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-full">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              {editingPass ? 'Modifier le pass' : 'Créer un Battle Pass'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Nom du pass *</label>
                <input
                  type="text"
                  value={passForm.name}
                  onChange={e => setPassForm({ ...passForm, name: e.target.value })}
                  placeholder="Battle Pass Printemps 2026"
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Description</label>
                <textarea
                  value={passForm.description}
                  onChange={e => setPassForm({ ...passForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Date de début *</label>
                  <input
                    type="datetime-local"
                    value={passForm.startDate}
                    onChange={e => setPassForm({ ...passForm, startDate: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Date d'expiration *</label>
                  <input
                    type="datetime-local"
                    value={passForm.endDate}
                    onChange={e => setPassForm({ ...passForm, endDate: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Prix Premium (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={passForm.premiumPrice}
                    onChange={e => setPassForm({ ...passForm, premiumPrice: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                {editingPass && (
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Statut</label>
                    <select
                      value={passForm.status}
                      onChange={e => setPassForm({ ...passForm, status: e.target.value as 'ACTIVE' | 'ENDED' })}
                      className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="ACTIVE">Actif</option>
                      <option value="ENDED">Terminé</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPassForm(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700/30 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition-all">
                Annuler
              </button>
              <button onClick={savePass} disabled={savingPass} className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={14} /> {savingPass ? 'Enregistrement...' : (editingPass ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm dialogs ────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deletePassId !== null}
        title="Supprimer le pass ?"
        message="Cette action supprimera définitivement le pass et toutes les progressions associées."
        confirmText="Supprimer"
        variant="danger"
        onConfirm={deletePass}
        onClose={() => setDeletePassId(null)}
      />
      <ConfirmDialog
        isOpen={removeUserTarget !== null}
        title="Retirer l'utilisateur ?"
        message="L'utilisateur perdra toute sa progression sur ce Battle Pass. Cette action est irréversible."
        confirmText="Retirer"
        variant="danger"
        onConfirm={handleRemoveUser}
        onClose={() => setRemoveUserTarget(null)}
      />
      <ConfirmDialog
        isOpen={deleteLevelTarget !== null}
        title="Supprimer le niveau ?"
        message="Les récompenses de ce niveau ne seront plus disponibles."
        confirmText="Supprimer"
        variant="danger"
        onConfirm={deleteLevel}
        onClose={() => setDeleteLevelTarget(null)}
      />
    </div>
  );
};

export default AdminBattlePassPage;