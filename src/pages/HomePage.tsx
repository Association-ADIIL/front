import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents, type Event } from '../api/events';
import { getAllProducts, type Product } from '../api/products';
import SEO from '../components/SEO';
import {
  Calendar,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Clock,
  ChevronRight,
  Terminal,
  Zap,
  Coffee
} from 'lucide-react';
import { logger } from '../utils/logger';

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

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

        const activeProducts = productsData.filter(p => p.active);
        setTotalProductsCount(activeProducts.length);
        setProducts(activeProducts.slice(0, 12));
      } catch (err) {
        logger.error('Failed to fetch data', err);
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
      <SEO url="/" />

      {/* Hero Section - Asymmetric Tech Design */}
      <section className="min-h-screen relative overflow-hidden bg-darker-bg">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent-mint/8 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-accent-mint/5 rounded-full blur-[100px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
          <div className="absolute -bottom-20 right-1/3 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] animate-[pulse_10s_ease-in-out_infinite_4s]" />
        </div>

        {/* Diagonal lines pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(119,241,190,0.5) 40px,
            rgba(119,241,190,0.5) 41px
          )`
        }} />

        {/* Floating code snippets - decorative */}
        <div className="absolute top-28 right-[52%] hidden xl:block opacity-20 font-mono text-xs text-accent-mint/60 animate-[float_6s_ease-in-out_infinite]">
          <div className="bg-darker-bg/80 backdrop-blur border border-accent-mint/20 rounded-lg p-3">
            <span className="text-gray-500">// student life</span><br/>
            <span className="text-purple-400">const</span> mood = <span className="text-amber-400">"caffeinated"</span>;
          </div>
        </div>
        <div className="absolute top-1/2 right-[5%] hidden xl:block opacity-20 font-mono text-xs text-accent-mint/60 animate-[float_8s_ease-in-out_infinite_1s]">
          <div className="bg-darker-bg/80 backdrop-blur border border-accent-mint/20 rounded-lg p-3">
            <span className="text-purple-400">while</span>(studying) {"{"}<br/>
            &nbsp;&nbsp;snacks++;<br/>
            {"}"}
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 container mx-auto px-4 pt-20 pb-32 lg:pt-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Left column - Main content */}
            <div className="order-2 lg:order-1">
              {/* Terminal-style badge */}
              <div className="inline-flex items-center gap-2 mb-8 group">
                <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-800 rounded-lg font-mono text-sm">
                  <Terminal size={14} className="text-accent-mint" />
                  <span className="text-gray-500">$</span>
                  <span className="text-white">cd</span>
                  <span className="text-accent-mint">/vie-etudiante</span>
                  <span className="w-2 h-4 bg-accent-mint/80 animate-[blink_1s_step-end_infinite] ml-1" />
                </div>
              </div>

              {/* Main title with creative treatment */}
              <div className="relative mb-6">
                <h1 className="text-[4rem] sm:text-[5.5rem] lg:text-[7rem] font-koulen leading-[0.85] tracking-tight">
                  <span className="text-white block">L'ASSO</span>
                  <span className="text-accent-mint block relative">
                    ADIIL
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent-mint/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                      <path d="M0,6 Q50,0 100,6 T200,6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </span>
                </h1>
                {/* Decorative bracket */}
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-mint via-accent-mint/50 to-transparent hidden lg:block" />
              </div>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
                <span className="text-white font-medium">Association du Département Informatique</span> de l'IUT de Laval.
                Events, snacks et bonne ambiance pour tous les étudiants.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <Link
                  to="/events"
                  className="group relative px-8 py-4 bg-accent-mint text-darker-bg font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(119,241,190,0.3)]"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Calendar size={20} />
                    Voir les events
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                <Link
                  to="/shop"
                  className="group px-8 py-4 bg-transparent border-2 border-gray-700 text-white font-bold text-lg rounded-xl hover:border-accent-mint/50 hover:bg-accent-mint/5 transition-all duration-300 flex items-center gap-3"
                >
                  <Coffee size={20} />
                  Boutique
                </Link>
              </div>

              {/* Stats in horizontal pills */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg/80 border border-gray-800 rounded-full">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-white font-bold">{events.length}+</span>
                  <span className="text-gray-500 text-sm">events</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg/80 border border-gray-800 rounded-full">
                  <ShoppingBag size={14} className="text-accent-mint" />
                  <span className="text-white font-bold">{totalProductsCount}</span>
                  <span className="text-gray-500 text-sm">produits</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg/80 border border-gray-800 rounded-full">
                  <span className="text-lg">🎓</span>
                  <span className="text-gray-500 text-sm">100% étudiant</span>
                </div>
              </div>
            </div>

            {/* Right column - Visual elements */}
            <div className="order-1 lg:order-2 relative">
              {/* Floating cards stack */}
              <div className="relative h-[400px] lg:h-[500px]">
                {/* Background decorative card */}
                <div className="absolute top-8 right-0 w-[280px] sm:w-[320px] h-[200px] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 transform rotate-6 translate-x-4" />

                {/* Main event preview card */}
                {nextEvent && (
                  <Link
                    to={`/events/${nextEvent.id}`}
                    className="absolute top-0 left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 w-[300px] sm:w-[340px] group"
                  >
                    <div className="bg-dark-bg border border-gray-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-accent-mint/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={nextEvent.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(nextEvent.title)}&background=111&color=77F1BE&size=512`}
                          alt={nextEvent.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/20 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-3 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded-full flex items-center gap-1">
                            <Clock size={12} />
                            Dans {getDaysUntil(nextEvent.date)}j
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-accent-mint text-xs font-bold uppercase tracking-wider mb-2">Prochain event</p>
                        <h3 className="text-white font-bold text-xl mb-2 group-hover:text-accent-mint transition-colors">{nextEvent.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm">
                          <MapPin size={14} className="mr-2" />
                          {nextEvent.location}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Mini product preview card */}
                {products.length > 0 && (
                  <Link
                    to="/shop"
                    className="absolute bottom-8 right-0 lg:right-8 w-[200px] group hidden sm:block"
                  >
                    <div className="bg-dark-bg/95 backdrop-blur border border-gray-800 rounded-xl p-4 shadow-xl transition-all duration-300 hover:border-accent-mint/30 hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800">
                          <img
                            src={products[0]?.imageUrl || 'https://ui-avatars.com/api/?name=S&background=222&color=fff'}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Boutique</p>
                          <p className="text-white font-bold text-sm">{totalProductsCount} produits</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Snacks & Drinks</span>
                        <span className="text-accent-mint flex items-center gap-1 group-hover:gap-2 transition-all">
                          Voir <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Decorative elements */}
                <div className="absolute bottom-0 left-8 w-20 h-20 border-2 border-dashed border-gray-800 rounded-full hidden lg:flex items-center justify-center">
                  <div className="w-3 h-3 bg-accent-mint rounded-full animate-ping" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent animate-[bounce_2s_ease-in-out_infinite]" />
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </section>

      {/* Next Event Highlight */}
      {nextEvent && (
        <section className="py-4 bg-gradient-to-r from-accent-mint via-emerald-400 to-accent-mint relative overflow-hidden">
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />

          <div className="container mx-auto px-4 relative z-10">
            <Link to={`/events/${nextEvent.id}`} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-darker-bg/20 rounded-lg">
                  <Zap size={14} className="text-darker-bg" />
                  <span className="text-darker-bg font-bold text-xs uppercase tracking-wider">Prochain</span>
                </div>
                <span className="text-darker-bg font-bold text-lg">{nextEvent.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden md:flex items-center gap-2 text-darker-bg/80 text-sm font-medium">
                  <Clock size={14} />
                  Dans {getDaysUntil(nextEvent.date)}j
                </span>
                <div className="w-8 h-8 bg-darker-bg/20 rounded-lg flex items-center justify-center group-hover:bg-darker-bg/30 transition-colors">
                  <ArrowRight size={16} className="text-darker-bg group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </section>
      )}

      {/* Events Section */}
      <section className="py-20 bg-darker-bg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-mint/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/3 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-end justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1 h-12 bg-accent-mint rounded-full hidden sm:block" />
              <div>
                <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Calendrier</span>
                <h2 className="text-4xl md:text-5xl font-koulen text-white mt-1">
                  NOS <span className="text-accent-mint">EVENTS</span>
                </h2>
              </div>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-800 rounded-xl text-gray-400 hover:text-accent-mint hover:border-accent-mint/30 transition-all group">
              <span className="text-sm font-medium">Tout voir</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
                  <article className="bg-dark-bg rounded-2xl border border-gray-800 hover:border-accent-mint/50 transition-all duration-300 overflow-hidden h-full flex flex-col hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                    <div className={`${index === 0 ? 'h-64 md:h-80' : 'h-40'} bg-gray-800 relative overflow-hidden`}>
                      <img
                        src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=111&color=77F1BE&size=512&font-size=0.33`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/30 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded-lg flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          {event.price === 0 && (
                            <span className="px-3 py-1 bg-green-500/20 backdrop-blur text-green-400 text-xs font-bold rounded-lg border border-green-500/30">
                              Gratuit
                            </span>
                          )}
                          {event.visibility === 'DRAFT' && (
                            <span className="px-3 py-1 bg-yellow-500/90 text-yellow-100 text-xs font-bold rounded-lg">
                              Brouillon
                            </span>
                          )}
                          {event.visibility === 'PRIVATE' && (
                            <span className="px-3 py-1 bg-purple-500/90 text-purple-100 text-xs font-bold rounded-lg">
                              Prive
                            </span>
                          )}
                        </div>
                        <h3 className={`font-bold text-white ${index === 0 ? 'text-2xl' : 'text-lg'}`}>{event.title}</h3>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-t border-gray-800/50">
                      <div className="flex items-center text-gray-500 text-sm">
                        <MapPin size={14} className="mr-2 text-accent-mint/70" />
                        {event.location}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-accent-mint/10 flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors">
                        <ChevronRight size={16} className="text-accent-mint group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          <Link to="/events" className="sm:hidden flex items-center justify-center gap-2 mt-8 px-6 py-3 bg-dark-bg border border-gray-800 rounded-xl text-accent-mint">
            <span className="text-sm font-medium">Voir tous les evenements</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Shop Section - Snacks & Drinks */}
      <section className="py-20 bg-dark-bg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-amber-500/3 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-accent-mint/3 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-1 h-12 bg-gradient-to-b from-accent-mint to-amber-500 rounded-full hidden sm:block" />
              <div>
                <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Boutique</span>
                <h2 className="text-4xl md:text-5xl font-koulen text-white mt-1">
                  SNACKS & <span className="text-accent-mint">DRINKS</span>
                </h2>
              </div>
            </div>
            <p className="text-gray-400 max-w-md font-montserrat md:text-right">
              Un petit creux entre deux cours ? Boissons fraîches et snacks disponibles.
            </p>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to="/shop"
                  className="block group"
                >
                  <div className="bg-darker-bg rounded-xl border border-gray-800 hover:border-accent-mint/30 transition-all duration-300 overflow-hidden p-3 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-2">
                      <img
                        src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=222&color=fff`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <p className="text-xs font-medium text-white truncate">{product.name}</p>
                    <p className="text-sm text-accent-mint font-bold">{product.price}€</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-darker-bg border border-gray-800 rounded-2xl max-w-md mx-auto">
              <div className="w-16 h-16 bg-accent-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} className="text-accent-mint" />
              </div>
              <p className="text-gray-400 text-sm">Boutique bientot disponible</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 px-8 py-4 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(119,241,190,0.2)] group"
            >
              <Coffee size={20} />
              Voir tous les produits
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;