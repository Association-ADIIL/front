import React, { useEffect, useState, useRef } from 'react';
import { logger } from '../utils/logger';
import { getAllEvents, deleteEvent, createEvent, updateEvent, type Event, type EventFormData, type EventField, type EventFieldType } from '../api/events';
import { Edit2, Trash2, Plus, Calendar, MapPin, Download, X, Search, Users, ChevronDown, ChevronUp, UserMinus } from 'lucide-react';
import Modal from '../components/Modal';
import { exportEventInscriptionsToExcel, getAllInscriptions, adminUnregisterInscription, type Inscription } from '../api/inscriptions';
import ImageUpload from '../components/ImageUpload';
import NumberInput from '../components/NumberInput';
import { deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useConfirmNavigation } from '../hooks/useConfirmNavigation';

const toLocalDatetimeInputValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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

  const [isInscriptionsModalOpen, setIsInscriptionsModalOpen] = useState(false);
  const [selectedEventForInscriptions, setSelectedEventForInscriptions] = useState<Event | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [expandedInscriptions, setExpandedInscriptions] = useState<Set<number>>(new Set());

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
    publishAt: '',
    restrictOnSitePaymentToInfo: false,
    fields: []
  });

  const [newField, setNewField] = useState<Omit<EventField, 'id'>>({
    label: '',
    type: 'TEXT',
    required: false,
    choices: [],
    isPaid: false,
    price: 0
  });

  // ID du champ en cours d'édition (null = mode ajout)
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);

  const [deadlineManuallyEdited, setDeadlineManuallyEdited] = useState(false);

  const isEventFormDirty = !!(formData.title || formData.description || formData.location || formData.date);
  useConfirmNavigation(isModalOpen && isEventFormDirty);

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

  const resetNewField = () => {
    setNewField({ label: '', type: 'TEXT', required: false, choices: [], isPaid: false, price: 0 });
  };

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
      publishAt: '',
      restrictOnSitePaymentToInfo: false,
      fields: []
    });
    resetNewField();
    setEditingFieldId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: Event) => {
    setCurrentEvent(event);
    setDeadlineManuallyEdited(true);
    setFormData({
      title: event.title,
      description: event.description,
      date: toLocalDatetimeInputValue(new Date(event.date)),
      location: event.location,
      price: event.price,
      totalPlaces: event.totalPlaces,
      maxPlacesPerPerson: event.maxPlacesPerPerson,
      registrationDeadline: toLocalDatetimeInputValue(new Date(event.registrationDeadline)),
      coverImage: event.coverImage || '',
      status: event.status,
      visibility: event.visibility,
      publishAt: event.publishAt ? toLocalDatetimeInputValue(new Date(event.publishAt)) : '',
      restrictOnSitePaymentToInfo: event.restrictOnSitePaymentToInfo ?? false,
      fields: event.fields || []
    });
    resetNewField();
    setEditingFieldId(null);
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

      const data = await getAllInscriptions({ eventId: selectedEventForInscriptions.id });
      setInscriptions(data);

      fetchEvents();
    } catch (error) {
      logger.error('Failed to unregister', error);
      addNotification('error', 'Erreur lors de la desinscription');
    } finally {
      setUnregisterLoading(false);
    }
  };

  const getFieldLabel = (fieldId: number): string => {
    const field = selectedEventForInscriptions?.fields?.find(f => f.id === fieldId);
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
    for (const imageUrl of uploadedImagesRef.current) {
      try {
        await deleteImage(imageUrl);
      } catch (error) {
        logger.error('Failed to delete image', error);
      }
    }
    uploadedImagesRef.current = [];
    setEditingFieldId(null);
    setIsModalOpen(false);
  };

  const handleImageCleanup = (imageUrl: string) => {
    uploadedImagesRef.current.push(imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const invalidField = (formData.fields || []).find(f => f.isPaid && (!f.price || f.price <= 0));
    if (invalidField) {
      addNotification('error', `Le champ "${invalidField.label || 'sans nom'}" doit avoir un prix superieur a 0.`);
      return;
    }

    try {
      const payload: EventFormData = {
          ...formData,
          date: new Date(formData.date).toISOString(),
          registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
          publishAt: formData.visibility === 'PUBLIC' && formData.publishAt
            ? new Date(formData.publishAt).toISOString()
            : null,
      }

      if (currentEvent) {
        await updateEvent(currentEvent.id, payload);
        addNotification('success', 'Événement modifié avec succès !');
      } else {
        await createEvent(payload);
        addNotification('success', 'Événement créé avec succès !');
      }

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

  const handleExportExcel = async (eventId: number, eventTitle: string) => {
    try {
      const blob = await exportEventInscriptionsToExcel(eventId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const currentDate = new Date().toISOString().split('T')[0];
      a.download = `participants-${sanitizedTitle}-${currentDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export Excel', error);
      alert("Erreur lors de l'export Excel");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'datetime-local' && value) {
      const year = value.split('-')[0];
      if (year && year.length > 4) {
        return;
      }
    }

    if (name === 'registrationDeadline') {
      setDeadlineManuallyEdited(true);
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      };

      if (name === 'date' && !deadlineManuallyEdited) {
        updated.registrationDeadline = value;
      }

      return updated;
    });
  };
  const isDeadlineAfterEvent = formData.date && formData.registrationDeadline &&
    new Date(formData.registrationDeadline) > new Date(formData.date);

  const isPublishAfterDeadline = formData.visibility === 'PUBLIC' && formData.publishAt && formData.registrationDeadline &&
    new Date(formData.publishAt) > new Date(formData.registrationDeadline);

  const handleAddField = () => {
    if (!newField.label.trim()) {
      alert('Le label du champ est requis');
      return;
    }
    if (newField.isPaid && (!newField.price || newField.price <= 0)) {
      alert('Un champ payant doit avoir un prix superieur a 0');
      return;
    }

    if (editingFieldId !== null) {
      // Mise a jour d'un champ existant : on conserve son id d'origine
      // (temporaire cote front pour un champ pas encore sauvegarde, ou
      // reel pour un champ existant en base) afin que le backend fasse
      // un update en place plutot que de creer un doublon.
      setFormData(prev => ({
        ...prev,
        fields: (prev.fields || []).map(f =>
          f.id === editingFieldId ? { ...newField, id: editingFieldId } : f
        )
      }));
      setEditingFieldId(null);
    } else {
      const field: EventField = {
        id: Date.now(), // ID temporaire cote front, ignore par le backend a la creation
        ...newField
      };

      setFormData(prev => ({
        ...prev,
        fields: [...(prev.fields || []), field]
      }));
    }

    resetNewField();
  };

  const handleEditField = (field: EventField) => {
    const { id, ...rest } = field;
    setNewField(rest);
    setEditingFieldId(id);
  };

  const handleCancelEditField = () => {
    resetNewField();
    setEditingFieldId(null);
  };

  const handleRemoveField = (fieldId: number) => {
    setFormData(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(f => f.id !== fieldId)
    }));
    if (editingFieldId === fieldId) {
      handleCancelEditField();
    }
  };

  const handleAddChoice = () => {
    if (newField.type === 'SELECT' || newField.type === 'CHECKBOX') {
      const choice = prompt('Entrez un choix :');
      if (choice) {
        setNewField(prev => ({
          ...prev,
          choices: [...(prev.choices || []), choice]
        }));
      }
    }
  };

  const handleRemoveChoice = (index: number) => {
    setNewField(prev => ({
      ...prev,
      choices: (prev.choices || []).filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fieldTypeLabels: Record<EventFieldType, string> = {
    TEXT: 'Texte court',
    TEXTAREA: 'Texte long',
    SELECT: 'Liste deroulante',
    CHECKBOX: 'Case a cocher',
    PAID_OPTION: 'Option payante',
  };

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
                      onClick={() => handleExportExcel(event.id, event.title)}
                      className="p-2 text-purple-400 hover:bg-green-900/20 rounded"
                      title="Exporter les participants (Excel)"
                    >
                      <Download size={18} />
                    </button>
                    <button onClick={() => handleOpenEdit(event)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"><Edit2 size={18} /></button>
                    <button onClick={() => handleOpenDelete(event)} className="p-2 text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={18} /></button>
                 </div>
            </div>

            <h3 className="text-xl font-bold mb-1 pr-2 line-clamp-1">{event.title}</h3>

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

            {event.visibility === 'PUBLIC' && event.publishAt && new Date(event.publishAt) > new Date() && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                  Programmé le {new Date(event.publishAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
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
              {event.fields && event.fields.length > 0 && (
                <div className="text-xs text-purple-400 flex items-center gap-1">
                  <span className="font-bold">{event.fields.length}</span> champ(s) personnalisé(s)
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
        isDirty={isEventFormDirty}
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
            {formData.visibility === 'PUBLIC' && (
              <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">Publier automatiquement le (optionnel)</label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    name="publishAt"
                    value={formData.publishAt || ''}
                    onChange={handleChange}
                    max="9999-12-31T23:59"
                    className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
                  />
                  {formData.publishAt && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, publishAt: '' }))}
                      className="px-3 text-sm text-gray-300 hover:text-white bg-gray-700 rounded"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Vide = visible immédiatement. Avant cette date, l'événement reste invisible du public.
                </p>
                {isPublishAfterDeadline && (
                  <p className="text-orange-400 text-xs mt-1">
                    La publication est après la date limite d'inscription : personne ne pourra s'inscrire.
                  </p>
                )}
              </div>
            )}
            <div className="md:col-span-2 flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.restrictOnSitePaymentToInfo || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, restrictOnSitePaymentToInfo: e.target.checked }))}
                  className="mr-2 h-4 w-4 accent-purple-400"
                />
                <span className="text-sm text-white">Réserver le paiement sur place à la filière Info</span>
              </label>
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

            {/* Unified Fields Section (form fields + paid options) */}
            <div className="md:col-span-2 border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-white mb-3">Champs de l'inscription</h3>
              <p className="text-sm text-gray-400 mb-4">Ajoutez des questions pour les participants (preferences, taille de t-shirt...) ou des options payantes (repas, t-shirt payant...)</p>

              {formData.fields && formData.fields.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.fields.map((field) => (
                    <div
                      key={field.id}
                      className={`flex items-center justify-between bg-dark-bg p-3 rounded border ${editingFieldId === field.id ? 'border-purple-500' : 'border-gray-700'}`}
                    >
                      <div className="flex-grow">
                        <p className="text-white font-medium">{field.label}</p>
                        <p className="text-xs text-gray-400">
                          Type: {fieldTypeLabels[field.type]} • {field.required ? 'Requis' : 'Optionnel'}
                          {field.choices && field.choices.length > 0 && ` • ${field.choices.length} choix`}
                          {field.isPaid && ` • Payant: ${(field.price ?? 0).toFixed(2)}€`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => handleEditField(field)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Modifier ce champ"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Supprimer ce champ"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-darker-bg p-4 rounded border border-gray-700">
                <p className="text-sm font-bold text-white mb-3">
                  {editingFieldId !== null ? 'Modifier le champ' : 'Ajouter un nouveau champ'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Label du champ</label>
                    <input
                      type="text"
                      value={newField.label}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Ex: Preferences alimentaires, Repas..."
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Type de champ</label>
                    <select
                      value={newField.type}
                      onChange={(e) => {
                        const type = e.target.value as EventFieldType;
                        setNewField(prev => ({
                          ...prev,
                          type,
                          choices: (type === 'SELECT' || type === 'CHECKBOX') ? [] : undefined,
                          isPaid: type === 'PAID_OPTION' ? true : false,
                        }));
                      }}
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    >
                      <option value="TEXT">Texte court</option>
                      <option value="TEXTAREA">Texte long</option>
                      <option value="SELECT">Liste deroulante</option>
                      <option value="CHECKBOX">Case a cocher</option>
                      <option value="PAID_OPTION">Option payante</option>
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

                  {newField.type !== 'PAID_OPTION' && (
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newField.isPaid || false}
                          onChange={(e) => setNewField(prev => ({ ...prev, isPaid: e.target.checked }))}
                          className="mr-2 h-4 w-4 accent-purple-400"
                        />
                        <span className="text-sm text-white">Payant</span>
                      </label>
                    </div>
                  )}

                  {newField.isPaid && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Prix (€)</label>
                      <NumberInput
                        value={newField.price || 0}
                        onChange={(val) => setNewField(prev => ({ ...prev, price: parseFloat(val) || 0 }))}
                        className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                      />
                    </div>
                  )}

                  {(newField.type === 'SELECT' || newField.type === 'CHECKBOX') && (
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Choix</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {newField.choices?.map((choice, index) => (
                          <span key={index} className="bg-dark-bg px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                            {choice}
                            <button
                              type="button"
                              onClick={() => handleRemoveChoice(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddChoice}
                        className="text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600"
                      >
                        + Ajouter un choix
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="bg-purple-400 text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm"
                  >
                    {editingFieldId !== null ? 'Mettre à jour ce champ' : 'Ajouter ce champ'}
                  </button>
                  {editingFieldId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditField}
                      className="text-sm text-gray-300 hover:text-white px-3 py-2"
                    >
                      Annuler
                    </button>
                  )}
                </div>
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

              {inscriptions.map((inscription) => {
                const isExpanded = expandedInscriptions.has(inscription.id);
                const hasDetails = !!(inscription.fieldValues && inscription.fieldValues.length > 0);

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

                    {isExpanded && hasDetails && (
                      <div className="border-t border-gray-700 p-4 bg-darker-bg space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Details du formulaire</p>
                        {inscription.fieldValues!.map((fv, idx) => (
                          <div key={idx} className="bg-dark-bg rounded p-2">
                            <p className="text-xs text-gray-500">{fv.field?.label || getFieldLabel(fv.fieldId)}</p>
                            <p className="text-sm text-white mt-0.5">
                              {fv.field?.isPaid
                                ? `${fv.value ?? fv.field.label} (x${fv.quantity})`
                                : fv.value === 'true' ? 'Oui'
                                : fv.value === 'false' ? 'Non'
                                : fv.value || <span className="text-gray-500 italic">Non renseigne</span>}
                            </p>
                          </div>
                        ))}
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
