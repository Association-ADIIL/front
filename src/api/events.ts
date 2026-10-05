import { fetchJson } from './client';

export type EventFieldType = 'TEXT' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX' | 'PAID_OPTION';

export interface EventField {
  id: number;
  label: string;
  type: EventFieldType;
  required: boolean;
  order?: number;
  choices?: string[]; // Pour SELECT/CHECKBOX
  isPaid?: boolean;
  price?: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string; // ISO string
  location: string;
  price: number;
  totalPlaces: number;
  maxPlacesPerPerson: number;
  registeredPeople: number | null; // null si masqué au public (hideParticipantCount)
  registrationDeadline: string; // ISO string
  coverImage?: string;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'FINISHED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  publishAt?: string | null; // ISO string, vide = publié immédiatement
  fields?: EventField[];
  createdAt?: string;
  updatedAt?: string;
  restrictOnSitePaymentToInfo?: boolean;
  hideParticipantCount?: boolean;
}

export type EventFormData = Omit<Event, 'id' | 'registeredPeople' | 'fields'> & {
  status?: 'OPEN' | 'FULL' | 'CLOSED' | 'FINISHED';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  restrictOnSitePaymentToInfo?: boolean;
  hideParticipantCount?: boolean;
  fields?: EventField[];
};

export const getAllEvents = async (): Promise<Event[]> => {
  return fetchJson('/events');
};

export const getEventById = async (id: string): Promise<Event> => {
  return fetchJson(`/events/${id}`);
};

export const createEvent = async (data: EventFormData): Promise<Event> => {
  return fetchJson('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateEvent = async (id: number, data: Partial<EventFormData>): Promise<Event> => {
  return fetchJson(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteEvent = async (id: number): Promise<void> => {
  return fetchJson(`/events/${id}`, {
    method: 'DELETE',
  });
};

// Copie l'image de couverture d'un événement (utilisé pour la duplication).
// Renvoie la nouvelle URL, ou null si l'événement n'a pas de couverture.
export const duplicateEventCover = async (eventId: number): Promise<string | null> => {
  const data = await fetchJson(`/events/${eventId}/duplicate-cover`, {
    method: 'POST',
  });
  return data.imageUrl ?? null;
};