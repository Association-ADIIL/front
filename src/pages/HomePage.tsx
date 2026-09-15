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
    <div className="flex flex-col min-h-screen text-white bg-darker-bg">
      <SEO url="/" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-darker-bg py-16 lg:py-24">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent-mint/8 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-accent-mint/5 rounded-full blur-[100px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
          <div className="absolute -bottom-20 right-1/3 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] animate-[pulse_10s_ease-in-out_infinite_4s]" />
        </div>

        {/* Diagonal lines pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(119,241,190,0.5) 40px,
            rgba(119,241,190,0.5) 41px
          )`
        }} />

        {/* Floating code snippets */}
        <div className="absolute top-20 right-[52%] hidden xl:block opacity-20 font-mono text-xs text-accent-mint/60 animate-[float_6s_ease-in-out_infinite] pointer-events-none">
          <div className="bg-darker-bg/80 backdrop-blur border border-accent-mint/20 rounded-lg p-3">
            <span className="text-gray-500">// student life</span><br/>
            <span className="text-purple-400">const</span> mood = <span className="text-amber-400">"caffeinated"</span>;
          </div>
        </div>
        <div className="absolute top-1/2 right-[5%] hidden xl:block opacity-20 font-mono text-xs text-accent-mint/60 animate-[float_8s_ease-in-out_infinite_1s] pointer-events-none">
          <div className="bg-darker-bg/80 backdrop-blur border border-accent-mint/20 rounded-lg p-3">
            <span className="text-purple-400">while</span>(studying) {"{"}<br/>
            &nbsp;&nbsp;snacks++;<br/>
            {"}"}
          </div>
        </div>

        {/* Main Hero Container */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left column - Main content */}
            <div className="lg:col-span-7 flex flex-col justify-center">

              {/* Terminal badge */}
              <div className="inline-flex items-center gap-2 mb-6 self-start">
                <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-800 rounded-lg font-mono text-sm">
                  <Terminal size={14} className="text-accent-mint" />
                  <span className="text-gray-500">$</span>
                  <span className="text-white">cd</span>
                  <span className="text-accent-mint">/vie-etudiante</span>
                  <span className="w-2 h-4 bg-accent-mint/80 animate-[blink_1s_step-end_infinite] ml-1" />
                </div>
              </div>

              {/* Title */}
              <div className="relative mb-6">
                <h1 className="text-5xl sm:text-7xl lg:text-8xl font-koulen leading-[0.9] tracking-tight">
                  <span className="text-white block mb-1">L'ASSO</span>
                  <span className="text-accent-mint block relative inline-block">
                    ADIIL
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent-mint/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                      <path d="M0,6 Q50,0 100,6 T200,6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="text-base sm:text-lg text-gray-400 max-w-xl mb-8 leading-relaxed">
                <span className="text-white font-medium">Association du Département Informatique</span> de l'IUT de Laval.
                Events, snacks et bonne ambiance pour tous les étudiants.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  to="/events"
                  className="group relative px-7 py-3.5 bg-accent-mint text-darker-bg font-bold text-base rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(119,241,190,0.3)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Calendar size={18} />
                    Voir les events
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/shop"
                  className="group px-7 py-3.5 bg-transparent border border-gray-700 text-white font-bold text-base rounded-xl hover:border-accent-mint/50 hover:bg-accent-mint/5 transition-all duration-300 flex items-center gap-2"
                >
                  <Coffee size={18} />
                  Boutique
                </Link>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-dark-bg border border-gray-800/80 rounded-full text-xs sm:text-sm">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-white font-bold">{events.length}+</span>
                  <span className="text-gray-400">events</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-dark-bg border border-gray-800/80 rounded-full text-xs sm:text-sm">
                  <ShoppingBag size={14} className="text-accent-mint" />
                  <span className="text-white font-bold">{totalProductsCount}</span>
                  <span className="text-gray-400">produits</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-dark-bg border border-gray-800/80 rounded-full text-xs sm:text-sm">
                  <span>🎓</span>
                  <span className="text-gray-400">100% étudiant</span>
                </div>
              </div>
            </div>

            {/* Right column - Cards visual layout */}
            <div className="lg:col-span-5 relative mt-8 lg:mt-0">
              <div className="relative w-full max-w-md mx-auto">

                {/* Main event card */}
                {nextEvent && (
                  <Link
                    to={`/events/${nextEvent.id}`}
                    className="group block w-full transition-transform duration-300 hover:-translate-y-1 relative z-10"
                  >
                    <div className="bg-dark-bg border border-gray-800 rounded-2xl overflow-hidden shadow-xl hover:border-accent-mint/40 transition-colors pb-14 sm:pb-16">
                      <div className="relative h-48 sm:h-56 overflow-hidden">
                        <img
                          src={nextEvent.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(nextEvent.title)}&background=111&color=77F1BE&size=512`}
                          alt={nextEvent.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded-full flex items-center gap-1 shadow">
                            <Clock size={12} />
                            Dans {getDaysUntil(nextEvent.date)}j
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-accent-mint text-xs font-bold uppercase tracking-wider mb-1">Prochain event</p>
                        <h3 className="text-white font-bold text-lg sm:text-xl mb-2 group-hover:text-accent-mint transition-colors">{nextEvent.title}</h3>
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin size={14} className="mr-1.5 text-accent-mint shrink-0" />
                          <span>{nextEvent.location}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Mini product card floating on bottom right */}
                {products.length > 0 && (
                  <Link
                    to="/shop"
                    className="group block w-[calc(100%-2rem)] sm:w-72 absolute bottom-3 right-3 sm:-bottom-4 sm:-right-4 z-20 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="bg-darker-bg/95 backdrop-blur-md border border-gray-700/80 rounded-xl p-3.5 shadow-2xl hover:border-accent-mint/60 transition-colors">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                          <img
                            src={products[0]?.imageUrl || 'https://ui-avatars.com/api/?name=S&background=222&color=fff'}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Boutique</p>
                          <p className="text-white font-bold text-xs sm:text-sm truncate">{totalProductsCount} produits dispo</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                        <span className="text-gray-400 text-[11px]">Snacks & Drinks</span>
                        <span className="text-accent-mint font-semibold text-[11px] flex items-center gap-1 group-hover:gap-1.5 transition-all">
                          Découvrir <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </Link>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </section>

      {/* Next Event Banner */}
      {nextEvent && (
        <section className="py-3 bg-gradient-to-r from-accent-mint via-emerald-400 to-accent-mint relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />

          <div className="container mx-auto px-4 relative z-10">
            <Link to={`/events/${nextEvent.id}`} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-darker-bg/20 rounded-md">
                  <Zap size={13} className="text-darker-bg" />
                  <span className="text-darker-bg font-bold text-xs uppercase tracking-wider">Prochain</span>
                </div>
                <span className="text-darker-bg font-bold text-sm sm:text-base truncate">{nextEvent.title}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden md:flex items-center gap-1.5 text-darker-bg/80 text-xs font-semibold">
                  <Clock size={13} />
                  Dans {getDaysUntil(nextEvent.date)}j
                </span>
                <div className="w-7 h-7 bg-darker-bg/20 rounded-md flex items-center justify-center group-hover:bg-darker-bg/30 transition-colors">
                  <ArrowRight size={14} className="text-darker-bg group-hover:translate-x-0.5 transition-transform" />
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
      <section className="py-16 sm:py-24 bg-darker-bg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-mint/3 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-end justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1 h-10 bg-accent-mint rounded-full hidden sm:block" />
              <div>
                <span className="text-accent-mint text-xs font-bold uppercase tracking-wider block">Calendrier</span>
                <h2 className="text-3xl sm:text-5xl font-koulen text-white mt-1">
                  NOS <span className="text-accent-mint">EVENTS</span>
                </h2>
              </div>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-800 rounded-xl text-gray-400 hover:text-accent-mint hover:border-accent-mint/30 transition-all group text-sm font-medium">
              <span>Tout voir</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-dark-bg rounded-2xl border border-gray-800">
              <Calendar size={40} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">Aucun événement prévu pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map((event, index) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className={`group block ${index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                >
                  <article className="bg-dark-bg rounded-2xl border border-gray-800 hover:border-accent-mint/50 transition-all duration-300 overflow-hidden h-full flex flex-col hover:-translate-y-1 hover:shadow-xl">
                    <div className={`${index === 0 ? 'h-56 sm:h-72' : 'h-40'} bg-gray-800 relative overflow-hidden`}>
                      <img
                        src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=111&color=77F1BE&size=512&font-size=0.33`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/30 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2.5 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded-lg flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          {event.price === 0 && (
                            <span className="px-2.5 py-1 bg-green-500/20 backdrop-blur text-green-400 text-xs font-bold rounded-lg border border-green-500/30">
                              Gratuit
                            </span>
                          )}
                          {event.visibility === 'DRAFT' && (
                            <span className="px-2.5 py-1 bg-yellow-500/90 text-yellow-100 text-xs font-bold rounded-lg">
                              Brouillon
                            </span>
                          )}
                          {event.visibility === 'PRIVATE' && (
                            <span className="px-2.5 py-1 bg-purple-500/90 text-purple-100 text-xs font-bold rounded-lg">
                              Privé
                            </span>
                          )}
                        </div>
                        <h3 className={`font-bold text-white ${index === 0 ? 'text-xl sm:text-2xl' : 'text-base'}`}>{event.title}</h3>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-t border-gray-800/60 mt-auto">
                      <div className="flex items-center text-gray-400 text-xs sm:text-sm truncate mr-2">
                        <MapPin size={14} className="mr-1.5 text-accent-mint shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-accent-mint/10 flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors shrink-0">
                        <ChevronRight size={14} className="text-accent-mint group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          <Link to="/events" className="sm:hidden flex items-center justify-center gap-2 mt-6 px-5 py-3 bg-dark-bg border border-gray-800 rounded-xl text-accent-mint text-sm font-medium">
            <span>Voir tous les événements</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Shop Section */}
      <section className="py-16 sm:py-24 bg-dark-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-amber-500/3 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-accent-mint/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1 h-10 bg-gradient-to-b from-accent-mint to-amber-500 rounded-full hidden sm:block" />
              <div>
                <span className="text-accent-mint text-xs font-bold uppercase tracking-wider block">Boutique</span>
                <h2 className="text-3xl sm:text-5xl font-koulen text-white mt-1">
                  SNACKS & <span className="text-accent-mint">DRINKS</span>
                </h2>
              </div>
            </div>
            <p className="text-gray-400 text-sm max-w-md md:text-right">
              Un petit creux entre deux cours ? Boissons fraîches et snacks disponibles.
            </p>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to="/shop"
                  className="block group"
                >
                  <div className="bg-darker-bg rounded-xl border border-gray-800 hover:border-accent-mint/30 transition-all duration-300 overflow-hidden p-3 hover:-translate-y-1 hover:shadow-lg">
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-2">
                      <img
                        src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=222&color=fff`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-medium text-white truncate mb-1">{product.name}</p>
                    {(() => {
                      const now = new Date();
                      const activePromo = product.productPromotions?.find(pp => {
                        const p = pp.promotion;
                        if (!p.isActive) return false;
                        if (p.startDate && new Date(p.startDate) > now) return false;
                        if (p.endDate && new Date(p.endDate) < now) return false;
                        return p.type === 'PERCENTAGE_DISCOUNT' || p.type === 'PRODUCT_DISCOUNT';
                      });
                      const discountPercent = activePromo ? (activePromo.promotion.rules as any).discountPercent : null;
                      const discountedPrice = discountPercent ? Math.round(product.price * (1 - discountPercent / 100) * 100) / 100 : null;
                      return discountedPrice ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 line-through">{product.price}€</span>
                          <span className="text-xs text-red-400 font-bold">{discountedPrice}€</span>
                        </div>
                      ) : (
                        <p className="text-xs text-accent-mint font-bold">{product.price}€</p>
                      );
                    })()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 bg-darker-bg border border-gray-800 rounded-2xl max-w-md mx-auto">
              <div className="w-12 h-12 bg-accent-mint/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={24} className="text-accent-mint" />
              </div>
              <p className="text-gray-400 text-sm">Boutique bientôt disponible</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-all duration-300 group text-sm"
            >
              <Coffee size={18} />
              Voir tous les produits
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;