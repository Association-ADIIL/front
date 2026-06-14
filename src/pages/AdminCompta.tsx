import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, Receipt, Euro,
  Plus, Trash2, Pencil, X, Check, ChevronLeft, ChevronRight,
  BarChart3, Package, RefreshCw, AlertCircle, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { fetchJson } from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIs {
  chiffreAffaires: number;
  totalAchats: number;
  resultatNet: number;
  margeBrute: number;
  tauxMarque: number;
  tauxMarge: number;
  panierMoyen: number;
  totalRemboursements: number;
  totalReductions: number;
  totalRecharges: number;
  nbCommandes: number;
}

interface EvolutionPoint { date: string; ca: number; }
interface TopProduit { name: string; quantite: number; ca: number; }
interface AchatCategorieStat { categorie: string; montant: number; }
interface PaiementStat { methode: string; montant: number; }

interface DashboardData {
  kpis: KPIs;
  evolution: EvolutionPoint[];
  topProduits: TopProduit[];
  achatsParCategorie: AchatCategorieStat[];
  repartitionPaiements: PaiementStat[];
  achatsRecents: AchatFournisseur[];
}

interface AchatItem {
  id?: number;
  productId: number;
  productName?: string; // pour affichage (rempli côté backend via include product)
  quantite: number;
  prixUnitaire: number;
}

interface AchatFournisseur {
  id: number;
  date: string;
  fournisseur: string;
  montant: number;
  categorie: string;
  createdAt: string;
  items: {
    id: number;
    quantite: number;
    prixUnitaire: number;
    product: { id: number; name: string };
  }[];
}

interface ProductOption {
  id: number;
  name: string;
  active: boolean;
}

type AchatCategorie = 'STOCK' | 'MATERIEL' | 'EMBALLAGE' | 'FRAIS_FIXES' | 'AUTRE';

const CATEGORIES: { value: AchatCategorie; label: string }[] = [
  { value: 'STOCK', label: 'Réapprovisionnement stock' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'EMBALLAGE', label: 'Emballage' },
  { value: 'FRAIS_FIXES', label: 'Frais fixes' },
  { value: 'AUTRE', label: 'Autre' },
];

