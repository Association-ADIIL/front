import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents, type Event } from '../api/events';
import { getAllProducts, type Product } from '../api/products';
import {
  Calendar,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Clock,
  ChevronRight
} from 'lucide-react';

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, productsData] = await Promise.all([
          getAllEvents(),
          getAllProducts()
        ]);

        const upcomingEvents = eventsData
          .filter(e => new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (upcomingEvents.length > 0) {
          setNextEvent(upcomingEvents[0]);
        }
        setEvents(upcomingEvents.slice(0, 4));

        const availableProducts = productsData
            .filter(p => p.active)
            .slice(0, 3);
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

  const getDaysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col min-h-screen text-white">
      {/* Hero Section - Full viewport with gradient */}
      <section className="min-h-[90vh] relative flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-darker-bg via-dark-bg to-darker-bg">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-mint/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-mint/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(119,241,190,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(119,241,190,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-mint/10 border border-accent-mint/30 rounded-full mb-8">
            <Sparkles size={16} className="text-accent-mint" />
            <span className="text-sm text-accent-mint font-medium">Bureau des Etudiants</span>
          </div>

          <h1 className="text-7xl md:text-9xl font-koulen text-white mb-6 tracking-tight">
            <span className="text-accent-mint">ADIIL</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-montserrat">
            Association du Département Informatique de l'IUT de Laval
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-koulen text-accent-mint">{events.length}+</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Events a venir</div>
            </div>
            <div className="w-px h-12 bg-gray-800 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl font-koulen text-accent-mint">{products.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Produits dispo</div>
            </div>
            <div className="w-px h-12 bg-gray-800 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl font-koulen text-accent-mint">100%</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Pour les etudiants</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/events"
              className="group px-8 py-4 bg-accent-mint text-darker-bg font-bold text-lg rounded-xl hover:bg-white transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Calendar size={22} />
              Decouvrir les events
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/shop"
              className="px-8 py-4 bg-white/5 backdrop-blur border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <ShoppingBag size={22} />
              Boutique
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-accent-mint rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Next Event Highlight */}
      {nextEvent && (
        <section className="py-6 bg-accent-mint">
          <div className="container mx-auto px-4">
            <Link to={`/events/${nextEvent.id}`} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-darker-bg" />
                  <span className="text-darker-bg font-bold text-sm uppercase tracking-wider">Prochain event</span>
                </div>
                <span className="hidden sm:inline text-darker-bg/70">|</span>
                <span className="text-darker-bg font-bold text-lg">{nextEvent.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden md:inline text-darker-bg/80 text-sm">
                  Dans {getDaysUntil(nextEvent.date)} jours
                </span>
                <ArrowRight size={20} className="text-darker-bg group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Events Section - Horizontal scroll */}
      <section className="py-20 bg-darker-bg">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Calendrier</span>
              <h2 className="text-4xl md:text-5xl font-koulen text-white mt-2">NOS EVENTS</h2>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-accent-mint transition-colors group">
              <span className="text-sm font-medium">Tout voir</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-dark-bg rounded-2xl border border-gray-800">
              <Calendar size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500">Aucun evenement prevu pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {events.map((event, index) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className={`group block ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                >
                  <article className={`bg-dark-bg rounded-2xl border border-gray-800 hover:border-accent-mint/50 transition-all duration-300 overflow-hidden h-full flex flex-col hover:-translate-y-1`}>
                    <div className={`${index === 0 ? 'h-64 md:h-80' : 'h-40'} bg-gray-800 relative overflow-hidden`}>
                      <img
                        src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=111&color=77F1BE&size=512&font-size=0.33`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded-full">
                            {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          {event.price === 0 && (
                            <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-full">
                              Gratuit
                            </span>
                          )}
                        </div>
                        <h3 className={`font-bold text-white ${index === 0 ? 'text-2xl' : 'text-lg'}`}>{event.title}</h3>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center text-gray-500 text-sm">
                        <MapPin size={14} className="mr-2" />
                        {event.location}
                      </div>
                      <ChevronRight size={18} className="text-accent-mint group-hover:translate-x-1 transition-transform" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          <Link to="/events" className="sm:hidden flex items-center justify-center gap-2 mt-6 text-accent-mint">
            <span className="text-sm font-medium">Voir tous les evenements</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Shop Section - Snacks & Drinks */}
      <section className="py-20 bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Boutique</span>
            <h2 className="text-4xl md:text-5xl font-koulen text-white mt-2 mb-4">
              SNACKS & DRINKS
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-montserrat">
              Un petit creux entre deux cours ? Boissons fraîches et snacks disponibles pour les étudiants.
            </p>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to="/shop"
                  className="block group"
                >
                  <div className="bg-darker-bg rounded-xl border border-gray-800 hover:border-accent-mint/30 transition-all duration-300 overflow-hidden p-2">
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-2">
                      <img
                        src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=222&color=fff`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-medium text-white truncate">{product.name}</p>
                    <p className="text-xs text-accent-mint font-bold">{product.price}€</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed border-gray-800 rounded-2xl max-w-md mx-auto">
              <ShoppingBag size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Boutique bientôt disponible</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors group"
            >
              <ShoppingBag size={18} />
              Voir tous les produits
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-darker-bg border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-koulen text-2xl text-accent-mint mb-1">ADIIL</h3>
              <p className="text-gray-500 text-sm font-montserrat">
                Association du Département Informatique de l'IUT de Laval
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/events" className="text-gray-400 hover:text-accent-mint transition-colors text-sm">Events</Link>
              <Link to="/shop" className="text-gray-400 hover:text-accent-mint transition-colors text-sm">Boutique</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;