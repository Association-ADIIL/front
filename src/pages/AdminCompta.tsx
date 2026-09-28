import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, Euro,
  Plus, Trash2, Pencil, X, Check, ChevronLeft, ChevronRight,
  BarChart3, Package, RefreshCw, AlertCircle,CheckCircle, Loader2,
  Paperclip, Upload, Receipt,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { fetchJson, fetchFormData } from '../api/client';

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
  totalInscriptions: number;
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

interface AchatFournisseur {
  id: number;
  date: string;
  fournisseur: string;
  fournisseurCategorie?: string | null;
  montant: number;
  categorie: string;
  createdAt: string;
  // Ticket de caisse associé (un seul par achat), le cas échéant. Le bucket
  // R2 étant privé, il n'y a pas d'URL directement exploitable : il faut
  // demander une URL signée à la demande via GET /upload/private/:fileId
  // (cf. openSignedReceipt ci-dessous).
  receiptFile?: { id: number; fileName: string } | null;
  items: {
    id: number;
    quantite: number;
    prixUnitaire: number;
    // Article hors-catalogue (ex: BBQ) : product est null, description prend le relais.
    description?: string | null;
    product: { id: number; name: string } | null;
  }[];
}

interface ProductOption {
  id: number;
  name: string;
  categorie?: string | null;
  suiviStock: boolean;
}

interface CategorieOption {
  value: string;
  label: string;
}

interface StockItem {
  productId: number;
  name: string;
  categorie: string | null;
  costPrice: number;
  stockDebut: number;
  stockActuel: number;
  ventes: number;
  achats: number;
  valeur: number;
  stockPresume: number;       // ← ajout
  inventaire: number | null;  // ← ajout
}

interface StockKPIs {
  valeurTotale: number;
  nbRupture: number;
  nbFaible: number;
  nbProduits: number;
}

interface StockData {
  items: StockItem[];
  kpis: StockKPIs;
}

// ─── Couleurs ─────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  STOCK: '#1D9E75',
  MATERIEL: '#378ADD',
  EMBALLAGE: '#EF9F27',
  FRAIS_FIXES: '#D4537E',
  AUTRE: '#888780',
};

const PALETTE = ['#1D9E75', '#378ADD', '#EF9F27', '#D4537E', '#8B5CF6', '#06B6D4', '#F43F5E', '#84CC16', '#F59E0B', '#888780'];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCategorieColor(value: string): string {
  return CAT_COLORS[value] ?? PALETTE[hashString(value) % PALETTE.length];
}

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

// Le bucket R2 privé n'expose pas d'URL statique : on demande une URL signée
// (valable 1h côté back) juste avant d'ouvrir le fichier.
async function openSignedReceipt(fileId: number) {
  try {
    const { url } = await fetchJson<{ url: string }>(`/upload/private/${fileId}`);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    window.alert("Impossible d'ouvrir le ticket de caisse.");
  }
}

const METHODE_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  CB: 'CB',
  BALANCE: 'Solde',
  HELLOASSO: 'HelloAsso',

  FREE: 'Gratuit',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  positive?: boolean | null;
  color: string;
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
  achatCategories: CategorieOption[];
  fournisseurCategories: CategorieOption[];
  onClose: () => void;
  onSave: (data: {
    date: string;
    fournisseur: string;
    categorie: string;
    fournisseurCategorie: string | null;
    items: (
      | { productId: number; quantite: number; prixUnitaire: number }
      | { description: string; quantite: number; prixUnitaire: number }
    )[];
  }) => Promise<AchatFournisseur>;
  onUploadReceipt: (achatId: number, file: File) => Promise<AchatFournisseur>;
  onDeleteReceipt: (achatId: number) => Promise<AchatFournisseur>;
}

interface FormItem {
  uid: string;
  // 'produit' : article du catalogue (recherche + paquets). 'personnalise' :
  // achat hors-catalogue décrit en texte libre (ex: BBQ).
  mode: 'produit' | 'personnalise';
  productId: number | null;
  productName: string;
  nbPaquets: string;     // ← Remplace "quantite"
  nbParPaquet: string;
  prixPaquet: string;
  description: string;
  quantitePerso: string;
  prixUnitairePerso: string;
  showSuggestions: boolean;
}

function makeUid() {
  return Math.random().toString(36).slice(2);
}

