import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById, type Product } from '../api/products';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
// import { useCart } from '../context/CartContext'; // Future implementation

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Impossible de charger le produit.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-mint"></div></div>;
  
  if (error || !product) return (
      <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl text-red-400 mb-4">{error || "Produit non trouvé"}</h2>
          <Link to="/shop" className="text-accent-mint hover:underline flex items-center justify-center gap-2">
             <ArrowLeft size={20} /> Retour à la boutique
          </Link>
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/shop" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
         <ArrowLeft size={20} className="mr-2" /> Retour à la boutique
      </Link>
      
      <div className="card p-8 flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="md:w-1/2">
          <img 
            src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=600`} 
            alt={product.name} 
            className="w-full h-auto object-cover rounded-lg shadow-lg border border-gray-800" 
          />
        </div>
        <div className="md:w-1/2 flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-koulen tracking-wide">{product.name}</h1>
          <p className="text-accent-mint text-3xl font-bold mb-6">{product.price} €</p>
          
          <div className="bg-dark-bg p-6 rounded-lg mb-8 border border-gray-800">
             <h3 className="text-lg font-bold mb-2 text-gray-300">Description</h3>
             <p className="text-gray-400 leading-relaxed">
                {product.description || "Aucune description disponible pour ce produit."}
             </p>
          </div>

          <div className="mt-auto">
              {product.active ? (
                <button 
                    className="w-full md:w-auto bg-accent-mint text-darker-bg font-bold py-4 px-8 rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-3 text-lg"
                    onClick={() => alert("Ajout au panier (Fonctionnalité à venir)")}
                >
                    <ShoppingCart size={24} />
                    Ajouter au panier
                </button>
              ) : (
                  <div className="bg-red-900/30 text-red-400 border border-red-900 p-4 rounded-lg text-center font-bold">
                      Rupture de stock
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;