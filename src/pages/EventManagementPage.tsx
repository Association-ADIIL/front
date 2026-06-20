import React, { useEffect, useState, useRef } from 'react';
import { logger } from '../utils/logger';
import { getAllEvents, deleteEvent, createEvent, updateEvent, type Event, type EventFormData, type EventFormField } from '../api/events';
import { Edit2, Trash2, Plus, Calendar, MapPin, Download, X, Search, Users, ChevronDown, ChevronUp, UserMinus } from 'lucide-react';
import Modal from '../components/Modal';
import { exportEventInscriptionsCsv, getAllInscriptions, adminUnregisterInscription, type Inscription } from '../api/inscriptions';
import ImageUpload from '../components/ImageUpload';
import NumberInput from '../components/NumberInput';
import { deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const EventManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Events');
  const { addNotification } = useNotification();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const uploadedImagesRef = useRef<string[]>([]);

  // Inscriptions modal state
  const [isInscriptionsModalOpen, setIsInscriptionsModalOpen] = useState(false);
  const [selectedEventForInscriptions, setSelectedEventForInscriptions] = useState<Event | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [expandedInscriptions, setExpandedInscriptions] = useState<Set<number>>(new Set());

  // Unregister modal state
  const [isUnregisterModalOpen, setIsUnregisterModalOpen] = useState(false);
  const [inscriptionToUnregister, setInscriptionToUnregister] = useState<Inscription | null>(null);
  const [unregisterLoading, setUnregisterLoading] = useState(false);

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

  // Track if user manually edited the registration deadline
  const [deadlineManuallyEdited, setDeadlineManuallyEdited] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      logger.error('Failed to fetch events', error);
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
    setDeadlineManuallyEdited(false);
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
    setDeadlineManuallyEdited(true); // En édition, on considère que la deadline a été définie
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

  const handleOpenInscriptions = async (event: Event) => {
    setSelectedEventForInscriptions(event);
    setIsInscriptionsModalOpen(true);
    setLoadingInscriptions(true);
    setExpandedInscriptions(new Set());
    try {
      const data = await getAllInscriptions({ eventId: event.id });
      setInscriptions(data);
    } catch (error) {
      logger.error('Failed to fetch inscriptions', error);
      addNotification('error', 'Erreur lors du chargement des inscriptions');
    } finally {
      setLoadingInscriptions(false);
    }
  };

  const toggleInscriptionExpanded = (inscriptionId: number) => {
    setExpandedInscriptions(prev => {
      const next = new Set(prev);
      if (next.has(inscriptionId)) {
        next.delete(inscriptionId);
      } else {
        next.add(inscriptionId);
      }
      return next;
    });
  };

  const handleOpenUnregister = (inscription: Inscription, e: React.MouseEvent) => {
    e.stopPropagation();
    setInscriptionToUnregister(inscription);
    setIsUnregisterModalOpen(true);
  };

  const handleUnregister = async (withRefund: boolean) => {
    if (!inscriptionToUnregister || !selectedEventForInscriptions) return;

    setUnregisterLoading(true);
    try {
      await adminUnregisterInscription(inscriptionToUnregister.id, withRefund);
      addNotification('success', withRefund ? 'Inscription supprimee et remboursee' : 'Inscription supprimee');
      setIsUnregisterModalOpen(false);
      setInscriptionToUnregister(null);

      // Refresh inscriptions list
      const data = await getAllInscriptions({ eventId: selectedEventForInscriptions.id });
      setInscriptions(data);

      // Refresh events to update registered count
      fetchEvents();
    } catch (error) {
      logger.error('Failed to unregister', error);
      addNotification('error', 'Erreur lors de la desinscription');
    } finally {
      setUnregisterLoading(false);
    }
  };

  const getFormFieldLabel = (fieldId: number): string => {
    if (!selectedEventForInscriptions?.formFields) return `Champ #${fieldId}`;
    const fields = selectedEventForInscriptions.formFields as EventFormField[];
    const field = fields.find(f => f.id === fieldId);
    return field?.label || `Champ #${fieldId}`;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-900/50 text-green-300">Paye</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-900/50 text-yellow-300">En attente</span>;
      case 'REFUNDED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-900/50 text-red-300">Rembourse</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">{status}</span>;
    }
  };

  const handleCloseModal = async () => {
    // Clean up uploaded images if modal is closed without saving
    for (const imageUrl of uploadedImagesRef.current) {
      try {
        await deleteImage(imageUrl);
      } catch (error) {
        logger.error('Failed to delete image', error);
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
      logger.error('Failed to save event', error);
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
      logger.error('Failed to delete event', error);
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
      logger.error('Failed to export CSV', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Limit year to 4 digits for date fields
    if (type === 'datetime-local' && value) {
      const year = value.split('-')[0];
      if (year && year.length > 4) {
        return; // Don't update if year is more than 4 digits
      }
    }

    // Track if user manually edits the deadline
    if (name === 'registrationDeadline') {
      setDeadlineManuallyEdited(true);
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      };

      // Sync registration deadline with event date if not manually edited (even partial values)
      if (name === 'date' && !deadlineManuallyEdited) {
        updated.registrationDeadline = value;
      }

      return updated;
    });
  };

  // Check if registration deadline is after event date
  const isDeadlineAfterEvent = formData.date && formData.registrationDeadline &&
    new Date(formData.registrationDeadline) > new Date(formData.date);

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

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-purple-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Gestion</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-koulen">EVENEMENTS</h1>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20"
        >
          <Plus size={18} /> Creer
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un evenement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-darker-bg border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2 ml-1">
            <span className="text-purple-400 font-bold">{filteredEvents.length}</span> evenement(s) trouve(s)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const isUnlimited = event.totalPlaces === 0;
          const isFull = !isUnlimited && event.registeredPeople >= event.totalPlaces;
          return (
          <div key={event.id} className="bg-darker-bg border border-gray-800 rounded-2xl p-6 flex flex-col relative group hover:border-gray-700 transition-colors">
             <div className="flex items-start justify-between mb-4">
                 <div className="w-16 h-16 rounded bg-dark-bg flex items-center justify-center overflow-hidden">
                     <img 
                        src={event.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=1E1E1E&color=fff&size=64`} 
                        alt={event.title} 
                        className="w-full h-full object-cover" 
                     />
                 </div>
                 <div className="flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-darker-bg p-1 rounded absolute top-4 right-4 shadow-lg">
                    <button
                      onClick={() => handleOpenInscriptions(event)}
                      className="p-2 text-purple-400 hover:bg-purple-900/20 rounded"
                      title="Voir les inscrits"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => handleExportCsv(event.id, event.title)}
                      className="p-2 text-purple-400 hover:bg-green-900/20 rounded"
                      title="Exporter les participants (CSV)"
                    >
                      <Download size={18} />
                    </button>
                    <button onClick={() => handleOpenEdit(event)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"><Edit2 size={18} /></button>
                    <button onClick={() => handleOpenDelete(event)} className="p-2 text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={18} /></button>
                 </div>
            </div>

            <h3 className="text-xl font-bold mb-1 pr-2 line-clamp-1">{event.title}</h3>

            {/* Visibility badges */}
            {event.visibility !== 'PUBLIC' && (
              <div className="mb-2">
                {event.visibility === 'DRAFT' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                    Brouillon
                  </span>
                )}
                {event.visibility === 'PRIVATE' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-900/50 text-purple-300 border border-purple-700/50">
                    Prive
                  </span>
                )}
              </div>
            )}

            <div className="text-sm text-gray-400 mb-1 flex items-center">
                <Calendar size={14} className="mr-2" />
                {new Date(event.date).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-400 mb-3 flex items-center">
                <MapPin size={14} className="mr-2" />
                {event.location}
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-800 space-y-2">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-400">
                  Inscrits: {event.registeredPeople}{isUnlimited ? '' : ` / ${event.totalPlaces}`}
                  {isUnlimited && <span className="text-purple-400 ml-1">(illimite)</span>}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${!isFull ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {event.status === 'OPEN' && !isFull ? 'Ouvert' : 'Complet/Ferme'}
                </span>
              </div>
              {event.formFields && (event.formFields as any[]).length > 0 && (
                <div className="text-xs text-purple-400 flex items-center gap-1">
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
        title={currentEvent ? "Modifier l'evenement" : "Creer un evenement"}
        isDirty={!!(formData.title || formData.description || formData.location || formData.date)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="event-form"
              className="bg-purple-400 text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-gray-400 mb-1">Date de l'evenement</label>
              <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required max="9999-12-31T23:59" className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Date limite inscription</label>
              <input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required max="9999-12-31T23:59" className={`w-full bg-dark-bg border rounded p-2 text-white ${isDeadlineAfterEvent ? 'border-orange-500' : 'border-gray-600'}`} />
              {isDeadlineAfterEvent && (
                <p className="text-orange-400 text-xs mt-1">La date limite est apres la date de l'evenement</p>
              )}
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Lieu</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Prix (€)</label>
              <NumberInput value={formData.price} onChange={(val) => setFormData(prev => ({ ...prev, price: parseFloat(val) || 0 }))} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Places Totales</label>
              <NumberInput value={formData.totalPlaces} onChange={(val) => setFormData(prev => ({ ...prev, totalPlaces: parseInt(val) || 0 }))} allowDecimals={false} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
              <p className="text-gray-500 text-xs mt-1">0 = places illimitees</p>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Max places / pers</label>
              <NumberInput value={formData.maxPlacesPerPerson} onChange={(val) => setFormData(prev => ({ ...prev, maxPlacesPerPerson: parseInt(val) || 0 }))} allowDecimals={false} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
              <p className="text-gray-500 text-xs mt-1">0 = illimite</p>
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
                accentColor="purple"
              />
            </div>

            {/* Custom Form Fields Section */}
            <div className="md:col-span-2 border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-white mb-3">Champs personnalises pour l'inscription</h3>
              <p className="text-sm text-gray-400 mb-4">Ajoutez des questions personnalisees pour les participants (ex: preferences alimentaires, taille de t-shirt, etc.)</p>

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
                        className="mr-2 h-4 w-4 accent-purple-400"
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
                  className="mt-3 bg-purple-400 text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm"
                >
                  Ajouter ce champ
                </button>
              </div>
            </div>
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
            <p className="mb-6 text-lg">Êtes-vous sûr de vouloir supprimer l'événement <span className="font-bold text-purple-400">{eventToDelete?.title}</span> ?</p>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Supprimer</button>
            </div>
        </div>
      </Modal>

      {/* Unregister Confirmation Modal */}
      <Modal
        isOpen={isUnregisterModalOpen}
        onClose={() => {
          setIsUnregisterModalOpen(false);
          setInscriptionToUnregister(null);
        }}
        title="Desinscrire un participant"
        zIndex={1100}
      >
        {inscriptionToUnregister && (
          <div className="space-y-4">
            <p className="text-gray-300">
              Voulez-vous desinscrire <span className="font-bold text-white capitalize">{inscriptionToUnregister.user?.firstName} {inscriptionToUnregister.user?.lastName}</span> ?
            </p>

            <div className="bg-dark-bg rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Places:</span>
                <span className="text-white">{inscriptionToUnregister.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Montant:</span>
                <span className="text-white">{inscriptionToUnregister.totalPrice.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Statut:</span>
                {getPaymentStatusBadge(inscriptionToUnregister.paymentStatus)}
              </div>
            </div>

            {inscriptionToUnregister.paymentStatus === 'PAID' && inscriptionToUnregister.totalPrice > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-yellow-400">
                  Cette inscription a ete payee. Choisissez une option :
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleUnregister(true)}
                    disabled={unregisterLoading}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {unregisterLoading ? 'Traitement...' : 'Desinscrire avec remboursement'}
                  </button>
                  <button
                    onClick={() => handleUnregister(false)}
                    disabled={unregisterLoading}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {unregisterLoading ? 'Traitement...' : 'Desinscrire sans remboursement'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsUnregisterModalOpen(false);
                    setInscriptionToUnregister(null);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUnregister(false)}
                  disabled={unregisterLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {unregisterLoading ? 'Traitement...' : 'Confirmer la desinscription'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Inscriptions Modal */}
      <Modal
        isOpen={isInscriptionsModalOpen}
        onClose={() => setIsInscriptionsModalOpen(false)}
        title={`Inscrits - ${selectedEventForInscriptions?.title || ''}`}
      >
        <div>
          {loadingInscriptions ? (
            <div className="text-center py-8 text-gray-400">Chargement...</div>
          ) : inscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Aucune inscription pour cet evenement</div>
          ) : (
            <div className="space-y-3">
              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{inscriptions.length}</p>
                  <p className="text-xs text-gray-400">Inscriptions</p>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {inscriptions.filter(i => i.paymentStatus === 'PAID').length}
                  </p>
                  <p className="text-xs text-gray-400">Payees</p>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {inscriptions.reduce((sum, i) => sum + i.quantity, 0)}
                  </p>
                  <p className="text-xs text-gray-400">Places</p>
                </div>
              </div>

              {/* Inscriptions list */}
              {inscriptions.map((inscription) => {
                const isExpanded = expandedInscriptions.has(inscription.id);
                const hasDetails = (inscription.formResponses && inscription.formResponses.length > 0) ||
                                   (inscription.options && inscription.options.length > 0);

                return (
                  <div key={inscription.id} className="bg-dark-bg rounded-lg border border-gray-700 overflow-hidden">
                    <div
                      className={`p-4 ${hasDetails ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
                      onClick={() => hasDetails && toggleInscriptionExpanded(inscription.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white capitalize">
                              {inscription.user?.firstName} {inscription.user?.lastName}
                            </p>
                            {getPaymentStatusBadge(inscription.paymentStatus)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{inscription.user?.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>{inscription.quantity} place{inscription.quantity > 1 ? 's' : ''}</span>
                            <span>{inscription.totalPrice.toFixed(2)}€</span>
                            <span>{new Date(inscription.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={(e) => handleOpenUnregister(inscription, e)}
                            className="p-1.5 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                            title="Desinscrire"
                          >
                            <UserMinus size={18} />
                          </button>
                          {hasDetails && (
                            <div className="text-gray-400">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && hasDetails && (
                      <div className="border-t border-gray-700 p-4 bg-darker-bg space-y-3">
                        {/* Options */}
                        {inscription.options && inscription.options.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Options choisies</p>
                            <div className="space-y-1">
                              {inscription.options.map((opt, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-white">{opt.eventOption?.name || `Option #${opt.eventOptionId}`}</span>
                                  <span className="text-gray-400">x{opt.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Form responses */}
                        {inscription.formResponses && inscription.formResponses.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Reponses au formulaire</p>
                            <div className="space-y-2">
                              {inscription.formResponses.map((response, idx) => (
                                <div key={idx} className="bg-dark-bg rounded p-2">
                                  <p className="text-xs text-gray-500">{getFormFieldLabel(response.fieldId)}</p>
                                  <p className="text-sm text-white mt-0.5">
                                    {response.value === 'true' ? 'Oui' :
                                     response.value === 'false' ? 'Non' :
                                     response.value || <span className="text-gray-500 italic">Non renseigne</span>}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EventManagementPage;