import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, type Event } from '../api/events';
import { Calendar, MapPin, ArrowLeft, Users, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventRegistrationModal from '../components/EventRegistrationModal';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const data = await getEventById(id);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setError("Impossible de charger les détails de l'événement.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-mint"></div></div>;

  if (error || !event) return (
      <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl text-red-400 mb-4">{error || "Événement non trouvé"}</h2>
          <Link to="/events" className="text-accent-mint hover:underline flex items-center justify-center gap-2">
             <ArrowLeft size={20} /> Retour aux événements
          </Link>
      </div>
  );

  const eventDate = new Date(event.date);
  const isPassed = eventDate < new Date();
  const isFull = event.registeredPeople >= event.totalPlaces;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/events" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
         <ArrowLeft size={20} className="mr-2" /> Retour aux événements
      </Link>
      
      <div className="card p-0 overflow-hidden mb-8">
          <div className="h-64 md:h-80 w-full relative">
              <img 
                src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=0D8ABC&color=fff&size=800&font-size=0.33`} 
                alt={event.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-darker-bg to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                  <h1 className="text-3xl md:text-5xl font-bold mb-2 font-koulen text-white drop-shadow-lg">{event.title}</h1>
                  <div className="flex flex-wrap gap-4 text-gray-200">
                      <span className="flex items-center bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                          <Calendar size={18} className="mr-2 text-accent-mint" />
                          {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                          <MapPin size={18} className="mr-2 text-accent-mint" />
                          {event.location}
                      </span>
                  </div>
              </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                  <div>
                      <h2 className="text-2xl font-bold mb-4 text-accent-mint">À propos de l'événement</h2>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-6">
                      <h3 className="text-xl font-bold mb-4">Informations Pratiques</h3>
                      <ul className="space-y-3 text-gray-300">
                          <li className="flex items-center">
                              <Clock size={20} className="mr-3 text-accent-mint" />
                              Date limite d'inscription : {new Date(event.registrationDeadline).toLocaleDateString('fr-FR')}
                          </li>
                          <li className="flex items-center">
                              <Users size={20} className="mr-3 text-accent-mint" />
                              Inscrits : {event.registeredPeople} / {event.totalPlaces}
                          </li>
                      </ul>
                  </div>
              </div>
              
              <div className="md:col-span-1">
                  <div className="bg-dark-bg p-6 rounded-xl border border-gray-700 sticky top-24">
                      <h3 className="text-xl font-bold mb-4 text-center">Inscription</h3>
                      
                      <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                              <span>Prix</span>
                              <span className="font-bold text-accent-mint">{event.price === 0 ? 'Gratuit' : `${event.price} €`}</span>
                          </div>
                      </div>

                      {isPassed ? (
                          <button disabled className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded cursor-not-allowed">
                              Événement terminé
                          </button>
                      ) : isFull ? (
                          <button disabled className="w-full bg-status-full text-white font-bold py-3 px-4 rounded cursor-not-allowed">
                              Complet
                          </button>
                      ) : (
                          <button 
                              onClick={() => !user ? window.location.href = '/login' : setIsModalOpen(true)}
                              className="w-full bg-accent-mint text-darker-bg font-bold py-3 px-4 rounded hover:bg-white transition-colors"
                          >
                              {user ? "S'inscrire maintenant" : "Se connecter pour s'inscrire"}
                          </button>
                      )}
                      
                      {!user && !isPassed && (
                          <p className="text-xs text-center mt-3 text-gray-500">
                              Vous devez être connecté pour vous inscrire.
                          </p>
                      )}
                  </div>
              </div>
          </div>
      </div>
      
      <EventRegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        event={event} 
      />
    </div>
  );
};

export default EventDetailPage;