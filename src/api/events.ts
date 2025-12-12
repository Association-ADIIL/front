import { fetchJson } from './client';

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string; // ISO string
  location: string;
  price: number;
  totalPlaces: number;
  registeredPeople: number;
  registrationDeadline: string; // ISO string
  coverImage?: string;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'FINISHED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  options?: { id: number; name: string }[];
}

export type EventFormData = Omit<Event, 'id' | 'registeredPeople' | 'status' | 'visibility'> & {
  status?: 'OPEN' | 'FULL' | 'CLOSED' | 'FINISHED';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
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