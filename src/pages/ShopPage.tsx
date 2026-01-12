import React, { useEffect, useState } from 'react';
import { getAllProducts, type Product } from '../api/products';
import { getAllCategories, type Category } from '../api/categories';
import { getActiveProductPromotions, type ProductPromotionsMap } from '../api/promotions';
import { ShoppingBag, Minus, Plus, ShoppingCart, Search, LogIn, X, Tag } from 'lucide-react';
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
        setCategories(categoriesData);
        setProductPromotions(promotionsData);

        const initialQuantities: { [key: string]: number } = {};
        activeProducts.forEach(product => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);
      } catch (err) {
        console.error("Failed to fetch data:", err);
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
      addNotification('error', 'Veuillez sélectionner un format');
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
    const groups: { [key: string]: { name: string; categoryName: string; products: Product[] } } = {};

    filteredProducts.forEach(product => {
      const subcategoryName = product.subcategory?.name || 'Autres';
      const categoryName = product.subcategory?.category?.name || '';
      const key = `${categoryName}-${subcategoryName}`;

      if (!groups[key]) {
        groups[key] = {
          name: subcategoryName,
          categoryName: categoryName,
          products: []
        };
      }
      groups[key].products.push(product);
    });

    // Sort groups by category then subcategory name
    return Object.values(groups).sort((a, b) => {
      if (a.categoryName !== b.categoryName) {
        return a.categoryName.localeCompare(b.categoryName);
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredProducts]);

  return (
    <div className="min-h-screen">
      <SEO
        title="Boutique"
        description="Boutique ADIIL - Snacks, boissons et goodies pour les etudiants de l'IUT de Laval. Departement Informatique."
        url="/shop"
      />
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
                  <div className="relative">
                    <BalanceDisplay variant="compact" showRechargeButton={true} />
                    <BonusBubble variant="overlay" />
                  </div>
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

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedCategoryId
                      ? 'bg-accent-mint text-darker-bg'
                      : 'bg-dark-bg text-gray-400 hover:text-white border border-gray-700'
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
                        : 'bg-dark-bg text-gray-400 hover:text-white border border-gray-700'
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
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                        : 'bg-dark-bg text-gray-500 hover:text-gray-300 border border-gray-700'
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
                          ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                          : 'bg-dark-bg text-gray-500 hover:text-gray-300 border border-gray-700'
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
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
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
            <div className="space-y-10">
              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  <span className="text-white font-bold">{filteredProducts.length}</span> produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
                  {groupedProducts.length > 1 && (
                    <span className="text-gray-500"> • {groupedProducts.length} catégories</span>
                  )}
                </p>
              </div>

              {/* Grouped products by subcategory */}
              {groupedProducts.map((group) => (
                <div key={`${group.categoryName}-${group.name}`} className="space-y-4">
                  {/* Section header */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-accent-mint rounded-full" />
                      <div>
                        {group.categoryName && !selectedCategoryId && (
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{group.categoryName}</p>
                        )}
                        <h2 className="text-xl font-koulen text-white">{group.name}</h2>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-sm text-gray-500 bg-darker-bg px-3 py-1 rounded-full">
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
                          className={`bg-darker-bg rounded-2xl border transition-all duration-300 overflow-hidden group flex flex-col ${
                            hasPromotion ? 'border-red-500/50 hover:border-red-400' : 'border-gray-800 hover:border-accent-mint/30'
                          }`}
                        >
                          {/* Image */}
                          <div className="aspect-square bg-gray-800 relative overflow-hidden">
                            <img
                              src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=200`}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Promotion badge */}
                            {hasPromotion && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg flex items-center gap-1">
                                <Tag size={12} />
                                <span className="font-bold text-xs">-{promotion.discountPercent}%</span>
                              </div>
                            )}
                            {/* Price tag overlay */}
                            <div className="absolute top-2 right-2 bg-darker-bg/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                              {hasPromotion ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-gray-500 line-through text-xs">{basePrice.toFixed(2)}€</span>
                                  <span className="text-red-400 font-koulen text-lg">{discountedPrice.toFixed(2)}€</span>
                                </div>
                              ) : (
                                <span className="text-accent-mint font-koulen text-lg">{basePrice.toFixed(2)}€</span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-3 flex flex-col flex-1">
                            <h3 className="font-bold text-white text-sm leading-tight mb-2 line-clamp-2">{product.name}</h3>

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

                            {/* Quantity and add button in row */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-dark-bg rounded-lg">
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
                                className="flex-1 py-2 bg-accent-mint text-darker-bg font-bold text-xs rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-1"
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
