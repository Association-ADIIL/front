import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { getAllProducts, type Product } from '../api/products';
import { getAllCategories, type Category } from '../api/categories';
import { getActiveProductPromotions, type ProductPromotionsMap } from '../api/promotions';
import { ShoppingBag, Minus, Plus, ShoppingCart, Search, LogIn, X, Tag, Coffee, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import BalanceDisplay from '../components/BalanceDisplay';
import BonusBubble from '../components/BonusBubble';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productPromotions, setProductPromotions] = useState<ProductPromotionsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: number | undefined }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const { addToCart, items: cartItems } = useCart();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, promotionsData] = await Promise.all([
          getAllProducts(),
          getAllCategories(),
          getActiveProductPromotions()
        ]);
        const activeProducts = productsData.filter(p => p.active);
        setProducts(activeProducts);
        // Sort categories and subcategories by order
        const sortedCategories = [...categoriesData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        sortedCategories.forEach(cat => {
          if (cat.subcategories) {
            cat.subcategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }
        });
        setCategories(sortedCategories);
        setProductPromotions(promotionsData);

        const initialQuantities: { [key: string]: number } = {};
        activeProducts.forEach(product => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);
      } catch (err) {
        logger.error('Failed to fetch data', err);
        setError("Impossible de charger les produits.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
  };

  const handleSubcategoryClick = (subcategoryId: number | null) => {
    setSelectedSubcategoryId(subcategoryId);
  };

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
      addNotification('error', 'Veuillez sélectionner une variante');
      return;
    }

    const variant = product.variants?.find(v => v.id === variantId);
    const variantText = variant ? ` (${variant.name})` : '';

    addToCart(product, quantity, variantId);
    addNotification('success', `${quantity}x ${product.name}${variantText} ajouté au panier !`);
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const filteredProducts = products.filter(product => {
    // Text search
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = !selectedCategoryId ||
      (product.subcategory?.category?.id === selectedCategoryId);

    // Subcategory filter
    const matchesSubcategory = !selectedSubcategoryId ||
      (product.subcategoryId === selectedSubcategoryId);

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Group products by subcategory for better organization
  const groupedProducts = React.useMemo(() => {
    const groups: { [key: string]: { name: string; categoryName: string; categoryOrder: number; subcategoryOrder: number; products: Product[] } } = {};

    filteredProducts.forEach(product => {
      const subcategory = product.subcategory;
      const category = subcategory?.category;
      const subcategoryName = subcategory?.name || 'Autres';
      const categoryName = category?.name || '';
      const key = `${categoryName}-${subcategoryName}`;

      // Find order from categories state (more reliable than product.subcategory which may not have order)
      const categoryFromState = categories.find(c => c.name === categoryName);
      const subcategoryFromState = categoryFromState?.subcategories?.find(s => s.name === subcategoryName);

      if (!groups[key]) {
        groups[key] = {
          name: subcategoryName,
          categoryName: categoryName,
          categoryOrder: categoryFromState?.order ?? 999,
          subcategoryOrder: subcategoryFromState?.order ?? 999,
          products: []
        };
      }
      groups[key].products.push(product);
    });

    // Sort groups by category order then subcategory order
    return Object.values(groups).sort((a, b) => {
      if (a.categoryOrder !== b.categoryOrder) {
        return a.categoryOrder - b.categoryOrder;
      }
      return a.subcategoryOrder - b.subcategoryOrder;
    });
  }, [filteredProducts, categories]);

  return (
    <div className="min-h-screen">
      <SEO
        title="Boutique"
        description="Boutique ADIIL - Snacks, boissons et goodies pour les etudiants de l'IUT de Laval. Departement Informatique. Prix etudiants."
        keywords="boutique ADIIL, snacks, boissons, goodies, IUT Laval, BDE, prix etudiants, cafeteria"
        url="/shop"
      />
      {/* Header Section */}
      <section className="bg-darker-bg py-16 border-b border-gray-800 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-accent-mint/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(119,241,190,0.5) 40px,
            rgba(119,241,190,0.5) 41px
          )`
        }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/30 rounded-full mb-4">
                <Coffee size={14} className="text-accent-mint" />
                <span className="text-xs text-accent-mint font-medium">Boutique ADIIL</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-koulen text-white">
                SNACKS & <span className="text-accent-mint">DRINKS</span>
              </h1>
              <p className="text-gray-400 mt-4 max-w-xl font-montserrat">
                Un petit creux entre deux cours ? Boissons fraîches et snacks disponibles pour tous les étudiants.
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-4">
              {user ? (
                <>
                  <div className="relative overflow-visible">
                    <BalanceDisplay variant="compact" showRechargeButton={true} />
                    <BonusBubble variant="overlay" className="-top-3 -right-3" />
                  </div>
                  {cartItemsCount > 0 && (
                    <Link
                      to="/cart"
                      className="relative flex items-center gap-2 px-4 py-2.5 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors shadow-lg shadow-accent-mint/20"
                    >
                      <ShoppingCart size={20} />
                      <span className="hidden sm:inline">Panier</span>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-darker-bg text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                        {cartItemsCount}
                      </span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors shadow-lg shadow-accent-mint/20"
                >
                  <LogIn size={18} />
                  <span>Se connecter</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-8 max-w-md">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent-mint transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-accent-mint focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedCategoryId
                      ? 'bg-accent-mint text-darker-bg'
                      : 'bg-dark-bg text-gray-400 hover:text-accent-mint hover:border-accent-mint/50 border border-gray-700'
                  }`}
                >
                  Tout
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-accent-mint text-darker-bg'
                        : 'bg-dark-bg text-gray-400 hover:text-accent-mint hover:border-accent-mint/50 border border-gray-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Subcategory filters */}
              {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSubcategoryClick(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !selectedSubcategoryId
                        ? 'bg-accent-mint/20 text-accent-mint border border-accent-mint/30'
                        : 'bg-dark-bg text-gray-500 hover:text-accent-mint hover:border-accent-mint/30 border border-gray-700'
                    }`}
                  >
                    Tous les {selectedCategory.name.toLowerCase()}
                  </button>
                  {selectedCategory.subcategories.map(subcategory => (
                    <button
                      key={subcategory.id}
                      onClick={() => handleSubcategoryClick(subcategory.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedSubcategoryId === subcategory.id
                          ? 'bg-accent-mint/20 text-accent-mint border border-accent-mint/30'
                          : 'bg-dark-bg text-gray-500 hover:text-accent-mint hover:border-accent-mint/30 border border-gray-700'
                      }`}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Active filter indicator */}
              {(selectedCategoryId || selectedSubcategoryId) && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Filtres actifs:</span>
                  {selectedCategoryId && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-mint/20 text-accent-mint text-xs rounded-full">
                      {selectedCategory?.name}
                      {!selectedSubcategoryId && (
                        <button onClick={() => handleCategoryClick(null)} className="hover:text-white">
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  )}
                  {selectedSubcategoryId && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-mint/10 text-accent-mint/80 text-xs rounded-full">
                      {selectedCategory?.subcategories?.find(s => s.id === selectedSubcategoryId)?.name}
                      <button onClick={() => handleSubcategoryClick(null)} className="hover:text-white">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-dark-bg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-accent-mint/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-0 w-[250px] h-[250px] bg-amber-500/3 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
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
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-400 text-lg font-montserrat">
                {searchQuery ? "Aucun produit trouve." : "La boutique est vide pour le moment."}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Results count */}
              <div className="flex items-center justify-between bg-darker-bg/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-800/50">
                <p className="text-gray-400 text-sm">
                  <span className="text-accent-mint font-bold">{filteredProducts.length}</span> produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
                  {groupedProducts.length > 1 && (
                    <span className="text-gray-500"> dans {groupedProducts.length} categories</span>
                  )}
                </p>
              </div>

              {/* Grouped products by subcategory */}
              {groupedProducts.map((group) => (
                <div key={`${group.categoryName}-${group.name}`} className="space-y-5">
                  {/* Section header */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-10 bg-gradient-to-b from-accent-mint to-accent-mint/30 rounded-full" />
                      <div>
                        {group.categoryName && !selectedCategoryId && (
                          <p className="text-xs text-accent-mint/70 uppercase tracking-wider font-medium">{group.categoryName}</p>
                        )}
                        <h2 className="text-2xl font-koulen text-white">{group.name}</h2>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-800 to-transparent" />
                    <span className="text-xs text-gray-500 bg-darker-bg px-3 py-1.5 rounded-lg border border-gray-800">
                      {group.products.length} article{group.products.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Products grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {group.products.map((product) => {
                      const quantity = quantities[product.id] || 1;
                      const variant = product.variants?.find(v => v.id === selectedVariants[product.id]);
                      const basePrice = variant ? product.price + variant.priceModifier : product.price;
                      const promotion = productPromotions[parseInt(product.id)];
                      const discountedPrice = promotion
                        ? Math.round(basePrice * (1 - promotion.discountPercent / 100) * 100) / 100
                        : basePrice;
                      const hasPromotion = !!promotion;

                      return (
                        <div
                          key={product.id}
                          className={`bg-darker-bg rounded-2xl border transition-all duration-300 overflow-hidden group flex flex-col hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)] ${
                            hasPromotion ? 'border-red-500/50 hover:border-red-400' : 'border-gray-800 hover:border-accent-mint/40'
                          }`}
                        >
                          {/* Image */}
                          <Link to={`/shop/${product.id}`} className="aspect-square bg-gray-900 relative overflow-hidden block">
                            <img
                              src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=200`}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-darker-bg/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {/* View details overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="px-3 py-2 bg-darker-bg/90 backdrop-blur-sm rounded-lg border border-accent-mint/50 flex items-center gap-2 text-accent-mint text-sm font-medium">
                                <Eye size={14} />
                                Voir détails
                              </div>
                            </div>
                            {/* Multiple images indicator */}
                            {product.images && product.images.length > 0 && (
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-darker-bg/90 backdrop-blur-sm rounded-lg text-xs text-gray-300 border border-gray-700/50">
                                +{product.images.length} photo{product.images.length > 1 ? 's' : ''}
                              </div>
                            )}
                            {/* Promotion badge */}
                            {hasPromotion && (
                              <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                <Tag size={12} />
                                <span className="font-bold text-xs">-{promotion.discountPercent}%</span>
                              </div>
                            )}
                            {/* Price tag overlay */}
                            <div className="absolute top-2 right-2 bg-darker-bg/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-gray-700/50">
                              {hasPromotion ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-gray-500 line-through text-xs">{basePrice.toFixed(2)}€</span>
                                  <span className="text-red-400 font-koulen text-lg leading-tight">{discountedPrice.toFixed(2)}€</span>
                                </div>
                              ) : (
                                <span className="text-accent-mint font-koulen text-lg">{basePrice.toFixed(2)}€</span>
                              )}
                            </div>
                          </Link>

                          {/* Content */}
                          <div className="p-3 flex flex-col flex-1 border-t border-gray-800/50">
                            <Link to={`/shop/${product.id}`} className="font-bold text-white text-sm leading-tight mb-1 line-clamp-2 group-hover:text-accent-mint transition-colors block hover:underline">{product.name}</Link>
                            {product.description && (
                              <p className="text-gray-500 text-xs line-clamp-2 mb-2">{product.description}</p>
                            )}

                            {/* Variant selector */}
                            {product.variants && product.variants.length > 0 && (
                              <select
                                value={selectedVariants[product.id] || ''}
                                onChange={(e) => setSelectedVariants(prev => ({
                                  ...prev,
                                  [product.id]: e.target.value ? parseInt(e.target.value) : undefined
                                }))}
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg p-1.5 text-white text-xs focus:border-accent-mint outline-none mb-2 cursor-pointer hover:border-gray-600 transition-colors"
                              >
                                <option value="">Variante</option>
                                {product.variants.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Spacer to push controls to bottom */}
                            <div className="flex-1" />

                            {/* Quantity and add button in row */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-dark-bg rounded-lg border border-gray-800">
                                <button
                                  onClick={() => updateQuantity(product.id, -1)}
                                  disabled={quantity <= 1}
                                  className="w-7 h-8 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded-l-lg disabled:text-gray-600 disabled:hover:bg-transparent transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-6 text-center text-white font-bold text-sm">{quantity}</span>
                                <button
                                  onClick={() => updateQuantity(product.id, 1)}
                                  className="w-7 h-8 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded-r-lg transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              {/* Add to cart button */}
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="flex-1 py-2 bg-accent-mint text-darker-bg font-bold text-xs rounded-lg hover:bg-white transition-all hover:shadow-[0_0_20px_rgba(119,241,190,0.3)] flex items-center justify-center gap-1"
                              >
                                <ShoppingCart size={12} />
                                <span className="hidden sm:inline">Ajouter</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
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
