import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents, type Event } from '../api/events';
import { getAllProducts, type Product } from '../api/products';
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  ShoppingBag, 
  Users, 
  Coffee,
  Heart
} from 'lucide-react';

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, productsData] = await Promise.all([
          getAllEvents(),
          getAllProducts()
        ]);

        const upcomingEvents = eventsData
          .filter(e => new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);
        setEvents(upcomingEvents);

        const availableProducts = productsData
            .filter(p => p.active)
            .slice(0, 4);
        setProducts(availableProducts);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoadingEvents(false);
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen text-white">
      {/* Simple Hero Section */}
      <section className="bg-darker-bg py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-koulen text-accent-mint mb-6">
            BDE ADIIL
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            L'association des etudiants en informatique de Laval. <br/>
            On est la pour animer le campus, s'entraider et partager des bons moments.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/events" 
              className="px-6 py-3 bg-accent-mint text-darker-bg font-bold rounded-lg hover:bg-accent-mint/90 transition-colors flex items-center gap-2"
            >
              <Calendar size={18} />
              Nos evenements
            </Link>
            <Link 
              to="/shop" 
              className="px-6 py-3 bg-dark-bg border border-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <ShoppingBag size={18} />
              La Boutique
            </Link>
          </div>
        </div>
      </section>

      {/* Intro / Values */}
      <section className="py-16 bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 bg-darker-bg rounded-xl border border-gray-800 text-center">
              <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Entraide</h3>
              <p className="text-gray-400 text-sm">
                Un problème en code ? Besoin d'un coup de main pour les cours ? Le réseau des étudiants est là pour ça.
              </p>
            </div>
            <div className="p-6 bg-darker-bg rounded-xl border border-gray-800 text-center">
              <div className="w-12 h-12 bg-purple-900/30 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Convivialite</h3>
              <p className="text-gray-400 text-sm">
                Des afterworks tranquilles, des repas partages et des pauses cafe pour decompresser entre les cours.
              </p>
            </div>
            <div className="p-6 bg-darker-bg rounded-xl border border-gray-800 text-center">
              <div className="w-12 h-12 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Vie Asso</h3>
              <p className="text-gray-400 text-sm">
                Participe à la vie du département info, propose tes idées et rejoins l'équipe si ça te tente !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 bg-darker-bg border-y border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-koulen text-white">A l'agenda</h2>
            <Link to="/events" className="text-accent-mint hover:underline text-sm font-bold flex items-center gap-1">
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-mint"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-dark-bg rounded-lg border border-gray-800 border-dashed">
              <p className="text-gray-500">Pas d'evenement prevu pour l'instant.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="group block">
                  <article className="bg-dark-bg rounded-lg border border-gray-800 hover:border-accent-mint/50 transition-colors overflow-hidden h-full flex flex-col">
                    <div className="h-40 bg-gray-800 relative overflow-hidden">
                       <img
                        src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=111&color=77F1BE&size=512&font-size=0.33`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 bg-darker-bg/90 px-2 py-1 rounded text-xs font-bold text-accent-mint border border-gray-700">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg text-white mb-1 truncate">{event.title}</h3>
                      <div className="flex items-center text-gray-500 text-xs mb-3">
                        <MapPin size={12} className="mr-1" />
                        {event.location}
                      </div>
                      <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-800">
                         <span className="text-sm text-gray-400">{event.price === 0 ? 'Gratuit' : `${event.price} €`}</span>
                         <span className="text-xs font-bold text-accent-mint">Voir détails</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Small Shop Preview */}
      <section className="py-16 bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/3">
              <h2 className="text-2xl md:text-3xl font-koulen text-white mb-4">La Boutique</h2>
              <p className="text-gray-400 mb-6 text-sm">
                Envie d'un pull de promo ou d'un t-shirt de l'asso ?
                Les ventes servent à financer les projets du BDE.
              </p>
              <Link to="/shop" className="inline-block px-5 py-2 bg-white text-darker-bg font-bold rounded hover:bg-gray-200 transition-colors text-sm">
                Voir les produits
              </Link>
            </div>
            
            <div className="md:w-2/3 w-full">
              {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {products.map((product) => (
                      <Link key={product.id} to="/shop" className="block bg-darker-bg rounded-lg border border-gray-800 hover:border-gray-600 transition-colors p-2">
                        <div className="aspect-square bg-gray-800 rounded mb-2 overflow-hidden">
                           <img 
                            src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=222&color=fff`} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-bold text-white truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.price} €</p>
                      </Link>
                   ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-gray-800 rounded-lg">
                  <p className="text-gray-500 text-sm">Boutique en maintenance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Join Footer */}
      <section className="py-12 bg-darker-bg border-t border-gray-800 text-center">
         <div className="container mx-auto px-4">
           <p className="text-lg text-white mb-6 font-bold flex items-center justify-center gap-2">
             <Heart size={20} className="text-red-500 fill-current" />
             Envie de t'investir ?
           </p>
           <p className="text-gray-400 text-sm max-w-lg mx-auto mb-6">
             L'asso est ouverte à tous. Passe nous voir au local ou contacte-nous pour proposer tes idées !
           </p>
           <Link to="/register" className="text-accent-mint hover:text-white transition-colors underline text-sm font-bold">
             Rejoindre l'ADIIL
           </Link>
         </div>
      </section>
    </div>
  );
};

export default HomePage;