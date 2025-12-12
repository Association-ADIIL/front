import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents, type Event } from '../api/events';
import { Calendar, MapPin, Users } from 'lucide-react';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAllEvents();
        // Sort by date (nearest first)
        const sortedEvents = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(sortedEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setError("Impossible de charger les événements.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-accent-mint mb-6 font-koulen">Nos Evenements</h1>
      <p className="text-lg mb-8 text-gray-300">Découvrez les prochains événements organisés par l'ADIIL.</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-mint"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-darker-bg rounded-lg border border-red-900/50">
          <p className="text-red-400">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-darker-bg rounded-2xl border border-gray-800">
          <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Aucun événement à venir pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const isPassed = eventDate < new Date();
            const isFull = event.registeredPeople >= event.totalPlaces;

            return (
              <div key={event.id} className={`card p-6 flex flex-col h-full hover:shadow-lg transition-shadow border border-gray-800 hover:border-accent-mint/30 ${isPassed ? 'opacity-70 grayscale' : ''}`}>
                <div className="h-40 mb-4 overflow-hidden rounded-md bg-dark-bg relative">
                   <img 
                      src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=0D8ABC&color=fff&size=400&font-size=0.33`} 
                      alt={event.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                   />
                   {isPassed && (
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                           <span className="text-white font-bold text-xl uppercase border-2 border-white px-4 py-2 rotate-12">Terminé</span>
                       </div>
                   )}
                </div>
                
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
                
                <div className="flex items-center text-gray-400 mb-2 text-sm">
                   <Calendar size={16} className="mr-2 text-accent-mint" />
                   <span>{eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                
                <div className="flex items-center text-gray-400 mb-4 text-sm">
                    <MapPin size={16} className="mr-2 text-accent-mint" />
                    <span className="truncate">{event.location}</span>
                </div>

                <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">{event.description}</p>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users size={16} className={isFull ? "text-red-400" : "text-green-400"} />
                        <span className={`font-bold ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                            {isFull ? 'Complet' : `${event.registeredPeople}/${event.totalPlaces} inscrits`}
                        </span>
                      </div>
                      <span className="font-bold">{event.price === 0 ? 'Gratuit' : `${event.price} €`}</span>
                  </div>
                  
                  <Link to={`/events/${event.id}`} className={`block w-full text-center font-bold py-2 px-4 rounded transition-colors ${isPassed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-accent-mint text-darker-bg hover:bg-white'}`}>
                     {isPassed ? 'Événement passé' : 'Voir Détails'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;