const CAT_COLORS: Record<string, string> = {
  STOCK: '#1D9E75',
  MATERIEL: '#378ADD',
  EMBALLAGE: '#EF9F27',
  FRAIS_FIXES: '#D4537E',
  AUTRE: '#888780',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const pct = (n: number) => `${n.toFixed(1)} %`;

function getMonthRange(offset = 0) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + offset;
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {
    debut: fmt(first),
    fin: fmt(last),
    label: first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  };
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const METHODE_LABELS: Record<string, string> = {
  CASH_CB: 'Cash / CB',
  BALANCE: 'Solde',
  HELLOASSO: 'HelloAsso',
  PAYPAL: 'PayPal',
  FREE: 'Gratuit',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  positive?: boolean | null; // null = neutral
  color: string; // tailwind bg class
}

function KpiCard({ label, value, sub, icon, positive, color }: KpiCardProps) {
  return (
    <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            positive === true ? 'text-emerald-400' :
            positive === false ? 'text-red-400' :
            'text-gray-500'
          }`}>
            {positive === true && <TrendingUp size={11} />}
            {positive === false && <TrendingDown size={11} />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Modal ajout / édition achat ─────────────────────────────────────────────

interface AchatModalProps {
  initial?: AchatFournisseur | null;
  defaultDate: string;
  products: ProductOption[];
  onClose: () => void;
  onSave: (data: {
    date: string;
    fournisseur: string;
    categorie: AchatCategorie;
    items: { productId: number; quantite: number; prixUnitaire: number }[];
  }) => Promise<void>;
}

interface FormItem {
  uid: string; // clé locale pour le rendu
  productId: number | null;
  productName: string; // texte affiché dans le champ recherche
  quantite: string;
  prixUnitaire: string;
  showSuggestions: boolean;
}

function makeUid() {
  return Math.random().toString(36).slice(2);
}

function AchatModal({ initial, defaultDate, products, onClose, onSave }: AchatModalProps) {
  const [date, setDate] = useState(initial ? initial.date.split('T')[0] : defaultDate);
  const [fournisseur, setFournisseur] = useState(initial?.fournisseur ?? '');
  const [categorie, setCategorie] = useState<AchatCategorie>((initial?.categorie ?? 'STOCK') as AchatCategorie);
  const [items, setItems] = useState<FormItem[]>(() => {
    if (initial && initial.items.length > 0) {
      return initial.items.map((i) => ({
        uid: makeUid(),
        productId: i.product.id,
        productName: i.product.name,
        quantite: String(i.quantite),
        prixUnitaire: String(i.prixUnitaire),
        showSuggestions: false,
      }));
    }
    return [{ uid: makeUid(), productId: null, productName: '', quantite: '1', prixUnitaire: '', showSuggestions: false }];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputCls =
    'w-full bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors';

  function updateItem(uid: string, patch: Partial<FormItem>) {
    setItems((arr) => arr.map((it) => (it.uid === uid ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((arr) => [...arr, { uid: makeUid(), productId: null, productName: '', quantite: '1', prixUnitaire: '', showSuggestions: false }]);
  }

  function removeItem(uid: string) {
    setItems((arr) => (arr.length > 1 ? arr.filter((it) => it.uid !== uid) : arr));
  }

  function selectProduct(uid: string, product: ProductOption) {
    updateItem(uid, { productId: product.id, productName: product.name, showSuggestions: false });
  }

  const total = items.reduce((s, it) => {
    const q = parseFloat(it.quantite) || 0;
    const p = parseFloat(it.prixUnitaire) || 0;
    return s + q * p;
  }, 0);

  async function handleSubmit() {
    if (!date || !fournisseur.trim()) {
      setError('Date et fournisseur sont obligatoires.');
      return;
    }
    if (items.length === 0) {
      setError('Ajoute au moins un article.');
      return;
    }
    for (const it of items) {
      if (!it.productId) {
        setError('Sélectionne un produit pour chaque ligne.');
        return;
      }
      const q = parseFloat(it.quantite);
      const p = parseFloat(it.prixUnitaire);
      if (isNaN(q) || q <= 0) {
        setError('Quantité invalide sur une ligne.');
        return;
      }
      if (isNaN(p) || p < 0) {
        setError('Prix unitaire invalide sur une ligne.');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        date,
        fournisseur: fournisseur.trim(),
        categorie,
        items: items.map((it) => ({
          productId: it.productId as number,
          quantite: parseFloat(it.quantite),
          prixUnitaire: parseFloat(it.prixUnitaire),
        })),
      });
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-darker-bg border border-gray-800 rounded-2xl w-full max-w-xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="font-semibold text-white">
            {initial ? 'Modifier un achat' : 'Saisir un achat fournisseur'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
              <select value={categorie} onChange={(e) => setCategorie(e.target.value as AchatCategorie)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fournisseur</label>
            <input
              type="text" placeholder="ex: Metro, Costco…"
              value={fournisseur} onChange={(e) => setFournisseur(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Liste des articles */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 block">Articles</label>

            {items.map((it) => {
              const suggestions = it.productName.trim().length > 0
                ? products.filter((p) =>
                    p.active && p.name.toLowerCase().includes(it.productName.toLowerCase())
                  ).slice(0, 6)
                : [];

              return (
                <div key={it.uid} className="flex gap-2 items-start">
                  {/* Produit (autocomplétion) */}
                  <div className="relative flex-1 min-w-[180px]">
                    <input
                      type="text"
                      placeholder="Rechercher un produit…"
                      value={it.productName}
                      onChange={(e) => updateItem(it.uid, { productName: e.target.value, productId: null, showSuggestions: true })}
                      onFocus={() => updateItem(it.uid, { showSuggestions: true })}
                      onBlur={() => setTimeout(() => updateItem(it.uid, { showSuggestions: false }), 150)}
                      className={inputCls}
                    />
                    {it.showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-dark-bg border border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {suggestions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProduct(it.uid, p)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantité */}
                  <input
                    type="number" min="1" step="1" placeholder="Qté"
                    value={it.quantite}
                    onChange={(e) => updateItem(it.uid, { quantite: e.target.value })}
                    className={`${inputCls} w-20`}
                  />

                  {/* Prix unitaire */}
                  <input
                    type="number" min="0" step="0.01" placeholder="Prix u."
                    value={it.prixUnitaire}
                    onChange={(e) => updateItem(it.uid, { prixUnitaire: e.target.value })}
                    className={`${inputCls} w-24`}
                  />

                  {/* Supprimer */}
                  <button
                    type="button"
                    onClick={() => removeItem(it.uid)}
                    disabled={items.length === 1}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-emerald-400 text-xs hover:underline mt-1"
            >
              <Plus size={12} /> Ajouter un article
            </button>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-800">
            <span className="text-sm text-gray-400">Total</span>
            <span className="text-lg font-semibold text-white">{eur(total)}</span>
          </div>

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ComptabilitePage() {
    const [monthOffset, setMonthOffset] = useState(0);
    const periode = getMonthRange(monthOffset);

    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [achats, setAchats] = useState<AchatFournisseur[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'dashboard' | 'achats'>('dashboard');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<AchatFournisseur | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // ── Data fetching ────────────────────────────────────────────────────────────

    const load = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        const [dash, ach] = await Promise.all([
          fetchJson<DashboardData>(
            `/admin/comptabilite/dashboard?debut=${periode.debut}&fin=${periode.fin}`
          ),
          fetchJson<AchatFournisseur[]>(
            `/admin/comptabilite/achats?debut=${periode.debut}&fin=${periode.fin}`
          ),
        ]);
        setDashboard(dash);
        setAchats(ach);
      } catch (e: any) {
        setError(e.message ?? 'Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    }, [periode.debut, periode.fin]);

    useEffect(() => { load(); }, [load]);

    // Charge la liste des produits une seule fois (pour l'autocomplétion)
    useEffect(() => {
      fetchJson<ProductOption[]>('/products')
        .then(setProducts)
        .catch(() => setProducts([]));
    }, []);

    // ── Actions ──────────────────────────────────────────────────────────────────

    async function handleSaveAchat(data: {
      date: string;
      fournisseur: string;
      categorie: AchatCategorie;
      items: { productId: number; quantite: number; prixUnitaire: number }[];
    }) {
      if (editTarget) {
        await fetchJson(`/admin/comptabilite/achats/${editTarget.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        await fetchJson('/admin/comptabilite/achats', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      await load();
    }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await fetchJson(`/admin/comptabilite/achats/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const kpis = dashboard?.kpis;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Comptabilité</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi financier de la supérette</p>
        </div>

        {/* Sélecteur de mois */}
        <div className="flex items-center gap-2 bg-dark-bg/60 border border-gray-800 rounded-xl px-3 py-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-white capitalize min-w-[140px] text-center">
            {periode.label}
          </span>
          <button
            onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
            disabled={monthOffset === 0}
            className="p-1 text-gray-500 hover:text-white transition-colors disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={load}
            className="ml-1 p-1 text-gray-500 hover:text-emerald-400 transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-bg/60 border border-gray-800 rounded-xl p-1 w-fit">
        {([['dashboard', 'Vue d\'ensemble'], ['achats', 'Achats fournisseurs']] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {loading && !dashboard ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-emerald-400" />
        </div>
      ) : tab === 'dashboard' ? (
        <DashboardTab dashboard={dashboard} />
      ) : (
        <AchatsTab
          achats={achats}
          deletingId={deletingId}
          defaultDate={periode.fin}
          onAdd={() => { setEditTarget(null); setModalOpen(true); }}
          onEdit={(a) => { setEditTarget(a); setModalOpen(true); }}
          onDelete={handleDelete}
        />
      )}

      {modalOpen && (
              <AchatModal
                initial={editTarget}
                defaultDate={periode.debut}
                products={products}
                onClose={() => { setModalOpen(false); setEditTarget(null); }}
                onSave={handleSaveAchat}
              />
            )}
    </div>
  );
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────

function DashboardTab({ dashboard }: { dashboard: DashboardData | null }) {
  if (!dashboard) return null;
  const { kpis, evolution, topProduits, achatsParCategorie, repartitionPaiements } = dashboard;

  const resultatPositif = kpis.resultatNet >= 0;

  return (
    <div className="space-y-6">

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Chiffre d'affaires"
          value={eur(kpis.chiffreAffaires)}
          sub={`${kpis.nbCommandes} commandes`}
          icon={<Euro size={15} className="text-emerald-400" />}
          color="bg-emerald-500/20"
          positive={null}
        />
        <KpiCard
          label="Achats fournisseurs"
          value={eur(kpis.totalAchats)}
          sub="Dépenses saisies"
          icon={<ShoppingCart size={15} className="text-orange-400" />}
          color="bg-orange-500/20"
          positive={null}
        />
        <KpiCard
          label="Résultat net"
          value={eur(kpis.resultatNet)}
          sub={resultatPositif ? 'Bénéfice' : 'Déficit'}
          icon={resultatPositif
            ? <TrendingUp size={15} className="text-emerald-400" />
            : <TrendingDown size={15} className="text-red-400" />
          }
          color={resultatPositif ? 'bg-emerald-500/20' : 'bg-red-500/20'}
          positive={resultatPositif}
        />
        <KpiCard
          label="Taux de marque"
          value={pct(kpis.tauxMarque)}
          sub={`Taux de marge : ${pct(kpis.tauxMarge)}`}
          icon={<BarChart3 size={15} className="text-blue-400" />}
          color="bg-blue-500/20"
          positive={kpis.tauxMarque > 20}
        />
      </div>

      {/* Ligne 2 KPIs secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-dark-bg/40 border border-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Panier moyen</p>
          <p className="text-lg font-semibold text-white">{eur(kpis.panierMoyen)}</p>
        </div>
        <div className="bg-dark-bg/40 border border-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Remboursements</p>
          <p className="text-lg font-semibold text-red-400">{eur(kpis.totalRemboursements)}</p>
        </div>
        <div className="bg-dark-bg/40 border border-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Réductions accordées</p>
          <p className="text-lg font-semibold text-amber-400">{eur(kpis.totalReductions)}</p>
        </div>
        <div className="bg-dark-bg/40 border border-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Rechargements balance</p>
          <p className="text-lg font-semibold text-purple-400">{eur(kpis.totalRecharges)}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Évolution CA */}
        <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-4">Évolution du CA</p>
          {evolution.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={evolution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={shortDate} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ background: '#0f1318', border: '1px solid #1f2937', borderRadius: 8 }}
                  labelFormatter={shortDate}
                  formatter={(v: number) => [eur(v), 'CA']}
                />
                <Area type="monotone" dataKey="ca" stroke="#1D9E75" strokeWidth={2}
                  fill="url(#caGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top produits */}
        <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-4">Top produits par CA</p>
          {topProduits.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">Aucune vente</p>
          ) : (

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProduits} layout="vertical" margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) => `${v}€`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  width={110}
                  tickFormatter={(name: string) => name.length > 18 ? `${name.slice(0, 18)}…` : name}
                />
                <Tooltip
                  contentStyle={{ background: '#0f1318', border: '1px solid #1f2937', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#9ca3af' }}
                  formatter={(v: number) => [eur(v), 'CA']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                />
                <Bar dataKey="ca" radius={[0, 4, 4, 0]} activeBar={false}>
                  {topProduits.map((_, i) => (
                    <Cell key={i} fill={`hsl(${160 - i * 8}, 60%, ${45 - i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3 : achats par catégorie + répartition paiements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Achats par catégorie */}
        <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-4">Dépenses par catégorie</p>
          {achatsParCategorie.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Aucun achat saisi</p>
          ) : (
            <div className="space-y-3">
              {achatsParCategorie
                .sort((a, b) => b.montant - a.montant)
                .map((item) => {
                  const total = achatsParCategorie.reduce((s, i) => s + i.montant, 0);
                  const pct = total > 0 ? (item.montant / total) * 100 : 0;
                  const color = CAT_COLORS[item.categorie] ?? '#888780';
                  const label = CATEGORIES.find((c) => c.value === item.categorie)?.label ?? item.categorie;
                  return (
                    <div key={item.categorie}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color }} className="font-medium">{label}</span>
                        <span className="text-gray-400">{eur(item.montant)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Répartition paiements */}
        <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-4">Méthodes de paiement</p>
          {repartitionPaiements.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {repartitionPaiements
                .sort((a, b) => b.montant - a.montant)
                .map((item) => {
                  const total = repartitionPaiements.reduce((s, i) => s + i.montant, 0);
                  const p = total > 0 ? (item.montant / total) * 100 : 0;
                  return (
                    <div key={item.methode}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{METHODE_LABELS[item.methode] ?? item.methode}</span>
                        <span className="text-gray-400">{eur(item.montant)} · {p.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Achats tab ───────────────────────────────────────────────────────────────

interface AchatsTabProps {
  achats: AchatFournisseur[];
  deletingId: number | null;
  defaultDate: string;
  onAdd: () => void;
  onEdit: (a: AchatFournisseur) => void;
  onDelete: (id: number) => void;
}

function AchatsTab({ achats, deletingId, onAdd, onEdit, onDelete }: AchatsTabProps) {
  const total = achats.reduce((s, a) => s + a.montant, 0);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {achats.length} entrée{achats.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-white font-medium">{eur(total)}</span> total
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors"
        >
          <Plus size={15} /> Saisir un achat
        </button>
      </div>

      {/* Table */}
      {achats.length === 0 ? (
        <div className="bg-dark-bg/40 border border-gray-800 rounded-xl py-16 text-center">
          <Package size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucun achat saisi pour cette période.</p>
          <button
            onClick={onAdd}
            className="mt-4 text-emerald-400 text-sm hover:underline flex items-center gap-1 mx-auto"
          >
            <Plus size={13} /> Ajouter le premier achat
          </button>
        </div>
      ) : (
        <div className="bg-dark-bg/60 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Fournisseur</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Catégorie</th>
                <th className="text-right px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {achats.map((a, i) => {
                const color = CAT_COLORS[a.categorie] ?? '#888780';
                const label = CATEGORIES.find((c) => c.value === a.categorie)?.label ?? a.categorie;
                return (
                    <tr
                    key={a.id}
                    className={`border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors ${
                        i === achats.length - 1 ? 'border-b-0' : ''
                        }`}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {shortDate(a.date)}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{a.fournisseur}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {a.items.map((it) => `${it.product.name} ×${it.quantite}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: color + '22', color }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold whitespace-nowrap">
                      {eur(a.montant)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => onEdit(a)}
                          className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deletingId === a.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-800 bg-dark-bg/40">
                <td colSpan={4} className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider">
                  Total période
                </td>
                <td className="px-4 py-3 text-right text-white font-bold">{eur(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}