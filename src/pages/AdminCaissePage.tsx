import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNotification } from '../context/NotificationContext';
import { getAllProducts, type Product } from '../api/products';
import { fetchJson } from '../api/client';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, Receipt, X,
  CheckCircle, ChevronRight, History, Undo2, Tag, Package,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface SessionOrder {
  id: number;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  createdAt: Date;
  cancelled?: boolean;
}

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

const ConfirmationOverlay: React.FC<{ order: { id: number; total: number }; onDone: () => void }> = ({ order, onDone }) => {
  const [progress, setProgress] = useState(0);
  const DURATION = 2500;

  useEffect(() => {
    const start = Date.now();
    const raf = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(raf);
      else onDone();
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [onDone, DURATION]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm rounded-2xl">
      <div className="relative w-20 h-20 mb-5">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(119,241,190,0.15)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="rgb(119,241,190)" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <CheckCircle size={32} className="text-accent-mint" />
        </div>
      </div>
      <p className="text-xl font-black text-white mb-1">Encaissé !</p>
      <p className="text-sm text-slate-400 mb-1">Commande <span className="text-accent-mint font-bold">#{order.id}</span></p>
      <p className="text-2xl font-black text-white">{fmt(order.total)} €</p>
      <button
        onClick={onDone}
        className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors"
      >
        Passer maintenant →
      </button>
    </div>
  );
};

const SessionHistory: React.FC<{
  orders: SessionOrder[];
  onCancel: (id: number) => void;
  cancelling: number | null;
}> = ({ orders, onCancel, cancelling }) => {
  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-slate-700 text-xs text-center">
      <History size={22} className="mb-2 opacity-40" />
      Aucune commande cette session
    </div>
  );

  return (
    <div className="space-y-2">
      {[...orders].reverse().map((o, idx) => (
        <div
          key={o.id}
          className={`rounded-xl border p-3 transition-all ${
            o.cancelled
              ? 'border-slate-700/20 bg-slate-800/10 opacity-40'
              : 'border-slate-700/30 bg-slate-800/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">#{o.id}</span>
              {o.cancelled && (
                <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">Annulée</span>
              )}
              {idx === 0 && !o.cancelled && (
                <span className="text-[9px] font-bold text-accent-mint bg-accent-mint/10 px-1.5 py-0.5 rounded-full">Dernière</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{fmt(o.total)} €</span>
              {idx === 0 && !o.cancelled && (
                <button
                  onClick={() => onCancel(o.id)}
                  disabled={cancelling === o.id}
                  title="Annuler cette commande"
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                >
                  {cancelling === o.id
                    ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <Undo2 size={12} />}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {o.items.map((item, i) => (
              <span key={i} className="text-[10px] text-slate-500 bg-slate-700/30 px-1.5 py-0.5 rounded-full">
                {item.quantity}× {item.name}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-slate-700 mt-1.5">
            {o.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      ))}
    </div>
  );
};

const AdminCaissePage: React.FC = () => {
  useDocumentTitle('Admin — Caisse');
  const { addNotification } = useNotification();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [salesScores, setSalesScores] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<{ id: number; total: number } | null>(null);
  const [sessionOrders, setSessionOrders] = useState<SessionOrder[]>([]);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart' | 'history'>('products');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllProducts()
      .then(data => setProducts(data.filter(p => p.active)))
      .catch(() => addNotification('error', 'Impossible de charger les produits'))
      .finally(() => setLoading(false));

    fetchJson<Array<{ paymentStatus: string; items: Array<{ productId: number; quantity: number; refundedQuantity: number }> }>>('/orders')
      .then(orders => {
        const map: Record<string, number> = {};
        orders
          .filter(o => o.paymentStatus === 'PAID')
          .forEach(order => {
            order.items?.forEach(item => {
              const id = String(item.productId);
              const sold = item.quantity - (item.refundedQuantity ?? 0);
              if (sold > 0) map[id] = (map[id] ?? 0) + sold;
            });
          });
        setSalesScores(map);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const sessionSalesScores = React.useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    sessionOrders.filter(o => !o.cancelled).forEach(o => {
      o.items.forEach(item => {
        const product = products.find(p => p.name === item.name);
        if (product) map[product.id] = (map[product.id] ?? 0) + item.quantity;
      });
    });
    return map;
  }, [sessionOrders, products]);

  const effectiveSalesScores = React.useMemo(() => {
    const merged = { ...salesScores };
    Object.entries(sessionSalesScores).forEach(([id, count]) => {
      merged[id] = (merged[id] ?? 0) + count;
    });
    return merged;
  }, [salesScores, sessionSalesScores]);

  const categories = React.useMemo(() => {
    const seen = new Map<number, string>();
    products.forEach(p => {
      const cat = p.subcategory?.category;
      if (cat?.id && cat?.name) seen.set(cat.id, cat.name);
    });
    return Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));
  }, [products]);

  const filtered = React.useMemo(() => {
    let list = products;
    if (selectedCategory !== null) {
      list = list.filter(p => p.subcategory?.category?.id === Number(selectedCategory));
    }
    if (search.trim()) {
      list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    return [...list].sort((a, b) =>
      (effectiveSalesScores[b.id] ?? 0) - (effectiveSalesScores[a.id] ?? 0)
    );
  }, [products, search, selectedCategory, effectiveSalesScores]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const getDiscountedPrice = (product: Product): number => {
    const now = new Date();
    const activePromo = product.productPromotions?.find(pp => {
      const p = pp.promotion;
      if (!p.isActive) return false;
      if (p.startDate && new Date(p.startDate) > now) return false;
      if (p.endDate && new Date(p.endDate) < now) return false;
      return p.type === 'PERCENTAGE_DISCOUNT' || p.type === 'PRODUCT_DISCOUNT';
    });
    if (!activePromo) return product.price;
    const discount = (activePromo.promotion.rules as any).discountPercent ?? 0;
    return Math.round(product.price * (1 - discount / 100) * 100) / 100;
  };

  const total = cart.reduce((sum, i) => sum + getDiscountedPrice(i.product) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleConfirmationDone = useCallback(() => {
    setConfirmation(null);
    setCart([]);
    setSearch('');
    setMobileTab('products');
    searchRef.current?.focus();
  }, []);

  const handlePay = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const order = await fetchJson<{ id: number }>('/admin/caisse/order', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({
            productId: Number(i.product.id),
            quantity: i.quantity,
          })),
        }),
      });

      const sessionOrder: SessionOrder = {
        id: order.id,
        total,
        items: cart.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          price: getDiscountedPrice(i.product),
        })),
        createdAt: new Date(),
      };

      setSessionOrders(prev => [...prev, sessionOrder]);
      setConfirmation({ id: order.id, total });
    } catch (e: any) {
      addNotification('error', e.message ?? 'Erreur lors de la commande');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    setCancelling(orderId);
    try {
      await fetchJson(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: 'CANCELLED' }),
      });
      setSessionOrders(prev => prev.map(o => o.id === orderId ? { ...o, cancelled: true } : o));
      addNotification('success', `Commande #${orderId} annulée`);
    } catch (e: any) {
      addNotification('error', e.message ?? 'Impossible d\'annuler la commande');
    } finally {
      setCancelling(null);
    }
  };

  const clearCart = () => setCart([]);

  const activeSessionOrders = sessionOrders.filter(o => !o.cancelled);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Receipt size={20} className="text-accent-mint" />
            Caisse
          </h1>
          <p className="hidden sm:block text-sm text-slate-500 mt-0.5">Vente directe — paiement sur place</p>
        </div>
        {/* Bouton historique desktop uniquement */}
        <button
          onClick={() => setShowHistory(h => !h)}
          className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            showHistory
              ? 'border-accent-mint/40 bg-accent-mint/10 text-accent-mint'
              : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600/60'
          }`}
        >
          <History size={14} />
          Historique
          {activeSessionOrders.length > 0 && (
            <span className="px-1.5 py-0.5 bg-accent-mint/20 text-accent-mint text-[10px] font-black rounded-full">
              {activeSessionOrders.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* ── Colonne produits ── */}
        <div className={`flex-1 flex-col min-w-0 ${mobileTab === 'products' ? 'flex' : 'hidden md:flex'}`}>
          {/* Search */}
          <div className="relative mb-3 flex-shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-mint/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto flex-shrink-0 pb-1" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedCategory === null
                    ? 'bg-accent-mint text-darker-bg border-transparent'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/40 hover:text-white hover:border-slate-600/60'
                }`}
              >
                Tous
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === String(cat.id) ? null : String(cat.id))}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedCategory === String(cat.id)
                      ? 'bg-accent-mint text-darker-bg border-transparent'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700/40 hover:text-white hover:border-slate-600/60'
                  }`}
                >
                  <Tag size={10} />
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="w-8 h-8 border-2 border-accent-mint border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 pr-1 pb-20 md:pb-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.3) transparent' }}>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-600 text-sm border border-dashed border-slate-700/30 rounded-xl">
                  Aucun produit trouvé
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                  {filtered.map((product) => {
                    const discounted = getDiscountedPrice(product);
                    const hasDiscount = discounted < product.price;
                    const inCart = cart.find(i => i.product.id === product.id);
                    return (
                      <div key={product.id} className="relative">
                        <button
                          onClick={() => addToCart(product)}
                          className={`relative w-full text-left rounded-xl border transition-all duration-200 overflow-hidden group hover:-translate-y-0.5 hover:shadow-lg ${
                            inCart
                              ? 'border-accent-mint/40 bg-accent-mint/5 shadow-[0_0_15px_rgba(119,241,190,0.1)]'
                              : 'border-slate-700/30 bg-slate-800/30 hover:border-slate-600/50'
                          }`}
                        >
                          {inCart && (
                            <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-accent-mint rounded-full flex items-center justify-center text-darker-bg text-[10px] font-black">
                              {inCart.quantity}
                            </div>
                          )}
                          <div className="aspect-square bg-slate-700/30 overflow-hidden">
                            <img
                              src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=222&color=fff`}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-white truncate leading-tight">{product.name}</p>
                            <div className="mt-1">
                              {hasDiscount ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 line-through">{fmt(product.price)}€</span>
                                  <span className="text-sm font-black text-red-400">{fmt(discounted)}€</span>
                                </div>
                              ) : (
                                <span className="text-sm font-black text-accent-mint">{fmt(product.price)}€</span>
                              )}
                            </div>
                          </div>
                          <div
                            className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              min="1"
                              placeholder="qté"
                              className="w-12 bg-slate-900/80 border border-accent-mint/30 rounded-md px-1 py-0.5 text-[10px] text-accent-mint placeholder-slate-600 focus:outline-none focus:border-accent-mint/70 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none backdrop-blur-sm"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const val = parseInt((e.target as HTMLInputElement).value);
                                  if (!isNaN(val) && val > 0) {
                                    setCart(prev => {
                                      const existing = prev.find(i => i.product.id === product.id);
                                      if (existing) {
                                        return prev.map(i =>
                                          i.product.id === product.id ? { ...i, quantity: i.quantity + val } : i
                                        );
                                      }
                                      return [...prev, { product, quantity: val }];
                                    });
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Colonne panier ── */}
        <div className={`md:w-72 md:flex-shrink-0 flex-col bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden relative ${mobileTab === 'cart' ? 'flex flex-1' : 'hidden md:flex'}`}>
          {confirmation && (
            <ConfirmationOverlay order={confirmation} onDone={handleConfirmationDone} />
          )}

          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ShoppingCart size={16} className="text-accent-mint" />
              Panier
              {cart.length > 0 && (
                <span className="px-1.5 py-0.5 bg-accent-mint/20 text-accent-mint text-[10px] font-black rounded-full">
                  {cartCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 pb-20 md:pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.3) transparent' }}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs text-center py-8">
                <ShoppingCart size={28} className="mb-2 opacity-30" />
                Cliquez sur un produit<br />pour l'ajouter
              </div>
            ) : (
              cart.map(item => {
                const price = getDiscountedPrice(item.product);
                return (
                  <div key={item.product.id} className="flex items-center gap-2 p-2 bg-slate-700/20 rounded-xl border border-slate-700/20">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                      <img
                        src={item.product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&background=222&color=fff`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-accent-mint font-bold">{fmt(price * item.quantity)}€</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-5 h-5 rounded-md bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-5 h-5 rounded-md bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 transition-all"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-3 pb-3 pt-2 border-t border-slate-700/30 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-2xl font-black text-white">{fmt(total)}€</span>
            </div>
            <button
              onClick={handlePay}
              disabled={cart.length === 0 || processing}
              className="w-full py-3 rounded-xl bg-accent-mint text-darker-bg font-black text-sm flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Receipt size={16} />
                  Encaisser
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-600 text-center">Cash / CB — paiement sur place</p>
          </div>
        </div>

        {/* ── Colonne historique ── */}
        {(showHistory || mobileTab === 'history') && (
          <div className={`md:w-64 md:flex-shrink-0 flex-col bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden ${mobileTab === 'history' ? 'flex flex-1' : 'hidden md:flex'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <History size={15} className="text-accent-mint" />
                Session
              </div>
              <div className="flex items-center gap-3">
                {sessionOrders.length > 0 && (
                  <span className="text-[10px] text-slate-500">
                    {fmt(activeSessionOrders.reduce((s, o) => s + o.total, 0))} € encaissés
                  </span>
                )}
                <button
                  onClick={() => { setShowHistory(false); setMobileTab('products'); }}
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto px-3 py-3 pb-20 md:pb-3"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.3) transparent' }}
            >
              <SessionHistory
                orders={sessionOrders}
                onCancel={handleCancelOrder}
                cancelling={cancelling}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom nav mobile ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/40 flex z-40">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-semibold transition-colors ${
            mobileTab === 'products' ? 'text-accent-mint' : 'text-slate-500'
          }`}
        >
          <Package size={20} />
          Produits
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-semibold transition-colors ${
            mobileTab === 'cart' ? 'text-accent-mint' : 'text-slate-500'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-accent-mint text-darker-bg text-[9px] font-black rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          {cart.length > 0 ? (
            <span className="text-[10px] font-black text-accent-mint">{fmt(total)}€</span>
          ) : (
            <span>Panier</span>
          )}
        </button>
        <button
          onClick={() => setMobileTab('history')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-semibold transition-colors ${
            mobileTab === 'history' ? 'text-accent-mint' : 'text-slate-500'
          }`}
        >
          <div className="relative">
            <History size={20} />
            {activeSessionOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-accent-mint/20 text-accent-mint text-[9px] font-black rounded-full flex items-center justify-center">
                {activeSessionOrders.length}
              </span>
            )}
          </div>
          Historique
        </button>
      </nav>
    </div>
  );
};

export default AdminCaissePage;