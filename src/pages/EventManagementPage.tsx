import React, { useEffect, useState, useRef } from 'react';
import { getAllEvents, deleteEvent, createEvent, updateEvent, type Event, type EventFormData, type EventFormField } from '../api/events';
import { Edit2, Trash2, Plus, Calendar, MapPin, Download, X } from 'lucide-react';
import Modal from '../components/Modal';
import { exportEventInscriptionsCsv } from '../api/inscriptions';
import ImageUpload from '../components/ImageUpload';
import { deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';

const EventManagementPage: React.FC = () => {
  const { addNotification } = useNotification();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const uploadedImagesRef = useRef<string[]>([]);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    location: '',
    price: 0,
    totalPlaces: 0,
    maxPlacesPerPerson: 1,
    registrationDeadline: '',
    coverImage: '',
    status: 'OPEN',
    visibility: 'PUBLIC',
    formFields: []
  });

  const [newField, setNewField] = useState<Omit<EventFormField, 'id'>>({
    label: '',
    type: 'TEXT',
    required: false,
    options: []
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
    uploadedImagesRef.current = [];
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      price: 0,
      totalPlaces: 0,
      maxPlacesPerPerson: 1,
      registrationDeadline: '',
      coverImage: '',
      status: 'OPEN',
      visibility: 'PUBLIC',
      formFields: []
    });
    setNewField({
      label: '',
      type: 'TEXT',
      required: false,
      options: []
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
      maxPlacesPerPerson: event.maxPlacesPerPerson,
      registrationDeadline: new Date(event.registrationDeadline).toISOString().slice(0, 16),
      coverImage: event.coverImage || '',
      status: event.status,
      visibility: event.visibility,
      formFields: event.formFields || []
    });
    setNewField({
      label: '',
      type: 'TEXT',
      required: false,
      options: []
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (event: Event) => {
    setEventToDelete(event);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = async () => {
    // Clean up uploaded images if modal is closed without saving
    for (const imageUrl of uploadedImagesRef.current) {
      try {
        await deleteImage(imageUrl);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
    uploadedImagesRef.current = [];
    setIsModalOpen(false);
  };

  const handleImageCleanup = (imageUrl: string) => {
    uploadedImagesRef.current.push(imageUrl);
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
        addNotification('success', 'Événement modifié avec succès !');
      } else {
        await createEvent(payload);
        addNotification('success', 'Événement créé avec succès !');
      }

      // Clear uploaded images list since they're now saved
      uploadedImagesRef.current = [];
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Failed to save event:", error);
      addNotification('error', "Erreur lors de l'enregistrement de l'événement.");
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete.id);
      addNotification('success', 'Événement supprimé avec succès !');
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
      addNotification('error', "Erreur lors de la suppression.");
    }
  };

  const handleExportCsv = async (eventId: number, eventTitle: string) => {
    try {
      const blob = await exportEventInscriptionsCsv(eventId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const currentDate = new Date().toISOString().split('T')[0];
      a.download = `participants-${sanitizedTitle}-${currentDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleAddFormField = () => {
    if (!newField.label.trim()) {
      alert('Le label du champ est requis');
      return;
    }

    const field: EventFormField = {
      id: Date.now(), // Temporary ID for frontend
      ...newField
    };

    setFormData(prev => ({
      ...prev,
      formFields: [...(prev.formFields || []), field]
    }));

    // Reset new field
    setNewField({
      label: '',
      type: 'TEXT',
      required: false,
      options: []
    });
  };

  const handleRemoveFormField = (fieldId: number) => {
    setFormData(prev => ({
      ...prev,
      formFields: (prev.formFields || []).filter(f => f.id !== fieldId)
    }));
  };

  const handleAddOption = () => {
    if (newField.type === 'SELECT') {
      const option = prompt('Entrez une option :');
      if (option) {
        setNewField(prev => ({
          ...prev,
          options: [...(prev.options || []), option]
        }));
      }
    }
  };

  const handleRemoveOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index)
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
                    <button
                      onClick={() => handleExportCsv(event.id, event.title)}
                      className="p-2 text-accent-mint hover:bg-green-900/20 rounded"
                      title="Exporter les participants (CSV)"
                    >
                      <Download size={18} />
                    </button>
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
            
            <div className="mt-auto pt-4 border-t border-gray-700 space-y-2">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-400">Inscrits: {event.registeredPeople} / {event.totalPlaces}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${!isFull ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {event.status === 'OPEN' && !isFull ? 'Ouvert' : 'Complet/Fermé'}
                </span>
              </div>
              {event.formFields && (event.formFields as any[]).length > 0 && (
                <div className="text-xs text-accent-mint flex items-center gap-1">
                  <span className="font-bold">{(event.formFields as any[]).length}</span> champ(s) personnalisé(s)
                </div>
              )}
              {event.options && event.options.length > 0 && (
                <div className="text-xs text-blue-400 flex items-center gap-1">
                  <span className="font-bold">{event.options.length}</span> option(s)
                </div>
              )}
            </div>
          </div>
        )})}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
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
                <label className="block text-gray-400 mb-1">Max places / pers</label>
                <input type="number" name="maxPlacesPerPerson" value={formData.maxPlacesPerPerson} onChange={handleChange} required min="1" className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Date limite inscription</label>
                <input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
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
            <div className="md:col-span-2">
                <ImageUpload
                  value={formData.coverImage || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, coverImage: url || '' }))}
                  folder="events"
                  label="Image de couverture"
                  aspectRatio="16:9"
                  onCleanup={handleImageCleanup}
                />
            </div>

            {/* Custom Form Fields Section */}
            <div className="md:col-span-2 border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-white mb-3">Champs personnalises pour l'inscription</h3>
              <p className="text-sm text-gray-400 mb-4">Ajoutez des questions personnalisees pour les participants (ex: preferences alimentaires, taille de t-shirt, etc.)</p>

              {/* Existing fields */}
              {formData.formFields && formData.formFields.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.formFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between bg-dark-bg p-3 rounded border border-gray-700">
                      <div className="flex-grow">
                        <p className="text-white font-medium">{field.label}</p>
                        <p className="text-xs text-gray-400">
                          Type: {field.type} • {field.required ? 'Requis' : 'Optionnel'}
                          {field.options && field.options.length > 0 && ` • ${field.options.length} options`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFormField(field.id)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new field */}
              <div className="bg-darker-bg p-4 rounded border border-gray-700">
                <p className="text-sm font-bold text-white mb-3">Ajouter un nouveau champ</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Label du champ</label>
                    <input
                      type="text"
                      value={newField.label}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Ex: Preferences alimentaires"
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Type de champ</label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as any, options: e.target.value === 'SELECT' ? [] : undefined }))}
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    >
                      <option value="TEXT">Texte court</option>
                      <option value="TEXTAREA">Texte long</option>
                      <option value="SELECT">Liste deroulante</option>
                      <option value="CHECKBOX">Case a cocher</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                        className="mr-2 h-4 w-4 accent-accent-mint"
                      />
                      <span className="text-sm text-white">Champ requis</span>
                    </label>
                  </div>

                  {newField.type === 'SELECT' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Options</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {newField.options?.map((option, index) => (
                          <span key={index} className="bg-dark-bg px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                            {option}
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600"
                      >
                        + Ajouter une option
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddFormField}
                  className="mt-3 bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm"
                >
                  Ajouter ce champ
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
              <button type="button" onClick={handleCloseModal} className="mr-4 px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
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