import React, { useEffect, useState } from 'react';
import { getAllEvents, deleteEvent, createEvent, updateEvent, type Event, type EventFormData } from '../api/events';
import { Edit2, Trash2, Plus, Calendar, MapPin } from 'lucide-react';
import Modal from '../components/Modal';

const EventManagementPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    location: '',
    price: 0,
    totalPlaces: 0,
    registrationDeadline: '',
    coverImage: '',
    status: 'OPEN',
    visibility: 'PUBLIC'
  });

  const fetchEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreate = () => {
    setCurrentEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      price: 0,
      totalPlaces: 0,
      registrationDeadline: '',
      coverImage: '',
      status: 'OPEN',
      visibility: 'PUBLIC'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: Event) => {
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16), // Format for datetime-local
      location: event.location,
      price: event.price,
      totalPlaces: event.totalPlaces,
      registrationDeadline: new Date(event.registrationDeadline).toISOString().slice(0, 16),
      coverImage: event.coverImage || '',
      status: event.status,
      visibility: event.visibility
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (event: Event) => {
    setEventToDelete(event);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Format dates to ISO strings with time if needed by backend, 
      // but usually the datetime-local value is close enough or needs explicit conversion
      const payload: EventFormData = {
          ...formData,
          date: new Date(formData.date).toISOString(),
          registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
      }

      if (currentEvent) {
        await updateEvent(currentEvent.id, payload);
      } else {
        await createEvent(payload);
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("Erreur lors de l'enregistrement de l'événement.");
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete.id);
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Erreur lors de la suppression.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-accent-mint font-koulen">Gestion des Événements</h1>
        <button onClick={handleOpenCreate} className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center">
          <Plus size={20} className="mr-2" /> Créer un événement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const isFull = event.registeredPeople >= event.totalPlaces;
          return (
          <div key={event.id} className="bg-darker-bg border border-gray-700 rounded-lg p-6 flex flex-col relative group">
             <div className="flex items-start justify-between mb-4">
                 <div className="w-16 h-16 rounded bg-dark-bg flex items-center justify-center overflow-hidden">
                     <img 
                        src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=1E1E1E&color=fff&size=64`} 
                        alt={event.title} 
                        className="w-full h-full object-cover" 
                     />
                 </div>
                 <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-darker-bg p-1 rounded absolute top-4 right-4 shadow-lg">
                    <button onClick={() => handleOpenEdit(event)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"><Edit2 size={18} /></button>
                    <button onClick={() => handleOpenDelete(event)} className="p-2 text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={18} /></button>
                 </div>
            </div>

            <h3 className="text-xl font-bold mb-1 pr-2 line-clamp-1">{event.title}</h3>
            
            <div className="text-sm text-gray-400 mb-1 flex items-center">
                <Calendar size={14} className="mr-2" />
                {new Date(event.date).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-400 mb-3 flex items-center">
                <MapPin size={14} className="mr-2" />
                {event.location}
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between text-sm items-center">
                <span className="text-gray-400">Inscrits: {event.registeredPeople} / {event.totalPlaces}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${!isFull ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {event.status === 'OPEN' && !isFull ? 'Ouvert' : 'Complet/Fermé'}
                </span>
            </div>
          </div>
        )})}
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentEvent ? "Modifier l'événement" : "Créer un événement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">Titre</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white h-24" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Date</label>
                <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Lieu</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Prix (€)</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Places Totales</label>
                <input type="number" name="totalPlaces" value={formData.totalPlaces} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Date limite inscription</label>
                <input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">URL Image (optionnel)</label>
                <input type="text" name="coverImage" value={formData.coverImage} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Statut</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white">
                <option value="OPEN">Ouvert</option>
                <option value="FULL">Complet</option>
                <option value="CLOSED">Fermé</option>
                <option value="FINISHED">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Visibilité</label>
              <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white">
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Privé</option>
                <option value="DRAFT">Brouillon</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="mr-4 px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
              <button type="submit" className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className="text-center">
            <p className="mb-6 text-lg">Êtes-vous sûr de vouloir supprimer l'événement <span className="font-bold text-accent-mint">{eventToDelete?.title}</span> ?</p>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Supprimer</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventManagementPage;