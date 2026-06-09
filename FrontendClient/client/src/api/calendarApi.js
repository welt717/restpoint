import api from './axios';
import { ENDPOINTS } from './endpoints';

export const calendarApi = {
  // Get all events for tenant
  list: (params = {}) => 
    api.get(ENDPOINTS.CALENDAR.LIST, { params }).then(r => r.data),

  // Create new event
  create: (data) => 
    api.post(ENDPOINTS.CALENDAR.CREATE, data).then(r => r.data),

  // Get event by ID
  getById: (id) => 
    api.get(ENDPOINTS.CALENDAR.DETAIL(id)).then(r => r.data),

  // Update event
  update: (id, data) => 
    api.put(ENDPOINTS.CALENDAR.UPDATE(id), data).then(r => r.data),

  // Delete event
  delete: (id) => 
    api.delete(ENDPOINTS.CALENDAR.DELETE(id)).then(r => r.data),

  // Get events by specific date
  getByDate: (date) => 
    api.get(ENDPOINTS.CALENDAR.BY_DATE(date)).then(r => r.data),

  // Get events by date range
  getByRange: (startDate, endDate) => 
    api.get(ENDPOINTS.CALENDAR.BY_RANGE, { 
      params: { startDate, endDate } 
    }).then(r => r.data),

  // Get events by type (funeral_service, viewing, burial, etc.)
  getByType: (type) => 
    api.get(ENDPOINTS.CALENDAR.BY_TYPE(type)).then(r => r.data),

  // Get upcoming events
  getUpcoming: (limit = 10) => 
    api.get(ENDPOINTS.CALENDAR.UPCOMING, { 
      params: { limit } 
    }).then(r => r.data),

  // Export events (CSV or PDF)
  export: (format = 'csv', params = {}) => 
    api.get(ENDPOINTS.CALENDAR.EXPORT, { 
      params: { format, ...params },
      responseType: format === 'pdf' ? 'blob' : 'text'
    }).then(r => r.data),
};
