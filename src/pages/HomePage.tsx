import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents, type Event } from '../api/events';
import { getAllProducts, type Product } from '../api/products';
import { Calendar, MapPin, ArrowRight, ShoppingBag } from 'lucide-react';

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAllEvents();
        const upcomingEvents = data
          .filter(e => new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);
        setEvents(upcomingEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setErrorEvents("Impossible de charger les événements.");
      } finally {
        setLoadingEvents(false);
      }
    };

    const fetchProducts = async () => {
        try {
            const data = await getAllProducts();
            const availableProducts = data
                .filter(p => p.active)
                .slice(0, 3); // Take first 3 available products
            setProducts(availableProducts);
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setErrorProducts("Impossible de charger les produits de la boutique.");
        } finally {
            setLoadingProducts(false);
        }
    };

    fetchEvents();
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-darker-bg py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-koulen text-transparent bg-clip-text bg-gradient-to-r from-accent-mint to-teal-400 mb-6 drop-shadow-lg">
            BDE ADIIL
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 font-light">
            L'association qui fait bouger l'informatique à Laval. Soirées, événements, entraide et bonne humeur !
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/events" className="px-8 py-3 bg-accent-mint text-darker-bg font-bold rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2">
              <Calendar size={20} />
              Voir les événements
            </Link>
            <Link to="/shop" className="px-8 py-3 bg-transparent border-2 border-accent-mint text-accent-mint font-bold rounded-full hover:bg-accent-mint hover:text-darker-bg transition-colors flex items-center justify-center gap-2">
              <ShoppingBag size={20} />
              Visiter la boutique
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Events Section */}
      <section className="py-20 bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-koulen text-white mb-2">Prochains Événements</h2>
              <div className="h-1 w-20 bg-accent-mint rounded-full"></div>
            </div>
            <Link to="/events" className="hidden sm:flex items-center text-accent-mint hover:text-white transition-colors font-semibold">
              Tout voir <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>

          {loadingEvents ? (
             <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-mint"></div>
             </div>
          ) : errorEvents ? (
            <div className="text-center py-10 bg-darker-bg rounded-lg border border-red-900/50">
              <p className="text-red-400">{errorEvents}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-darker-bg rounded-2xl border border-gray-800">
              <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">Aucun événement à venir pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="group">
                  <article className="bg-darker-bg rounded-2xl overflow-hidden shadow-card hover:shadow-2xl transition-all duration-300 h-full border border-gray-800 hover:border-accent-mint/50 flex flex-col">
                    <div className="relative h-48 overflow-hidden">
                       {/* Placeholder or Event Image */}
                      <img
                        src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=0D8ABC&color=fff&size=512&font-size=0.33`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 bg-darker-bg/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-accent-mint border border-accent-mint/30">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-mint transition-colors line-clamp-2">{event.title}</h3>
                      <div className="flex items-center text-gray-400 mb-4 text-sm">
                        <MapPin size={16} className="mr-2 text-accent-mint" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1">{event.description}</p>
                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-800">
                         <span className="text-white font-bold">{event.price === 0 ? 'Gratuit' : `${event.price} €`}</span>
                         <span className="text-accent-mint text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                           S'inscrire <ArrowRight size={16} className="ml-1" />
                         </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
             <Link to="/events" className="text-accent-mint font-bold hover:underline">Voir tous les événements</Link>
          </div>
        </div>
      </section>

      {/* Shop Teaser Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent-mint/5 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
               <h2 className="text-3xl md:text-5xl font-koulen text-white mb-6">Portez les couleurs de <span className="text-accent-mint">l'ADIIL</span></h2>
               <p className="text-lg text-gray-300 mb-8">
                 Soutenez votre BDE en achetant nos goodies officiels. Pulls, t-shirts, mugs... tout ce qu'il faut pour représenter la filière !
               </p>
               <Link to="/shop" className="inline-block px-8 py-3 bg-white text-darker-bg font-bold rounded-full hover:bg-gray-200 transition-colors">
                 Accéder à la boutique
               </Link>
            </div>
            <div className="md:w-1/2 flex justify-center">
               {loadingProducts ? (
                   <div className="flex justify-center items-center h-full w-full">
                       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-mint"></div>
                   </div>
               ) : errorProducts ? (
                   <div className="text-center py-10 bg-darker-bg rounded-lg border border-red-900/50 w-full">
                       <p className="text-red-400">{errorProducts}</p>
                   </div>
               ) : products.length === 0 ? (
                   <div className="text-center py-10 bg-darker-bg rounded-lg border border-gray-800 w-full">
                       <ShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
                       <p className="text-gray-400 text-lg">Aucun produit disponible pour le moment.</p>
                   </div>
               ) : (
                   <div className="relative w-full max-w-md aspect-square rounded-full flex items-center justify-center border-4 border-accent-mint/20 shadow-[0_0_50px_rgba(119,241,190,0.2)] bg-darker-bg">
                       {products.map((product, index) => (
                           <div
                               key={product.id}
                               className="absolute transition-all duration-500 ease-in-out"
                               style={{
                                   transform: `
                                       rotate(${index * (360 / products.length)}deg)
                                       translate(100px)
                                       rotate(-${index * (360 / products.length)}deg)
                                   `,
                                   zIndex: products.length - index,
                               }}
                           >
                               <img
                                   src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=100`}
                                   alt={product.name}
                                   className="w-24 h-24 object-cover rounded-full border-2 border-accent-mint"
                               />
                           </div>
                       ))}
                       <ShoppingBag size={60} className="text-accent-mint opacity-80 z-20" />
                   </div>
               )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;