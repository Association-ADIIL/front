import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEventById, type Event } from '../api/events';
import { Calendar, MapPin, ArrowLeft, Users, Clock, ChevronRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import EventRegistrationModal from '../components/EventRegistrationModal';
import SEO from '../components/SEO';

// Fonction pour retirer les accents (pour la police Koulen qui ne les supporte pas)
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
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
        logger.error('Failed to fetch event', err);
        setError("Impossible de charger les détails de l'événement.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="text-center">
          <h2 className="text-2xl text-red-400 mb-4 font-montserrat">{error || "Événement non trouvé"}</h2>
          <Link to="/events" className="inline-flex items-center gap-2 text-accent-mint hover:underline">
            <ArrowLeft size={20} /> Retour aux événements
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isPassed = eventDate < new Date();
  const isUnlimited = event.totalPlaces === 0;
  const isFull = !isUnlimited && event.registeredPeople !== null && event.registeredPeople >= event.totalPlaces;
  const deadlineDate = new Date(event.registrationDeadline);
  const isDeadlinePassed = deadlineDate < new Date();
  const spotsLeft = isUnlimited ? Infinity : (event.registeredPeople !== null ? event.totalPlaces - event.registeredPeople : null);

  return (
    <div className="min-h-screen bg-dark-bg">
      <SEO
        title={event.title}
        description={`${event.description.slice(0, 150).replace(/\s+/g, ' ').trim()}... Evenement organise par l'ADIIL a l'IUT de Laval.`}
        keywords={`${event.title}, ADIIL, evenement etudiant, IUT Laval, ${event.location}`}
        url={`/events/${event.id}`}
        type="event"
        image={event.coverImage || undefined}
        imageAlt={`${event.title} - Evenement ADIIL`}
        eventDate={event.date}
        eventLocation={event.location}
        eventPrice={event.price}
      />
      {/* Hero Image */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=111&color=77F1BE&size=1200&font-size=0.33`}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-dark-bg/20"></div>

        {/* Decorative overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(119,241,190,0.5) 40px,
            rgba(119,241,190,0.5) 41px
          )`
        }} />

        {/* Back button */}
        <Link
          to="/events"
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 bg-darker-bg/90 backdrop-blur-md text-white rounded-xl border border-gray-700 hover:border-accent-mint hover:bg-darker-bg transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Retour</span>
        </Link>

        {/* Event title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-4 py-1.5 bg-accent-mint text-darker-bg text-sm font-bold rounded-lg flex items-center gap-2">
                <Calendar size={14} />
                {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isPassed && (
                <span className="px-4 py-1.5 bg-gray-700 text-gray-300 text-sm font-bold rounded-lg">
                  Termine
                </span>
              )}
              {!isPassed && isFull && (
                <span className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-lg">
                  Complet
                </span>
              )}
              {!isPassed && !isFull && event.price === 0 && (
                <span className="px-4 py-1.5 bg-green-500/20 backdrop-blur text-green-400 text-sm font-bold rounded-lg border border-green-500/30">
                  Gratuit
                </span>
              )}
              {event.visibility === 'DRAFT' && (
                <span className="px-4 py-1.5 bg-yellow-500/80 text-yellow-100 text-sm font-bold rounded-lg">
                  Brouillon
                </span>
              )}
              {event.visibility === 'PRIVATE' && (
                <span className="px-4 py-1.5 bg-purple-500/80 text-purple-100 text-sm font-bold rounded-lg">
                  Prive
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-koulen text-white mb-4">{removeAccents(event.title).toUpperCase()}</h1>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={18} className="text-accent-mint" />
              <span className="font-montserrat">{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-mint/3 rounded-full blur-[150px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <section className="bg-darker-bg rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-accent-mint rounded-full" />
                <h2 className="text-2xl font-koulen text-white">DESCRIPTION</h2>
              </div>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-montserrat">
                {event.description}
              </p>
            </section>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-darker-bg rounded-2xl p-6 border border-gray-800 hover:border-accent-mint/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-mint/10 rounded-xl flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors">
                    <Calendar size={24} className="text-accent-mint" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Date</p>
                    <p className="text-white font-medium font-montserrat">
                      {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-darker-bg rounded-2xl p-6 border border-gray-800 hover:border-accent-mint/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-mint/10 rounded-xl flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors">
                    <MapPin size={24} className="text-accent-mint" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Lieu</p>
                    <p className="text-white font-medium font-montserrat">{event.location}</p>
                  </div>
                </div>
              </div>

              <div className="bg-darker-bg rounded-2xl p-6 border border-gray-800 hover:border-accent-mint/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-mint/10 rounded-xl flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors">
                    <Users size={24} className="text-accent-mint" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Participants</p>
                    {event.registeredPeople === null ? (
                      <p className="text-white font-medium">Non communiqué</p>
                    ) : (
                      <p className="text-white font-medium">
                        <span className={isFull ? 'text-red-400' : 'text-accent-mint'}>{event.registeredPeople}</span>
                        {!isUnlimited && <span className="text-gray-500"> / {event.totalPlaces}</span>}
                        {isUnlimited && <span className="text-gray-500"> inscrits</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-darker-bg rounded-2xl p-6 border border-gray-800 hover:border-accent-mint/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-mint/10 rounded-xl flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors">
                    <Clock size={24} className="text-accent-mint" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Date limite</p>
                    <p className={`font-medium font-montserrat ${isDeadlinePassed ? 'text-red-400' : 'text-white'}`}>
                      {deadlineDate.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Registration card */}
          <div className="lg:col-span-1">
            <div className="bg-darker-bg rounded-2xl p-6 border border-gray-800 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-1">Prix</p>
                <p className="text-4xl font-koulen text-accent-mint">
                  {event.price === 0 ? 'GRATUIT' : `${event.price} EUR`}
                </p>
              </div>

              {/* Progress bar - only show if limited places */}
              {!isPassed && !isUnlimited && event.registeredPeople !== null && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Places restantes</span>
                    <span className={`font-bold ${isFull ? 'text-red-400' : 'text-accent-mint'}`}>
                      {spotsLeft} / {event.totalPlaces}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-accent-mint'}`}
                      style={{ width: `${(event.registeredPeople / event.totalPlaces) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action button */}
              {isPassed ? (
                <button
                  disabled
                  className="w-full py-4 px-6 bg-gray-700 text-gray-400 font-bold rounded-xl cursor-not-allowed"
                >
                  Événement terminé
                </button>
              ) : isDeadlinePassed ? (
                <button
                  disabled
                  className="w-full py-4 px-6 bg-gray-700 text-gray-400 font-bold rounded-xl cursor-not-allowed"
                >
                  Inscriptions fermées
                </button>
              ) : isFull ? (
                <button
                  disabled
                  className="w-full py-4 px-6 bg-red-500/20 text-red-400 font-bold rounded-xl cursor-not-allowed border border-red-500/30"
                >
                  Complet
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!user) {
                        sessionStorage.setItem('postAuthRedirect', `/events/${event.id}`);
                      addNotification('info', 'Connectez-vous pour vous inscrire');
                      navigate('/login');
                    } else {
                      setIsModalOpen(true);
                    }
                  }}
                  className="w-full py-4 px-6 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 group"
                >
                  {user ? "S'inscrire maintenant" : (
                    <>
                      <LogIn size={20} />
                      Se connecter
                    </>
                  )}
                  {user && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              )}

              {!user && !isPassed && !isFull && !isDeadlinePassed && (
                <p className="text-xs text-center mt-4 text-gray-500 font-montserrat">
                  Connectez-vous pour vous inscrire à cet événement
                </p>
              )}

              {/* Quick info - only show if limited places */}
              {!isPassed && !isFull && !isUnlimited && spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0 && (
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <p className="text-orange-400 text-sm text-center font-medium">
                    Plus que {spotsLeft} place{spotsLeft > 1 ? 's' : ''} !
                  </p>
                </div>
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
