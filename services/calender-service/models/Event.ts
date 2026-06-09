/**
 * Calendar Event Model
 */

export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  start: string | Date;
  end: string | Date;
  category?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  staff?: string;
  staff_ids?: string;
  location?: string;
  all_day?: boolean;
  recurring?: boolean;
  recurrence_rule?: string;
  parent_event_id?: number;
  color?: string;
  reminder_minutes?: number;
  attachments?: string;
  notes?: string;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  deleted_by?: number;
}

export interface CreateEventDTO {
  title: string;
  description?: string;
  start: string;
  end: string;
  category?: string;
  priority?: string;
  status?: string;
  staff?: string;
  location?: string;
  all_day?: boolean;
  recurring?: boolean;
  recurrence_rule?: string;
  color?: string;
  reminder_minutes?: number;
  notes?: string;
  created_by?: number;
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  category?: string;
  priority?: string;
  status?: string;
  staff?: string;
  location?: string;
  all_day?: boolean;
  recurring?: boolean;
  recurrence_rule?: string;
  color?: string;
  reminder_minutes?: number;
  notes?: string;
}

export interface EventQueryOptions {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CalendarEventResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
