import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, type Product } from '../api/products';
import { getActiveProductPromotions, type ProductPromotionsMap } from '../api/promotions';
import { ArrowLeft, Share2, ShoppingCart, Minus, Plus, Tag, ChevronLeft, ChevronRight, LogIn, X, ZoomIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import SEO from '../components/SEO';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [productPromotions, setProductPromotions] = useState<ProductPromotionsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const getAllImages = () => {
    if (!product) return [];
    const imgs: { url: string; id?: number }[] = [];

    // Add main image first if exists
    if (product.imageUrl) {
      imgs.push({ url: product.imageUrl });
    }

    // Add gallery images
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        imgs.push({ url: img.url, id: img.id });
      });
    }

    return imgs;
  };

  const images = getAllImages();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [productData, promotionsData] = await Promise.all([
          getProductById(id),
          getActiveProductPromotions()
        ]);
        setProduct(productData);
        setProductPromotions(promotionsData);
      } catch (err) {
        logger.error('Failed to fetch product', err);
        setError("Impossible de charger les détails du produit.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        logger.debug('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      addNotification('success', 'Lien copié !');
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      addNotification('info', 'Connectez-vous pour ajouter des produits au panier');
      navigate('/login');
      return;
    }

    if (!product) return;

    addToCart(product, quantity);
    addNotification('success', `${quantity}x ${product.name} ajouté au panier !`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="text-center">
          <h2 className="text-2xl text-red-400 mb-4 font-montserrat">{error || "Produit non trouvé"}</h2>
          <Link to="/shop" className="inline-flex items-center gap-2 text-accent-mint hover:underline">
            <ArrowLeft size={20} /> Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  const basePrice = product.price;
  const promotion = productPromotions[parseInt(product.id)];
  const discountedPrice = promotion
    ? Math.round(basePrice * (1 - promotion.discountPercent / 100) * 100) / 100
    : basePrice;
  const hasPromotion = !!promotion;
  const currentImage = images.length > 0
    ? images[currentImageIndex].url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=600`;

  return (
    <div className="min-h-screen bg-dark-bg">
      <SEO
        title={product.name}
        description={`${product.description?.slice(0, 150) || product.name} - Disponible a la boutique ADIIL, IUT de Laval.`}
        keywords={`${product.name}, boutique ADIIL, IUT Laval, ${product.subcategory?.name || ''}`}
        url={`/shop/${product.id}`}
        type="product"
        image={product.imageUrl || undefined}
        imageAlt={product.name}
      />

      {/* Hero Section with Image Gallery */}
      <div className="relative bg-darker-bg">
        {/* Back button */}
        <Link
          to="/shop"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint hover:bg-darker-bg transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Retour</span>
        </Link>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-6 right-6 z-20 p-3 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint hover:bg-darker-bg transition-all"
        >
          <Share2 size={18} />
        </button>

        <div className="container mx-auto px-4 py-12 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 group">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-[1.02]"
                  onClick={() => setLightboxOpen(true)}
                />

                {/* Zoom indicator */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors cursor-pointer pointer-events-none"
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-darker-bg/90 backdrop-blur-md p-3 rounded-xl border border-gray-700">
                    <ZoomIn size={24} className="text-white" />
                  </div>
                </div>

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Promotion badge */}
                {hasPromotion && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                    <Tag size={16} />
                    <span className="font-bold">-{promotion.discountPercent}%</span>
                  </div>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-darker-bg/90 backdrop-blur-md text-white text-sm rounded-lg border border-gray-700">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={img.id || index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-accent-mint'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category badge */}
              {product.subcategory && (
                <div className="flex flex-wrap gap-2">
                  {product.subcategory.category && (
                    <span className="px-3 py-1 bg-accent-mint/10 text-accent-mint text-sm font-medium rounded-lg border border-accent-mint/20">
                      {product.subcategory.category.name}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg">
                    {product.subcategory.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-koulen text-white">{product.name.toUpperCase()}</h1>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                {hasPromotion ? (
                  <>
                    <span className="text-4xl font-koulen text-red-400">{discountedPrice.toFixed(2)} EUR</span>
                    <span className="text-2xl text-gray-500 line-through">{basePrice.toFixed(2)} EUR</span>
                  </>
                ) : (
                  <span className="text-4xl font-koulen text-accent-mint">{basePrice.toFixed(2)} EUR</span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-dark-bg rounded-2xl p-6 border border-gray-800">
                  <h2 className="text-lg font-bold text-white mb-3">Description</h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-montserrat">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Quantity and Add to cart */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center bg-dark-bg rounded-xl border border-gray-700">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-12 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded-l-xl disabled:text-gray-600 disabled:hover:bg-transparent transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-12 text-center text-white font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-12 h-12 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded-r-xl transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-4 px-6 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-all hover:shadow-[0_0_30px_rgba(119,241,190,0.3)] flex items-center justify-center gap-3 group"
                >
                  {user ? (
                    <>
                      <ShoppingCart size={22} />
                      <span>Ajouter au panier</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={22} />
                      <span>Se connecter</span>
                    </>
                  )}
                </button>
              </div>

              {!user && (
                <p className="text-sm text-gray-500 text-center">
                  Connectez-vous pour ajouter ce produit au panier
                </p>
              )}

              {/* Total price preview */}
              {quantity > 1 && (
                <div className="bg-dark-bg rounded-xl p-4 border border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total ({quantity} articles)</span>
                    <span className="text-xl font-koulen text-accent-mint">
                      {(discountedPrice * quantity).toFixed(2)} EUR
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header with close button and counter */}
          <div className="flex-shrink-0 flex items-center justify-center p-6 relative">
            {/* Image counter */}
            {images.length > 1 && (
              <div className="px-4 py-2 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-6 p-3 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint hover:bg-darker-bg transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main image area */}
          <div
            className="flex-1 flex items-center justify-center px-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-[90vw] h-full flex items-center justify-center">
              <img
                src={currentImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint transition-all"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint transition-all"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex-shrink-0 flex justify-center p-6">
              <div className="flex gap-2 p-2 bg-darker-bg/90 backdrop-blur-md rounded-xl border border-gray-700 max-w-[90vw] overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={img.id || index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-accent-mint'
                        : 'border-transparent hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;