function AchatModal({ initial, defaultDate, products, achatCategories, fournisseurCategories, onClose, onSave, onUploadReceipt, onDeleteReceipt }: AchatModalProps) {
  const isEdit = !!initial;

  const [date, setDate] = useState(initial ? initial.date.split('T')[0] : defaultDate);
  const [categorie, setCategorie] = useState<string>(initial?.categorie ?? '');
  const [fournisseurCategorie, setFournisseurCategorie] = useState<string>(initial?.fournisseurCategorie ?? '');
  const [itemsState, setItems] = useState<FormItem[]>(() => {
      if (initial && initial.items.length > 0) {
        return initial.items.map((i) => ({
          uid: makeUid(),
          mode: i.product ? 'produit' : 'personnalise',
          productId: i.product?.id ?? null,
          productName: i.product?.name ?? '',
          // Historique : réaffiché comme 1 paquet de N articles en lecture seule
          nbPaquets: String(i.quantite),
          nbParPaquet: '1',
          prixPaquet: String(i.prixUnitaire),
          description: i.description ?? '',
          quantitePerso: String(i.quantite),
          prixUnitairePerso: String(i.prixUnitaire),
          showSuggestions: false,
        }));
      }
      return [{
        uid: makeUid(), mode: 'produit', productId: null, productName: '',
        nbPaquets: '', nbParPaquet: '', prixPaquet: '',
        description: '', quantitePerso: '', prixUnitairePerso: '',
        showSuggestions: false,
      }];
    });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ─ Ticket de caisse ─
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceipt, setExistingReceipt] = useState(initial?.receiptFile ?? null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [deletingReceipt, setDeletingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  // Une fois l'achat créé (mode création), on mémorise le résultat pour ne
  // pas le recréer si on retente juste l'upload du ticket après une erreur.
  const [createdAchat, setCreatedAchat] = useState<AchatFournisseur | null>(null);

  const inputCls =
    'w-full bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  function updateItem(uid: string, patch: Partial<FormItem>) {
    if (isEdit) return; // articles verrouillés en édition
    setItems((arr) => arr.map((it) => (it.uid === uid ? { ...it, ...patch } : it)));
  }

  function addItem() {
      if (isEdit) return;
      setItems((arr) => [...arr, {
        uid: makeUid(), mode: 'produit', productId: null, productName: '',
        nbPaquets: '', nbParPaquet: '', prixPaquet: '',
        description: '', quantitePerso: '', prixUnitairePerso: '',
        showSuggestions: false,
      }]);
    }

  function removeItem(uid: string) {
    if (isEdit) return;
    setItems((arr) => (arr.length > 1 ? arr.filter((it) => it.uid !== uid) : arr));
  }

  function selectProduct(uid: string, product: ProductOption) {
    if (isEdit) return;
    updateItem(uid, { productId: product.id, productName: product.name, showSuggestions: false });
  }

  const total = itemsState.reduce((s, it) => {
      if (it.mode === 'personnalise') {
        const q = parseFloat(it.quantitePerso) || 0;
        const pu = parseFloat(it.prixUnitairePerso) || 0;
        return s + q * pu;
      }
      const nb = parseFloat(it.nbPaquets) || 0;
      const pp = parseFloat(it.prixPaquet) || 0;
      return s + nb * pp;
    }, 0);

  async function handleSubmit() {
      if (!date) { setError('Date obligatoire.'); return; }
      setSaving(true);
      setError('');
      setReceiptError('');
      try {
        let achat: AchatFournisseur;

        if (createdAchat) {
          // Achat déjà enregistré lors d'une tentative précédente : on ne
          // fait que retenter l'upload du ticket ci-dessous.
          achat = createdAchat;
        } else if (isEdit) {
          achat = await onSave({
            date,
            fournisseur: '',
            categorie,
            fournisseurCategorie: fournisseurCategorie || null,
            items: [],
          });
        } else {
          for (const it of itemsState) {
            if (it.mode === 'produit') {
              if (!it.productId) { setError('Sélectionne un produit pour chaque ligne, ou passe-la en "Achat personnalisé".'); setSaving(false); return; }
              const nb = parseFloat(it.nbPaquets);
              const n = parseFloat(it.nbParPaquet);
              const pp = parseFloat(it.prixPaquet);
              if (isNaN(nb) || nb <= 0) { setError('Nombre de paquets invalide sur une ligne.'); setSaving(false); return; }
              if (isNaN(n) || n <= 0) { setError('Quantité par paquet invalide sur une ligne.'); setSaving(false); return; }
              if (isNaN(pp) || pp < 0) { setError('Prix du paquet invalide sur une ligne.'); setSaving(false); return; }
            } else {
              if (!it.description.trim()) { setError("Décris l'article pour chaque ligne « Achat personnalisé » (ex: BBQ)."); setSaving(false); return; }
              const q = parseFloat(it.quantitePerso);
              const pu = parseFloat(it.prixUnitairePerso);
              if (isNaN(q) || q <= 0) { setError('Quantité invalide sur une ligne personnalisée.'); setSaving(false); return; }
              if (isNaN(pu) || pu < 0) { setError('Prix invalide sur une ligne personnalisée.'); setSaving(false); return; }
            }
          }
          achat = await onSave({
            date,
            fournisseur: '',
            categorie,
            fournisseurCategorie: fournisseurCategorie || null,
            items: itemsState.map((it) => {
              if (it.mode === 'personnalise') {
                return {
                  description: it.description.trim(),
                  quantite: parseFloat(it.quantitePerso),
                  prixUnitaire: parseFloat(it.prixUnitairePerso),
                };
              }
              const nb = parseFloat(it.nbPaquets);
              const n = parseFloat(it.nbParPaquet);
              const pp = parseFloat(it.prixPaquet);
              return {
                productId: it.productId as number,
                quantite: nb * n,       // nb paquets × qté/paquet = nb articles total
                prixUnitaire: pp / n,   // prix/paquet ÷ qté/paquet = prix par article
              };
            }),
          });
          setCreatedAchat(achat);
        }

        if (receiptFile) {
          setUploadingReceipt(true);
          try {
            achat = await onUploadReceipt(achat.id, receiptFile);
          } catch (e: any) {
            setReceiptError(e.message ?? "L'achat est enregistré, mais l'envoi du ticket a échoué. Réessaie.");
            return;
          } finally {
            setUploadingReceipt(false);
          }
        }

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
            {initial ? 'Modifier un achat' : 'Saisir un achat'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Catégorie d'achat</label>
              <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={inputCls}>
                <option value="">Aucune</option>
                {achatCategories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Catégorie Magasin</label>
              <select value={fournisseurCategorie} onChange={(e) => setFournisseurCategorie(e.target.value)} className={inputCls}>
                <option value="">Aucune</option>
                {fournisseurCategories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 block">Articles</label>

            {isEdit && (
              <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Les articles ne sont plus modifiables une fois l'achat enregistré (impact sur le stock
                et le prix moyen). Pour changer les quantités/prix, supprime cet achat et recrée-le.
              </p>
            )}

            {itemsState.map((it) => {
              const suggestions = !isEdit && it.mode === 'produit' && it.productName.trim().length > 0
                ? products.filter((p) =>
                    p.name.toLowerCase().includes(it.productName.toLowerCase())
                  ).slice(0, 6)
                : [];
              return (
                <div key={it.uid} className="flex flex-col gap-2 bg-dark-bg/30 sm:bg-transparent rounded-lg p-2 sm:p-0 border border-gray-800/60 sm:border-0">
                  {!isEdit && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateItem(it.uid, { mode: 'produit' })}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          it.mode === 'produit'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-500 border border-transparent hover:text-gray-300'
                        }`}
                      >
                        Produit du site
                      </button>
                      <button
                        type="button"
                        onClick={() => updateItem(it.uid, { mode: 'personnalise', productId: null, productName: '' })}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          it.mode === 'personnalise'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-500 border border-transparent hover:text-gray-300'
                        }`}
                      >
                        Achat personnalisé
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                    {it.mode === 'produit' ? (
                      <>
                        <div className="relative flex-1 min-w-0 sm:min-w-[140px]">
                          <input
                            type="text"
                            placeholder="Rechercher un produit…"
                            value={it.productName}
                            disabled={isEdit}
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
                        <div className="grid grid-cols-3 gap-2 sm:contents">
                          <input
                              type="number" min="1" step="1" placeholder="Nb paquets"
                              value={it.nbPaquets}
                              disabled={isEdit}
                              onChange={(e) => updateItem(it.uid, { nbPaquets: e.target.value })}
                              className={`${inputCls} sm:w-24`}
                          />
                          <input
                              type="number" min="1" step="1" placeholder="Qté/paquet"
                              value={it.nbParPaquet}
                              disabled={isEdit}
                              onChange={(e) => updateItem(it.uid, { nbParPaquet: e.target.value })}
                              className={`${inputCls} sm:w-24`}
                          />
                          <input
                              type="number" min="0" step="0.01" placeholder="Prix paquet"
                              value={it.prixPaquet}
                              disabled={isEdit}
                              onChange={(e) => updateItem(it.uid, { prixPaquet: e.target.value })}
                              className={`${inputCls} sm:w-28`}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Décrire l'achat (ex: BBQ)…"
                          value={it.description}
                          disabled={isEdit}
                          onChange={(e) => updateItem(it.uid, { description: e.target.value })}
                          className={`${inputCls} flex-1 min-w-0 sm:min-w-[140px]`}
                        />
                        <div className="grid grid-cols-2 gap-2 sm:contents">
                          <input
                              type="number" min="1" step="1" placeholder="Quantité"
                              value={it.quantitePerso}
                              disabled={isEdit}
                              onChange={(e) => updateItem(it.uid, { quantitePerso: e.target.value })}
                              className={`${inputCls} sm:w-24`}
                          />
                          <input
                              type="number" min="0" step="0.01" placeholder="Prix unitaire"
                              value={it.prixUnitairePerso}
                              disabled={isEdit}
                              onChange={(e) => updateItem(it.uid, { prixUnitairePerso: e.target.value })}
                              className={`${inputCls} sm:w-28`}
                          />
                        </div>
                      </>
                    )}
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => removeItem(it.uid)}
                        disabled={itemsState.length === 1}
                        className="self-end sm:self-start p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!isEdit && (
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-emerald-400 text-xs hover:underline mt-1"
              >
                <Plus size={12} /> Ajouter un article
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 block">Ticket de caisse</label>

            {existingReceipt && !receiptFile ? (
              <div className="flex items-center justify-between bg-dark-bg/30 border border-gray-800/60 rounded-lg px-3 py-2">
                <button
                  type="button"
                  onClick={() => openSignedReceipt(existingReceipt.id)}
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:underline truncate min-w-0"
                >
                  <Receipt size={14} className="shrink-0" />
                  <span className="truncate">{existingReceipt.fileName}</span>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <label className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10 cursor-pointer" title="Remplacer">
                    <Pencil size={13} />
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!initial) return;
                      setDeletingReceipt(true);
                      setReceiptError('');
                      try {
                        await onDeleteReceipt(initial.id);
                        setExistingReceipt(null);
                      } catch (e: any) {
                        setReceiptError(e.message ?? 'Suppression du ticket impossible.');
                      } finally {
                        setDeletingReceipt(false);
                      }
                    }}
                    disabled={deletingReceipt}
                    title="Supprimer"
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {deletingReceipt ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            ) : receiptFile ? (
              <div className="flex items-center justify-between bg-dark-bg/30 border border-gray-800/60 rounded-lg px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-gray-300 truncate min-w-0">
                  <Receipt size={14} className="shrink-0 text-emerald-400" />
                  <span className="truncate">{receiptFile.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReceiptFile(null)}
                  disabled={uploadingReceipt}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 shrink-0 disabled:opacity-50"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border border-dashed border-gray-700 rounded-lg py-3 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors cursor-pointer">
                <Upload size={14} />
                Joindre une photo ou un PDF du ticket
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}

            {receiptError && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle size={12} /> {receiptError}
              </p>
            )}
          </div>

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
            onClick={handleSubmit} disabled={saving || uploadingReceipt}
            className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {(saving || uploadingReceipt) ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {createdAchat ? "Réessayer l'envoi du ticket" : initial ? 'Enregistrer' : 'Ajouter'}
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
  const [achatCategories, setAchatCategories] = useState<CategorieOption[]>([]);
  const [fournisseurCategories, setFournisseurCategories] = useState<CategorieOption[]>([]);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'dashboard' | 'achats' | 'stock' | 'tresorerie' | 'parametres'>('dashboard');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AchatFournisseur | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchJson<{ achatCategories: CategorieOption[]; fournisseurCategories: CategorieOption[] }>(
        '/admin/comptabilite/categories'
      );
      setAchatCategories(data.achatCategories);
      setFournisseurCategories(data.fournisseurCategories);
    } catch {
      setAchatCategories([]);
      setFournisseurCategories([]);
    }
  }, []);

  const loadStock = useCallback(async () => {
    const [y, m] = [
      parseInt(periode.debut.split('-')[0]),
      parseInt(periode.debut.split('-')[1]),
    ];
    try {
      const data = await fetchJson<StockData>(`/admin/stock?mois=${m}&annee=${y}`);
      setStockData(data);
    } catch {
      setStockData(null);
    }
  }, [periode.debut]);

  useEffect(() => { loadStock(); }, [loadStock]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => {
    fetchJson<ProductOption[]>('/products')
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  async function handleSaveAchat(data: {
    date: string;
    fournisseur: string;
    categorie: string;
    fournisseurCategorie: string | null;
    items: (
      | { productId: number; quantite: number; prixUnitaire: number }
      | { description: string; quantite: number; prixUnitaire: number }
    )[];
  }): Promise<AchatFournisseur> {
    let achat: AchatFournisseur;
    if (editTarget) {
      achat = await fetchJson<AchatFournisseur>(`/admin/comptabilite/achats/${editTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } else {
      achat = await fetchJson<AchatFournisseur>('/admin/comptabilite/achats', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
    await load();
    return achat;
  }

  async function handleUploadReceipt(achatId: number, file: File): Promise<AchatFournisseur> {
    // 1) Upload générique vers le bucket R2 privé (infra existante) : crée le
    //    fichier sur R2 + la ligne File, et renvoie son id.
    const formData = new FormData();
    formData.append('file', file);
    const uploaded = await fetchFormData<{ fileKey: string; fileId: number; fileName: string }>(
      '/upload/private/tickets-caisse',
      { method: 'POST', body: formData }
    );
    // 2) On lie ce fileId à l'achat (remplace l'éventuel ticket précédent).
    const achat = await fetchJson<AchatFournisseur>(`/admin/comptabilite/achats/${achatId}/receipt`, {
      method: 'PUT',
      body: JSON.stringify({ fileId: uploaded.fileId }),
    });
    await load();
    return achat;
  }

  async function handleDeleteReceipt(achatId: number): Promise<AchatFournisseur> {
    const achat = await fetchJson<AchatFournisseur>(`/admin/comptabilite/achats/${achatId}/receipt`, {
      method: 'DELETE',
    });
    await load();
    return achat;
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

  return (
    <div className="space-y-6">

    <div className="fixed top-0 left-0 md:left-[300px] right-0 z-30 bg-dark-bg/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Comptabilité</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Suivi financier de la supérette</p>
        </div>

        <div className="flex items-center gap-2 bg-dark-bg/60 border border-gray-800 rounded-xl px-3 py-2 self-start sm:self-auto">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-white capitalize min-w-[110px] sm:min-w-[140px] text-center">
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
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
        <div className="flex gap-1 bg-dark-bg/60 border border-gray-800 rounded-xl p-1 w-max sm:w-fit">
              {([
                ['dashboard', 'Vue d\'ensemble'],
                ['achats', 'Achats'],
                ['stock', 'Stock'],
                ['tresorerie', 'Trésorerie liquide'],
                ['parametres', 'Paramètres'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    tab === key
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          </div>{/* fin fixed header */}

          {/* Spacer pour compenser le header fixed */}
          <div className="h-[104px] sm:h-32" />

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading && !dashboard ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-emerald-400" />
        </div>
      ) : tab === 'dashboard' ? (
        <DashboardTab dashboard={dashboard} achatCategories={achatCategories} />
      ) : tab === 'achats' ? (
        <AchatsTab
          achats={achats}
          deletingId={deletingId}
          defaultDate={periode.fin}
          achatCategories={achatCategories}
          fournisseurCategories={fournisseurCategories}
          onAdd={() => { setEditTarget(null); setModalOpen(true); }}
          onEdit={(a) => { setEditTarget(a); setModalOpen(true); }}
          onDelete={handleDelete}
        />
      ) : tab === 'stock' ? (
        <StockTab
          data={stockData}
          mois={parseInt(periode.debut.split('-')[1])}
          annee={parseInt(periode.debut.split('-')[0])}
          onReload={loadStock}
        />
      ) : tab === 'tresorerie' ? (
        <TresoreriePanel
          mois={parseInt(periode.debut.split('-')[1])}
          annee={parseInt(periode.debut.split('-')[0])}
        />
      ) : (
        <ParametresTab
          achatCategories={achatCategories}
          fournisseurCategories={fournisseurCategories}
          onReload={loadCategories}
          onStockReload={loadStock}
        />
      )}

      {modalOpen && (
        <AchatModal
          initial={editTarget}
          defaultDate={periode.debut}
          products={products}
          achatCategories={achatCategories}
          fournisseurCategories={fournisseurCategories}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSave={handleSaveAchat}
          onUploadReceipt={handleUploadReceipt}
          onDeleteReceipt={handleDeleteReceipt}
        />
      )}
    </div>
  );
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────

function DashboardTab({ dashboard, achatCategories }: { dashboard: DashboardData | null; achatCategories: CategorieOption[] }) {
  if (!dashboard) return null;
  const { kpis, evolution, topProduits, achatsParCategorie, repartitionPaiements } = dashboard;
  const resultatPositif = kpis.resultatNet >= 0;

  return (
    <div className="space-y-6">
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
          label="Gains net"
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
          label="Taux de marge"
          value={pct(kpis.tauxMarque)}
          sub={`Taux de marge : ${pct(kpis.tauxMarge)}`}
          icon={<BarChart3 size={15} className="text-blue-400" />}
          color="bg-blue-500/20"
          positive={kpis.tauxMarque > 20}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
             <div className="bg-dark-bg/40 border border-gray-800/60 rounded-xl p-4">
               <p className="text-xs text-gray-500 mb-1">Recettes inscriptions</p>
               <p className="text-lg font-semibold text-cyan-400">{eur(kpis.totalInscriptions)}</p>
             </div>
           </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  formatter={(v: number | undefined) => [eur(v ?? 0), 'CA']}
                />
                <Area type="monotone" dataKey="ca" stroke="#1D9E75" strokeWidth={2}
                  fill="url(#caGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-4">Top produits par CA</p>
          {topProduits.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">Aucune vente</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topProduits}
                layout="vertical"
                margin={{ top: 0, right: 4, left: 4, bottom: 0 }}
              >
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
                  cursor={false}
                  contentStyle={{ background: '#0f1318', border: '1px solid #1f2937', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#9ca3af' }}
                  formatter={(v: number | undefined) => [eur(v ?? 0), 'CA']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                />
                <Bar dataKey="ca" radius={[0, 4, 4, 0]}>
                  {topProduits.map((_, i) => (
                    <Cell key={i} fill={`hsl(${160 - i * 8}, 60%, ${45 - i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  const pctVal = total > 0 ? (item.montant / total) * 100 : 0;
                  const color = getCategorieColor(item.categorie);
                  const label = achatCategories.find((c) => c.value === item.categorie)?.label ?? item.categorie;
                  return (
                    <div key={item.categorie}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color }} className="font-medium">{label}</span>
                        <span className="text-gray-400">{eur(item.montant)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pctVal}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

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
  achatCategories: CategorieOption[];
  fournisseurCategories: CategorieOption[];
  onAdd: () => void;
  onEdit: (a: AchatFournisseur) => void;
  onDelete: (id: number) => Promise<void>;
}

function AchatsTab({ achats, deletingId, achatCategories, fournisseurCategories, onAdd, onEdit, onDelete }: AchatsTabProps) {
  const total = achats.reduce((s, a) => s + a.montant, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {achats.length} entrée{achats.length !== 1 ? 's' : ''} ·{' '}
          <span className="text-white font-medium">{eur(total)}</span> total
        </p>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors"
        >
          <Plus size={15} /> Saisir un achat
        </button>
      </div>

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
        <div className="bg-dark-bg/60 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Magasin</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Articles</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Prix unitaire</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">nb articles</th>
                <th className="text-right px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {achats.map((a, i) => {
                const color = getCategorieColor(a.categorie);
                const label = achatCategories.find((c) => c.value === a.categorie)?.label ?? a.categorie;
                const magasinLabel = a.fournisseurCategorie
                  ? fournisseurCategories.find((c) => c.value === a.fournisseurCategorie)?.label ?? a.fournisseurCategorie
                  : null;
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors ${
                      i === achats.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {shortDate(a.date)}
                        {a.receiptFile && (
                          <button
                            type="button"
                            title="Voir le ticket de caisse"
                            onClick={(e) => { e.stopPropagation(); openSignedReceipt(a.receiptFile!.id); }}
                            className="text-gray-600 hover:text-emerald-400 transition-colors"
                          >
                            <Paperclip size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {magasinLabel ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: color + '22', color }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                      {a.items.map((it) => (
                        <div key={it.id}>{it.product?.name ?? it.description ?? '—'}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {a.items.map((it) => (
                        <div key={it.id} className="text-gray-400">{eur(it.prixUnitaire)}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {a.items.map((it) => (
                        <div key={it.id} className="text-white/70">{it.quantite}</div>
                      ))}
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
                <td colSpan={8} className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider">
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

// ─── Helpers stock ────────────────────────────────────────────────────────────

function stockBadge(stock: number) {
  if (stock === 0) return { label: 'Rupture', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
  if (stock <= 3) return { label: 'Faible', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
  return { label: 'OK', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
}

// ─── Stock tab ────────────────────────────────────────────────────────────────

    interface StockTabProps {
      data: StockData | null;
      mois: number;
      annee: number;
      onReload: () => Promise<void>;
    }

    function StockTab({ data, mois, annee, onReload }: StockTabProps) {
      const [search, setSearch] = useState('');
      const [savingId, setSavingId] = useState<number | null>(null);
      const [editingInventaireId, setEditingInventaireId] = useState<number | null>(null);
      const [editInventaireValue, setEditInventaireValue] = useState('');

      // Écart détecté en attente de confirmation admin avant sauvegarde
      const [pendingEcart, setPendingEcart] = useState<{
        productId: number;
        productName: string;
        stockPresume: number;
        inventaireSaisi: number;
      } | null>(null);

      // Régularisation en cours après confirmation de l'écart
      const [regularizing, setRegularizing] = useState(false);
      const [regularizeError, setRegularizeError] = useState('');

      // Le mois est-il passé (terminé) ?
      const stockDebutLabel = 'Stock présumé début de mois';

      // Sauvegarde directe de l'inventaire, sans régularisation (les valeurs collent déjà)
      async function saveInventaire(productId: number, quantite: number) {
        setSavingId(productId);
        try {
          await fetchJson(`/admin/stock/${productId}/inventaire`, {
            method: 'PUT',
            body: JSON.stringify({ mois, annee, quantite }),
          });
          await onReload();
        } finally {
          setSavingId(null);
          setEditingInventaireId(null);
        }
      }

      async function commitInventaire(productId: number) {
        const quantite = parseInt(editInventaireValue);
        if (isNaN(quantite) || quantite < 0) { setEditingInventaireId(null); return; }

        const item = (data?.items ?? []).find((i) => i.productId === productId);
        const stockDebut = item?.stockDebut ?? 0;

        if (quantite !== stockDebut) {
          // Écart entre inventaire saisi et stock présumé : on demande confirmation
          // avant d'enregistrer quoi que ce soit.
          setPendingEcart({
            productId,
            productName: item?.name ?? '',
            stockPresume: stockDebut,
            inventaireSaisi: quantite,
          });
          return;
        }

        await saveInventaire(productId, quantite);
      }

      // L'admin confirme que l'inventaire saisi est correct malgré l'écart :
      // on enregistre l'inventaire tel quel (sans toucher au stock présumé).
      async function confirmEcartSansRegularisation() {
        if (!pendingEcart) return;
        await saveInventaire(pendingEcart.productId, pendingEcart.inventaireSaisi);
        setPendingEcart(null);
      }

      // L'admin demande la régularisation : une commande d'achat (qty = écart,
      // peut être négative) est passée par le user système dédié pour que le
      // stock présumé revienne s'aligner sur l'inventaire réel.
      async function regulariser() {
        if (!pendingEcart) return;
        setRegularizing(true);
        setRegularizeError('');
        try {
          await fetchJson(`/admin/stock/${pendingEcart.productId}/regulariser`, {
            method: 'POST',
            body: JSON.stringify({
              mois,
              annee,
              inventaire: pendingEcart.inventaireSaisi,
            }),
          });
          await onReload();
          setPendingEcart(null);
        } catch (e: any) {
          setRegularizeError(e.message ?? 'Erreur lors de la régularisation.');
        } finally {
          setRegularizing(false);
        }
      }

      function cancelEcart() {
        setPendingEcart(null);
        setRegularizeError('');
        setEditingInventaireId(null);
      }

      const filtered = (data?.items ?? []).filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.categorie ?? '').toLowerCase().includes(search.toLowerCase())
      );

      const kpis = data?.kpis;

      return (
        <div className="space-y-4">

          {kpis && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Valeur stock</span>
                <p className="text-2xl font-bold text-white">{eur(kpis.valeurTotale)}</p>
              </div>
              <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Produits actifs</span>
                <p className="text-2xl font-bold text-white">{kpis.nbProduits}</p>
              </div>
              <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Stock faible</span>
                <p className="text-2xl font-bold text-amber-400">{kpis.nbFaible}</p>
              </div>
              <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Rupture</span>
                <p className="text-2xl font-bold text-red-400">{kpis.nbRupture}</p>
              </div>
            </div>
          )}

          <input
            type="text"
            placeholder="Rechercher un produit ou une catégorie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm bg-dark-bg/60 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />

          {!data ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="bg-dark-bg/60 border border-gray-800 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Produit</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Catégorie</th>
                    <th className="text-center px-4 py-3 font-medium hidden md:table-cell">Ventes</th>
                    <th className="text-center px-4 py-3 font-medium hidden md:table-cell">Achats</th>
                    <th className="text-center px-4 py-3 font-medium">{stockDebutLabel}</th>
                    <th className="text-center px-4 py-3 font-medium">
                    Inventaire
                    <span className="block text-[10px] normal-case font-normal text-gray-600">compté le 1er du mois</span>
                    </th>
                    <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Prix achat</th>
                    <th className="text-right px-4 py-3 font-medium">Valeur</th>
                    <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">État</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-gray-600">
                        Aucun produit trouvé.
                      </td>
                    </tr>
                  ) : filtered.map((item, i) => {
                    const badge = stockBadge(item.stockPresume);
                    const isSaving = savingId === item.productId;
                    // Tant que l'inventaire n'a pas été saisi pour ce mois, il affiche
                    // par défaut la valeur du stock présumé.
                    const inventaireAffiche = item.inventaire ?? item.stockDebut;
                    const inventaireSaisiCeMois = item.inventaire !== null && item.inventaire !== undefined;
                    const ecartNonRegularise = inventaireSaisiCeMois && item.inventaire !== item.stockDebut;
                    const inventaireConfirme = inventaireSaisiCeMois && item.inventaire === item.stockDebut;

                    return (
                      <tr
                        key={item.productId}
                        className={`border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors ${
                          i === filtered.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                          {item.categorie ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-center text-red-400 hidden md:table-cell">
                          {item.ventes > 0 ? `−${item.ventes}` : '—'}
                        </td>

                        <td className="px-4 py-3 text-center text-emerald-400 hidden md:table-cell">
                          {item.achats > 0 ? `+${item.achats}` : '—'}
                        </td>

                        <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-300">
                        {item.stockDebut}
                        </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {isSaving ? (
                            <Loader2 size={14} className="animate-spin text-emerald-400 mx-auto" />
                          ) : (
                            <div className="relative flex items-center justify-center w-full">
                              <input
                                type="number"
                                min="0"
                                value={editingInventaireId === item.productId ? editInventaireValue : inventaireAffiche}
                                onChange={(e) => { setEditingInventaireId(item.productId); setEditInventaireValue(e.target.value); }}
                                onBlur={() => editingInventaireId === item.productId && commitInventaire(item.productId)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInventaire(item.productId);
                                  if (e.key === 'Escape') setEditingInventaireId(null);
                                }}
                                className={`w-16 h-7 bg-transparent border rounded text-center text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  ecartNonRegularise
                                    ? 'border-amber-500/60 text-amber-300 focus:border-amber-400'
                                    : inventaireConfirme
                                      ? 'border-emerald-500/60 text-emerald-300 focus:border-emerald-400'
                                      : 'border-gray-700 text-white focus:border-emerald-500/60'
                                }`}
                              />
                              {ecartNonRegularise && (
                                 <AlertCircle size={13} className="text-amber-400 absolute left-[calc(50%+2.25rem+4px)]" />
                              )}
                              {inventaireConfirme && (
                                  <CheckCircle size={13} className="text-emerald-400 absolute left-[calc(50%+2.25rem+4px)]" />
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-gray-400 hidden lg:table-cell">
                          {item.costPrice > 0 ? eur(item.costPrice) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-white font-semibold">
                          {item.valeur > 0 ? eur(item.valeur) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badge.bg} ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {data && (
                  <tfoot>
                    <tr className="border-t border-gray-800 bg-dark-bg/40">
                      <td colSpan={8} className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider">
                        Valeur totale
                      </td>
                      <td className="px-4 py-3 text-right text-white font-bold">
                        {eur(data.kpis.valeurTotale)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {pendingEcart && (
            <EcartInventaireModal
              ecart={pendingEcart}
              loading={regularizing}
              error={regularizeError}
              onConfirmSansRegularisation={confirmEcartSansRegularisation}
              onRegulariser={regulariser}
              onCancel={cancelEcart}
            />
          )}
        </div>
      );
    }

    function EcartInventaireModal({
      ecart,
      loading,
      error,
      onConfirmSansRegularisation,
      onRegulariser,
      onCancel,
    }: {
      ecart: { productName: string; stockPresume: number; inventaireSaisi: number };
      loading: boolean;
      error: string;
      onConfirmSansRegularisation: () => void;
      onRegulariser: () => void;
      onCancel: () => void;
    }) {
      const diff = ecart.inventaireSaisi - ecart.stockPresume;
      const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-dark-bg border border-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <AlertCircle size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium">Écart détecté</p>
                <p className="text-sm text-gray-400 mt-1">
                  Pour <span className="text-white">{ecart.productName}</span>, l'inventaire saisi
                  ({ecart.inventaireSaisi}) ne correspond pas au stock présumé ({ecart.stockPresume}),
                  soit un écart de <span className={diff > 0 ? 'text-emerald-400' : 'text-red-400'}>{diffLabel}</span>.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Vérifiez d'abord que le compte d'inventaire est correct. Si vous êtes certain du chiffre saisi,
              vous pouvez régulariser le stock présumé : une commande d'ajustement sera passée automatiquement
              pour faire correspondre les deux valeurs.
            </p>

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/[0.03] transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onConfirmSansRegularisation}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/[0.03] transition-colors disabled:opacity-50"
              >
                Enregistrer quand même
              </button>
              <button
                onClick={onRegulariser}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Régulariser
              </button>
            </div>
          </div>
        </div>
      );
    }
// ─── Trésorerie panel ─────────────────────────────────────────────────────────
interface HistoriqueCaisseEntry {
  id: number;
  solde: number;
  userName: string | null;
  createdAt: string;
}

function TresoreriePanel({ mois, annee }: { mois: number; annee: number }) {
  // --- Caisse ---
  const [soldeCaisse, setSoldeCaisse] = useState<number | null>(null);
  const [soldeCaisseInput, setSoldeCaisseInput] = useState('');
  const [caisseMode, setCaisseMode] = useState<'view' | 'edit'>('view');
  const [caisseSaving, setCaisseSaving] = useState(false);
  const [caisseError, setCaisseError] = useState('');
  const [caisseSuccess, setCaisseSuccess] = useState(false);
  const [reportMoisPrec, setReportMoisPrec] = useState<number | null>(null);
  const [soldeCaisseUpdatedAt, setSoldeCaisseUpdatedAt] = useState<string | null>(null);
  const [soldeCaisseUpdatedByName, setSoldeCaisseUpdatedByName] = useState<string | null>(null);
  const [historiqueCaisse, setHistoriqueCaisse] = useState<HistoriqueCaisseEntry[]>([]);

  // --- Dépôts banque ---
  const [depots, setDepots] = useState<{ id: number; montant: number; date: string }[]>([]);
  const [depotMontant, setDepotMontant] = useState('');
  const [depotSaving, setDepotSaving] = useState(false);
  const [depotError, setDepotError] = useState('');
  const [depotSuccess, setDepotSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editMontant, setEditMontant] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [loading, setLoading] = useState(false);

  const inputCls =
    'bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors';

  async function fetchData() {
    setLoading(true);
    try {
      const d = await fetchJson<{
        soldeCaisse: number | null;
        soldeInitial: number;
        soldeCaisseUpdatedAt: string | null;
        soldeCaisseUpdatedByName: string | null;
        historiqueCaisse: HistoriqueCaisseEntry[];
        mouvements: { id: number; type: string; montant: number; date: string }[];
      }>(`/admin/tresorerie/solde?mois=${mois}&annee=${annee}`);

      setSoldeCaisse(d.soldeCaisse ?? null);
      setSoldeCaisseInput(d.soldeCaisse != null ? String(d.soldeCaisse) : '');
      setCaisseMode(d.soldeCaisse != null ? 'view' : 'edit');
      setReportMoisPrec(d.soldeInitial);
      setSoldeCaisseUpdatedAt(d.soldeCaisseUpdatedAt);
      setSoldeCaisseUpdatedByName(d.soldeCaisseUpdatedByName);
      setHistoriqueCaisse(d.historiqueCaisse ?? []);
      setDepots(d.mouvements.filter((m) => m.type === 'DEPOT_BANQUE').map(({ id, montant, date }) => ({ id, montant, date })));
    } catch (e: any) {
      setCaisseError(e.message ?? 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJson('/admin/tresorerie/cloturer', {
      method: 'POST',
      body: JSON.stringify({ mois: mois - 1 === 0 ? 12 : mois - 1, annee: mois - 1 === 0 ? annee - 1 : annee }),
    }).catch(() => {});
    fetchData();
  }, [mois, annee]);

  // --- Caisse handlers ---
  async function handleCaisseSave() {
    const val = parseFloat(soldeCaisseInput);
    if (isNaN(val) || val < 0) return;
    setCaisseSaving(true);
    setCaisseError('');
    setCaisseSuccess(false);
    try {
      await fetchJson('/admin/tresorerie/caisse', {
        method: 'POST',
        body: JSON.stringify({ mois, annee, solde: val }),
      });
      // Recharge solde, "mis à jour par" et historique depuis le back
      await fetchData();
      setCaisseSuccess(true);
      setTimeout(() => setCaisseSuccess(false), 3000);
    } catch (e: any) {
      setCaisseError(e.message ?? 'Erreur lors de la saisie.');
    } finally {
      setCaisseSaving(false);
    }
  }

  // --- Dépôt handlers ---
  async function handleDepotAdd() {
    const val = parseFloat(depotMontant);
    if (isNaN(val) || val <= 0) return;
    setDepotSaving(true);
    setDepotError('');
    setDepotSuccess(false);
    try {
      await fetchJson('/admin/tresorerie/mouvement', {
        method: 'POST',
        body: JSON.stringify({ type: 'DEPOT_BANQUE', montant: val, mois, annee }),
      });
      setDepotMontant('');
      setDepotSuccess(true);
      await fetchData();
      setTimeout(() => setDepotSuccess(false), 3000);
    } catch (e: any) {
      setDepotError(e.message ?? 'Erreur lors de la saisie.');
    } finally {
      setDepotSaving(false);
    }
  }

  async function handleDepotDelete(id: number) {
    setDeleteId(id);
    try {
      await fetchJson(`/admin/tresorerie/mouvement/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (e: any) {
      setDepotError(e.message ?? 'Erreur lors de la suppression.');
    } finally {
      setDeleteId(null);
    }
  }

  function startEdit(d: { id: number; montant: number }) {
    setEditId(d.id);
    setEditMontant(String(d.montant));
  }

  function cancelEdit() {
    setEditId(null);
    setEditMontant('');
  }

  async function handleEditSave(id: number) {
    const val = parseFloat(editMontant);
    if (isNaN(val) || val <= 0) return;
    setEditSaving(true);
    try {
      await fetchJson(`/admin/tresorerie/mouvement/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ montant: val }),
      });
      cancelEdit();
      await fetchData();
    } catch (e: any) {
      setDepotError(e.message ?? 'Erreur lors de la modification.');
    } finally {
      setEditSaving(false);
    }
  }

  const totalDepots = depots.reduce((s, d) => s + d.montant, 0);
  const ecart = soldeCaisse != null && reportMoisPrec != null ? soldeCaisse - reportMoisPrec : null;

  return (
    <div className="space-y-5">

      {/* ── SECTION 1 : Caisse ── */}
      <div className="bg-dark-bg/60 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Solde de caisse</p>
            <p className="text-xs text-gray-500">Saisie unique mensuelle — montant total constaté en caisse</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-bg border border-gray-800 rounded-xl p-3 space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Report mois préc.</span>
              {loading ? (
                <Loader2 size={14} className="animate-spin text-gray-500" />
              ) : (
                <p className="text-lg font-bold text-gray-300">{eur(reportMoisPrec ?? 0)}</p>
              )}
            </div>
            <div className="bg-dark-bg border border-gray-800 rounded-xl p-3 space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Écart constaté</span>
              {loading || ecart === null ? (
                <p className="text-lg font-bold text-gray-600">—</p>
              ) : (
                <p className={`text-lg font-bold ${ecart >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {ecart >= 0 ? '+' : ''}{eur(ecart)}
                </p>
              )}
            </div>
          </div>

          {/* Valeur enregistrée */}
          {caisseMode === 'view' && soldeCaisse != null && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-bg border border-gray-800 rounded-xl px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-xs text-gray-500">Solde saisi ce mois</p>
                <p className="text-2xl font-bold text-emerald-400">{eur(soldeCaisse)}</p>
                {soldeCaisseUpdatedAt && (
                  <p className="text-[11px] text-gray-600">
                    Dernière mise à jour le{' '}
                    {new Date(soldeCaisseUpdatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                    {soldeCaisseUpdatedByName ? ` par ${soldeCaisseUpdatedByName}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setCaisseMode('edit')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-xs transition-colors self-start sm:self-auto"
              >
                <Pencil size={12} /> Modifier
              </button>
            </div>
          )}

          {/* Formulaire saisie / édition */}
          {(caisseMode === 'edit' || soldeCaisse === null) && (
            <div className="space-y-3">
              {soldeCaisse === null && (
                <p className="text-xs text-gray-500">Aucun relevé de caisse ce mois-ci.</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-xs text-gray-500">Solde total constaté (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={soldeCaisseInput}
                    onChange={(e) => setSoldeCaisseInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCaisseSave(); }}
                    className={`${inputCls} w-full sm:w-36`}
                    autoFocus={caisseMode === 'edit'}
                  />
                </div>
                <button
                  onClick={handleCaisseSave}
                  disabled={caisseSaving || !soldeCaisseInput || parseFloat(soldeCaisseInput) < 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  {caisseSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Enregistrer
                </button>
                {caisseMode === 'edit' && soldeCaisse != null && (
                  <button
                    onClick={() => { setCaisseMode('view'); setSoldeCaisseInput(String(soldeCaisse)); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-500 hover:text-white rounded-lg text-sm transition-colors w-full sm:w-auto"
                  >
                    <X size={14} /> Annuler
                  </button>
                )}
              </div>
              {caisseSuccess && (
                <p className="text-emerald-400 text-xs flex items-center gap-1">
                  <Check size={12} /> Solde de caisse enregistré.
                </p>
              )}
              {caisseError && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle size={12} /> {caisseError}
                </p>
              )}
            </div>
          )}

          {/* Historique des relevés de caisse */}
          {historiqueCaisse.length > 0 && (
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-800">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Historique des relevés de caisse
                </p>
              </div>
              <ul className="divide-y divide-gray-800/50">
                {historiqueCaisse.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="text-gray-400 min-w-0 truncate">
                      {new Date(h.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {h.userName ? ` · ${h.userName}` : ''}
                    </span>
                    <span className="font-medium text-emerald-400 shrink-0">{eur(h.solde)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2 : Dépôts banque ── */}
      <div className="bg-dark-bg/60 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Euro size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Dépôts banque</p>
            <p className="text-xs text-gray-500">Enregistrer les virements espèces vers le compte bancaire</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Total */}
          <div className="bg-dark-bg border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Total déposé ce mois</span>
            <p className="text-2xl font-bold text-blue-400">{eur(totalDepots)}</p>
          </div>

          {/* Formulaire ajout */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-xs text-gray-500">Montant à déposer (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={depotMontant}
                  onChange={(e) => setDepotMontant(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDepotAdd(); }}
                  className={`${inputCls} w-full sm:w-36`}
                />
              </div>
              <button
                onClick={handleDepotAdd}
                disabled={depotSaving || !depotMontant || parseFloat(depotMontant) <= 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {depotSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Ajouter un dépôt
              </button>
            </div>
            {depotSuccess && (
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <Check size={12} /> Dépôt enregistré.
              </p>
            )}
            {depotError && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle size={12} /> {depotError}
              </p>
            )}
          </div>

          {/* Historique */}
          <div className="border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-800">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Historique du mois</p>
            </div>
            {depots.length === 0 ? (
              <p className="text-gray-600 text-sm px-4 py-5">Aucun dépôt ce mois-ci.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[380px]">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Date</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Montant</th>
                      <th className="px-4 py-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {depots.map((d) => (
                      <tr key={d.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3 text-gray-400">{shortDate(d.date)}</td>

                        {/* Montant éditable inline */}
                        <td className="px-4 py-3 text-right font-medium">
                          {editId === d.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editMontant}
                                onChange={(e) => setEditMontant(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditSave(d.id);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                                className="w-24 bg-dark-bg border border-blue-500/40 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => handleEditSave(d.id)}
                                disabled={editSaving}
                                className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                                title="Valider"
                              >
                                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-500 hover:text-gray-300 transition-colors"
                                title="Annuler"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-blue-400">-{eur(d.montant)}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          {editId !== d.id && (
                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(d)}
                                className="text-gray-500 hover:text-white transition-colors"
                                title="Modifier"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDepotDelete(d.id)}
                                disabled={deleteId === d.id}
                                className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Supprimer"
                              >
                                {deleteId === d.id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Trash2 size={13} />}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Paramètres tab ───────────────────────────────────────────────────────────

interface ParametresTabProps {
  achatCategories: CategorieOption[];
  fournisseurCategories: CategorieOption[];
  onReload: () => Promise<void>;
  onStockReload: () => Promise<void>;
}




function CategorieListEditor({
  title,
  categories,
  onAdd,
  onRemove,
}: {
  title: string;
  categories: CategorieOption[];
  onAdd: (label: string) => Promise<void>;
  onRemove: (value: string) => Promise<void>;
}) {
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingValue, setRemovingValue] = useState<string | null>(null);
  const [error, setError] = useState('');

  const inputCls =
    'flex-1 bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors';

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onAdd(newLabel.trim());
      setNewLabel('');
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(value: string) {
    setRemovingValue(value);
    setError('');
    try {
      await onRemove(value);
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors de la suppression.');
    } finally {
      setRemovingValue(null);
    }
  }

  return (
    <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-5">
      <p className="text-sm font-medium text-white mb-4">{title}</p>

      {categories.length === 0 ? (
        <p className="text-gray-600 text-sm mb-3">Aucune catégorie pour le moment.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {categories.map((c) => (
            <div
              key={c.value}
              className="flex items-center justify-between bg-dark-bg/40 border border-gray-800/60 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getCategorieColor(c.value) }}
                />
                <span className="text-sm text-gray-200 truncate">{c.label}</span>
              </div>
              <button
                onClick={() => handleRemove(c.value)}
                disabled={removingValue === c.value}
                className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-50 shrink-0"
              >
                {removingValue === c.value
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Trash2 size={13} />
                }
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Nouvelle catégorie…"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          className={inputCls}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newLabel.trim()}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1 mt-2">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function ParametresTab({ achatCategories, fournisseurCategories, onReload, onStockReload }: ParametresTabProps) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoadingProducts(true);
    fetchJson<ProductOption[]>('/products')
      .then((data) => {
        // Normalise : si suiviStock absent de la réponse, on considère true par défaut
        setProducts(data.map((p) => ({ ...p, suiviStock: p.suiviStock !== false })));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  async function toggleSuiviStock(product: ProductOption) {
    const newValue = !product.suiviStock;
    // Optimiste : mise à jour locale immédiate
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, suiviStock: newValue } : p))
    );
    setTogglingId(product.id);
    try {
      await fetchJson(`/products/${product.id}/suivi-stock`, {
        method: 'PATCH',
        body: JSON.stringify({ suiviStock: newValue }),
      });
      await onStockReload();
    } catch {
      // Rollback en cas d'erreur
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, suiviStock: product.suiviStock } : p))
      );
    } finally {
      setTogglingId(null);
    }
  }

  // Fonctions catégories — implémentations réelles
  async function addAchat(label: string) {
    await fetchJson('/admin/comptabilite/categories/achat', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
    await onReload();
  }

  async function removeAchat(value: string) {
    await fetchJson(`/admin/comptabilite/categories/achat/${encodeURIComponent(value)}`, {
      method: 'DELETE',
    });
    await onReload();
  }

  async function addFournisseur(label: string) {
    await fetchJson('/admin/comptabilite/categories/fournisseur', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
    await onReload();
  }

  async function removeFournisseur(value: string) {
    await fetchJson(`/admin/comptabilite/categories/fournisseur/${encodeURIComponent(value)}`, {
      method: 'DELETE',
    });
    await onReload();
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categorie ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const exclus = filtered.filter((p) => !p.suiviStock);
  const actifs = filtered.filter((p) => p.suiviStock);

  return (
    <div className="space-y-4">

      {/* ── Catégories en premier ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategorieListEditor
          title="Catégories d'achat"
          categories={achatCategories}
          onAdd={addAchat}
          onRemove={removeAchat}
        />
        <CategorieListEditor
          title="Catégories de fournisseur"
          categories={fournisseurCategories}
          onAdd={addFournisseur}
          onRemove={removeFournisseur}
        />
      </div>

      {/* ── Suivi de stock ── */}
      <div className="bg-dark-bg/60 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-white">Produits suivis en stock</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Les produits exclus n'apparaissent plus dans l'onglet Stock.
          </p>
        </div>

        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
        />

        {loadingProducts ? (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="animate-spin text-emerald-400" />
          </div>
        ) : (
          <div className="space-y-4">

            {exclus.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-amber-400/80 uppercase tracking-wider font-medium">
                  Exclus du suivi ({exclus.length})
                </p>
                {exclus.map((p) => (
                  <ProductSuiviRow
                    key={p.id}
                    product={p}
                    toggling={togglingId === p.id}
                    onToggle={toggleSuiviStock}
                  />
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {exclus.length > 0 && (
                <p className="text-xs text-emerald-400/80 uppercase tracking-wider font-medium">
                  Suivis ({actifs.length})
                </p>
              )}
              {actifs.length === 0 ? (
                <p className="text-gray-600 text-sm">Aucun produit dans le suivi.</p>
              ) : (
                actifs.map((p) => (
                  <ProductSuiviRow
                    key={p.id}
                    product={p}
                    toggling={togglingId === p.id}
                    onToggle={toggleSuiviStock}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductSuiviRow({
  product,
  toggling,
  onToggle,
}: {
  product: ProductOption;
  toggling: boolean;
  onToggle: (p: ProductOption) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors ${
        product.suiviStock
          ? 'bg-dark-bg/40 border-gray-800/60'
          : 'bg-amber-500/5 border-amber-500/20'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-sm truncate ${
            product.suiviStock ? 'text-gray-200' : 'text-gray-500 line-through'
          }`}
        >
          {product.name}
        </span>
        {product.categorie && (
          <span className="text-xs text-gray-600 hidden sm:inline shrink-0">
            {product.categorie}
          </span>
        )}
      </div>
      <button
        onClick={() => onToggle(product)}
        disabled={toggling}
        title={product.suiviStock ? 'Exclure du suivi' : 'Réintégrer dans le suivi'}
        className={`shrink-0 ml-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
          product.suiviStock
            ? 'text-gray-500 border-gray-700 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10'
            : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
        }`}
      >
        {toggling ? (
          <Loader2 size={12} className="animate-spin" />
        ) : product.suiviStock ? (
          <><X size={12} /> Exclure</>
        ) : (
          <><Check size={12} /> Réintégrer</>
        )}
      </button>
    </div>
  );
}