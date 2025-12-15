import React, { useEffect, useState } from 'react';
import { getAllProducts, type Product } from '../api/products';
import { ShoppingBag, Minus, Plus, ShoppingCart, Search, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import BalanceDisplay from '../components/BalanceDisplay';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ShopPage: React.FC = () => {
  useDocumentTitle('Boutique');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: number | undefined }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, items: cartItems } = useCart();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        const activeProducts = data.filter(p => p.active);
        setProducts(activeProducts);

        const initialQuantities: { [key: string]: number } = {};
        activeProducts.forEach(product => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Impossible de charger les produits.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      addNotification('info', 'Connectez-vous pour ajouter des produits au panier');
      navigate('/login');
      return;
    }

    const quantity = quantities[product.id] || 1;
    const variantId = selectedVariants[product.id];

    if (product.variants && product.variants.length > 0 && !variantId) {
      addNotification('error', 'Veuillez sélectionner un format');
      return;
    }

    const variant = product.variants?.find(v => v.id === variantId);
    const variantText = variant ? ` (${variant.name})` : '';

    addToCart(product, quantity, variantId);
    addNotification('success', `${quantity}x ${product.name}${variantText} ajouté au panier !`);
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-darker-bg py-16 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Boutique</span>
              <h1 className="text-5xl md:text-6xl font-koulen text-white mt-2">SNACKS & DRINKS</h1>
              <p className="text-gray-400 mt-4 max-w-xl font-montserrat">
                Un petit creux entre deux cours ? Boissons fraîches et snacks disponibles pour tous les étudiants.
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-4">
              {user ? (
                <>
                  <BalanceDisplay variant="compact" showRechargeButton={true} />
                  {cartItemsCount > 0 && (
                    <Link
                      to="/cart"
                      className="relative flex items-center gap-2 px-4 py-2 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors"
                    >
                      <ShoppingCart size={20} />
                      <span className="hidden sm:inline">Panier</span>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-darker-bg text-xs font-bold rounded-full flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors"
                >
                  <LogIn size={18} />
                  <span>Se connecter</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-8 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-accent-mint focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-dark-bg">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-darker-bg rounded-2xl border border-red-900/30">
              <p className="text-red-400 font-montserrat">{error}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-darker-bg rounded-2xl border border-gray-800">
              <ShoppingBag size={56} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-400 text-lg font-montserrat">
                {searchQuery ? "Aucun produit trouvé." : "La boutique est vide pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredProducts.map((product) => {
                const quantity = quantities[product.id] || 1;
                const variant = product.variants?.find(v => v.id === selectedVariants[product.id]);
                const displayPrice = variant ? product.price + variant.priceModifier : product.price;

                return (
                  <div
                    key={product.id}
                    className="bg-darker-bg rounded-2xl border border-gray-800 hover:border-accent-mint/30 transition-all duration-300 overflow-hidden group flex flex-col"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-800 relative overflow-hidden">
                      <img
                        src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=200`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-bold text-white text-sm truncate mb-1">{product.name}</h3>

                      {/* Variant selector */}
                      {product.variants && product.variants.length > 0 && (
                        <select
                          value={selectedVariants[product.id] || ''}
                          onChange={(e) => setSelectedVariants(prev => ({
                            ...prev,
                            [product.id]: e.target.value ? parseInt(e.target.value) : undefined
                          }))}
                          className="w-full bg-dark-bg border border-gray-700 rounded-lg p-1.5 text-white text-xs focus:border-accent-mint outline-none mb-2"
                        >
                          <option value="">Format</option>
                          {product.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Spacer to push controls to bottom */}
                      <div className="flex-1" />

                      {/* Price */}
                      <p className="text-accent-mint font-koulen text-xl mb-2">
                        {displayPrice.toFixed(2)}€
                      </p>

                      {/* Quantity selector */}
                      <div className="flex items-center justify-between bg-dark-bg rounded-lg p-1 mb-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          disabled={quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded disabled:text-gray-600 disabled:hover:bg-transparent transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-white font-bold text-sm">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Add to cart button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full py-2 bg-accent-mint text-darker-bg font-bold text-sm rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-1"
                      >
                        <ShoppingCart size={14} />
                        Ajouter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Floating cart button (mobile) */}
      {user && cartItemsCount > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-6 right-6 md:hidden flex items-center gap-2 px-5 py-3 bg-accent-mint text-darker-bg font-bold rounded-full shadow-lg hover:bg-white transition-colors z-50"
        >
          <ShoppingCart size={20} />
          <span>{cartItemsCount}</span>
        </Link>
      )}
    </div>
  );
};

export default ShopPage;
