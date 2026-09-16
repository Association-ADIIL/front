import { fetchJson } from './client';

export interface EventFormField {
  id: number;
  label: string;
  type: 'TEXT' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX';
  required: boolean;
  options?: string[]; // For SELECT type
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
  registeredPeople: number;
  registrationDeadline: string; // ISO string
  coverImage?: string;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'FINISHED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  options?: { id: number; name: string; price?: number }[];
  formFields?: EventFormField[];
  createdAt?: string;
  updatedAt?: string;
  restrictOnSitePaymentToInfo?: boolean;
}

export type EventFormData = Omit<Event, 'id' | 'registeredPeople'> & {
  status?: 'OPEN' | 'FULL' | 'CLOSED' | 'FINISHED';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  formFields?: EventFormField[];
  restrictOnSitePaymentToInfo?: boolean;
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