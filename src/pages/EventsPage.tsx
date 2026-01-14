import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents, type Event } from '../api/events';
import { Calendar, MapPin, Users, ChevronRight, Filter, Sparkles } from 'lucide-react';
import BalanceDisplay from '../components/BalanceDisplay';
import BonusBubble from '../components/BonusBubble';
import SEO from '../components/SEO';
import { logger } from '../utils/logger';

type FilterType = 'all' | 'upcoming' | 'passed';

// Fonction pour retirer les accents (pour la police Koulen qui ne les supporte pas)
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('upcoming');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAllEvents();
        const sortedEvents = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(sortedEvents);
      } catch (err) {
        logger.error('Failed to fetch events', err);
        setError("Impossible de charger les événements.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const isPassed = new Date(event.date) < new Date();
    if (filter === 'upcoming') return !isPassed;
    if (filter === 'passed') return isPassed;
    return true;
  });

  const upcomingCount = events.filter(e => new Date(e.date) >= new Date()).length;
  const passedCount = events.filter(e => new Date(e.date) < new Date()).length;

  return (
    <div className="min-h-screen">
      <SEO
        title="Evenements"
        description="Decouvrez les evenements organises par l'ADIIL a l'IUT de Laval. Soirees, sorties, tournois et activites pour les etudiants du Departement Informatique."
        url="/events"
      />
      {/* Header Section */}
      <section className="bg-darker-bg py-16 border-b border-gray-800 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-accent-mint/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
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
                <Sparkles size={14} className="text-accent-mint" />
                <span className="text-xs text-accent-mint font-medium">Calendrier ADIIL</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-koulen text-white">
                NOS <span className="text-accent-mint">EVENTS</span>
              </h1>
              <p className="text-gray-400 mt-4 max-w-xl font-montserrat">
                Soirées, sorties, tournois... Découvrez les événements organisés par l'ADIIL. Il y en a pour tous les goûts !
              </p>
            </div>
            <div className="flex-shrink-0 relative overflow-visible">
              <BalanceDisplay variant="compact" showRechargeButton={true} />
              <BonusBubble variant="overlay" className="-top-3 -right-3" />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-3 mt-8">
            <Filter size={16} className="text-gray-500" />
            <div className="flex bg-dark-bg rounded-xl p-1.5 border border-gray-800">
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'upcoming'
                    ? 'bg-accent-mint text-darker-bg shadow-lg shadow-accent-mint/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                A venir ({upcomingCount})
              </button>
              <button
                onClick={() => setFilter('passed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'passed'
                    ? 'bg-accent-mint text-darker-bg shadow-lg shadow-accent-mint/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Passes ({passedCount})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-accent-mint text-darker-bg shadow-lg shadow-accent-mint/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tous ({events.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 bg-dark-bg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-accent-mint/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-0 w-[250px] h-[250px] bg-purple-500/3 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-darker-bg rounded-2xl border border-red-900/30">
              <p className="text-red-400 font-montserrat">{error}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-darker-bg rounded-2xl border border-gray-800">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-400 text-lg font-montserrat">
                {filter === 'upcoming' ? "Aucun evenement a venir pour le moment." :
                 filter === 'passed' ? "Aucun evenement passe." :
                 "Aucun evenement."}
              </p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between bg-darker-bg/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-800/50 mb-8">
                <p className="text-gray-400 text-sm">
                  <span className="text-accent-mint font-bold">{filteredEvents.length}</span> evenement{filteredEvents.length > 1 ? 's' : ''}
                  {filter === 'upcoming' && ' a venir'}
                  {filter === 'passed' && ' passes'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, index) => {
                  const eventDate = new Date(event.date);
                  const isPassed = eventDate < new Date();
                  const isUnlimited = event.totalPlaces === 0;
                  const isFull = !isUnlimited && event.registeredPeople >= event.totalPlaces;

                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className={`group block ${index === 0 && filter === 'upcoming' ? 'md:col-span-2 lg:col-span-2' : ''}`}
                    >
                      <article className={`bg-darker-bg rounded-2xl border border-gray-800 hover:border-accent-mint/50 transition-all duration-300 overflow-hidden h-full flex flex-col hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)] ${isPassed ? 'opacity-70' : ''}`}>
                        {/* Image */}
                        <div className={`${index === 0 && filter === 'upcoming' ? 'h-64' : 'h-48'} bg-gray-900 relative overflow-hidden`}>
                          <img
                            src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=111&color=77F1BE&size=512&font-size=0.33`}
                            alt={event.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-darker-bg via-darker-bg/30 to-transparent"></div>

                          {/* Status badges */}
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 bg-accent-mint text-darker-bg text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg">
                              <Calendar size={12} />
                              {eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            {isPassed && (
                              <span className="px-3 py-1.5 bg-gray-800/90 text-gray-300 text-xs font-bold rounded-lg border border-gray-700">
                                Termine
                              </span>
                            )}
                            {!isPassed && !isUnlimited && isFull && (
                              <span className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg">
                                Complet
                              </span>
                            )}
                            {!isPassed && !isFull && event.price === 0 && (
                              <span className="px-3 py-1.5 bg-green-500/20 backdrop-blur text-green-400 text-xs font-bold rounded-lg border border-green-500/30">
                                Gratuit
                              </span>
                            )}
                            {event.visibility === 'DRAFT' && (
                              <span className="px-3 py-1.5 bg-yellow-500/90 text-yellow-100 text-xs font-bold rounded-lg">
                                Brouillon
                              </span>
                            )}
                            {event.visibility === 'PRIVATE' && (
                              <span className="px-3 py-1.5 bg-purple-500/90 text-purple-100 text-xs font-bold rounded-lg">
                                Prive
                              </span>
                            )}
                          </div>

                          {/* Title overlay */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className={`font-bold text-white group-hover:text-accent-mint transition-colors ${index === 0 && filter === 'upcoming' ? 'text-2xl' : 'text-lg'}`}>
                              {removeAccents(event.title)}
                            </h3>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col border-t border-gray-800/50">
                          <div className="flex items-center text-gray-500 text-sm mb-3">
                            <MapPin size={14} className="mr-2 text-accent-mint/70" />
                            <span className="truncate">{event.location}</span>
                          </div>

                          <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1 font-montserrat">
                            {event.description}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-dark-bg rounded-lg">
                              <Users size={14} className={isFull ? "text-red-400" : "text-accent-mint"} />
                              <span className={`text-xs font-medium ${isFull ? 'text-red-400' : 'text-gray-400'}`}>
                                {isUnlimited ? `${event.registeredPeople} inscrits` : `${event.registeredPeople}/${event.totalPlaces}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isPassed && event.price > 0 && (
                                <span className="text-accent-mint font-bold text-sm">{event.price}€</span>
                              )}
                              <div className="w-8 h-8 rounded-lg bg-accent-mint/10 flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors">
                                <ChevronRight size={16} className="text-accent-mint group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
