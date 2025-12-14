import React, { useEffect, useState } from 'react';
import { getAllProducts, type Product } from '../api/products';
import { ShoppingBag, MinusCircle, PlusCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const { addToCart } = useCart();
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        const activeProducts = data.filter(p => p.active);
        setProducts(activeProducts);

        // Initialiser les quantités à 1 pour chaque produit
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
    const quantity = quantities[product.id] || 1;
    addToCart(product, quantity);
    addNotification('success', `${quantity}x ${product.name} ajouté${quantity > 1 ? 's' : ''} au panier !`);
    // Réinitialiser la quantité à 1 après ajout
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-accent-mint mb-6 font-koulen">Notre Boutique</h1>
      <p className="text-lg mb-8 text-gray-300">Découvrez nos produits et soutenez l'ADIIL !</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-mint"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-darker-bg rounded-lg border border-red-900/50">
          <p className="text-red-400">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-darker-bg rounded-2xl border border-gray-800">
           <ShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
           <p className="text-gray-400 text-lg">La boutique est vide pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const quantity = quantities[product.id] || 1;
            return (
              <div
                key={product.id}
                className="card p-6 flex flex-col h-full hover:shadow-lg transition-shadow border border-gray-800 hover:border-accent-mint/30"
              >
                {/* Image */}
                <div className="h-48 mb-4 overflow-hidden rounded-md bg-dark-bg flex items-center justify-center">
                  <img
                    src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=200`}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Nom */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{product.name}</h3>

                {/* Description */}
                {product.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-grow">{product.description}</p>
                )}

                {/* Prix */}
                <p className="text-accent-mint text-2xl font-bold mb-4">{product.price} €</p>

                {/* Sélecteur de quantité */}
                <div className="flex items-center justify-center border border-gray-600 rounded-md mb-3">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="p-2 text-accent-mint hover:text-white disabled:text-gray-600"
                    disabled={quantity <= 1}
                    aria-label="Diminuer la quantité"
                  >
                    <MinusCircle size={20} />
                  </button>
                  <span className="px-4 text-lg font-bold">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="p-2 text-accent-mint hover:text-white"
                    aria-label="Augmenter la quantité"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>

                {/* Bouton Ajouter au panier */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-accent-mint text-darker-bg font-bold py-3 px-4 rounded hover:bg-white transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={20} />
                  Ajouter au panier
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopPage;