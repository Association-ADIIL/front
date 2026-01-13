import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents, type Event } from '../api/events';
import { Calendar, MapPin, Users, ChevronRight, Filter } from 'lucide-react';
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
      <section className="bg-darker-bg py-16 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Calendrier</span>
              <h1 className="text-5xl md:text-6xl font-koulen text-white mt-2">NOS EVENTS</h1>
              <p className="text-gray-400 mt-4 max-w-xl font-montserrat">
                Découvrez les événements organisés par l'ADIIL. Soirées, sorties, tournois... Il y en a pour tous les goûts !
              </p>
            </div>
            <div className="flex-shrink-0 relative">
              <BalanceDisplay variant="compact" showRechargeButton={true} />
              <BonusBubble variant="overlay" className="-top-3 -right-3" />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mt-8">
            <Filter size={16} className="text-gray-500" />
            <div className="flex bg-dark-bg rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === 'upcoming'
                    ? 'bg-accent-mint text-darker-bg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                À venir ({upcomingCount})
              </button>
              <button
                onClick={() => setFilter('passed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === 'passed'
                    ? 'bg-accent-mint text-darker-bg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Passés ({passedCount})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-accent-mint text-darker-bg'
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
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-darker-bg rounded-2xl border border-gray-800">
              <Calendar size={56} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-400 text-lg font-montserrat">
                {filter === 'upcoming' ? "Aucun événement à venir pour le moment." :
                 filter === 'passed' ? "Aucun événement passé." :
                 "Aucun événement."}
              </p>
            </div>
          ) : (
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
                    <article className={`bg-darker-bg rounded-2xl border border-gray-800 hover:border-accent-mint/50 transition-all duration-300 overflow-hidden h-full flex flex-col hover:-translate-y-1 ${isPassed ? 'opacity-60' : ''}`}>
                      {/* Image */}
                      <div className={`${index === 0 && filter === 'upcoming' ? 'h-64' : 'h-48'} bg-darker-bg relative overflow-hidden`}>
                        <img
                          src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=111&color=77F1BE&size=512&font-size=0.33`}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 origin-bottom"
                        />
                        <div className="absolute inset-0 -bottom-4 bg-gradient-to-t from-darker-bg via-transparent to-transparent"></div>

                        {/* Status badges */}
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded-full">
                            {eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          {isPassed && (
                            <span className="px-3 py-1 bg-gray-800/90 text-gray-300 text-xs font-bold rounded-full border border-gray-600">
                              Terminé
                            </span>
                          )}
                          {!isPassed && !isUnlimited && isFull && (
                            <span className="px-3 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">
                              Complet
                            </span>
                          )}
                          {!isPassed && !isFull && event.price === 0 && (
                            <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-full">
                              Gratuit
                            </span>
                          )}
                          {event.visibility === 'DRAFT' && (
                            <span className="px-3 py-1 bg-yellow-500/90 text-yellow-100 text-xs font-bold rounded-full">
                              Brouillon
                            </span>
                          )}
                          {event.visibility === 'PRIVATE' && (
                            <span className="px-3 py-1 bg-purple-500/90 text-purple-100 text-xs font-bold rounded-full">
                              Prive
                            </span>
                          )}
                        </div>

                        {/* Title overlay */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className={`font-bold text-white ${index === 0 && filter === 'upcoming' ? 'text-2xl' : 'text-lg'}`}>
                            {removeAccents(event.title)}
                          </h3>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center text-gray-500 text-sm mb-2">
                          <MapPin size={14} className="mr-2 text-accent-mint" />
                          <span className="truncate">{event.location}</span>
                        </div>

                        <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1 font-montserrat">
                          {event.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                          <div className="flex items-center gap-2">
                            <Users size={16} className={isFull ? "text-red-400" : "text-accent-mint"} />
                            <span className={`text-sm font-medium ${isFull ? 'text-red-400' : 'text-gray-400'}`}>
                              {isUnlimited ? `${event.registeredPeople} inscrits` : `${event.registeredPeople}/${event.totalPlaces}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isPassed && event.price > 0 && (
                              <span className="text-accent-mint font-bold">{event.price} €</span>
                            )}
                            <ChevronRight size={18} className="text-accent-mint group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
