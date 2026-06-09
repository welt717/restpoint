/**
 * Centralized Calendar API Service
 * Multi-tenant aware API calls for calendar operations
 */
import api from './axios';

export const calendarApi = {
  /**
   * Get all calendar events with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.start - Start date (ISO format)
   * @param {string} params.end - End date (ISO format)
   * @param {string[]} params.types - Event types to filter
   * @param {string} params.status - Event status filter
   */
  getEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.start) queryParams.append('startDate', params.start);
    if (params.end) queryParams.append('endDate', params.end);
    if (params.types && params.types.length > 0) {
      queryParams.append('category', params.types.join(','));
    }
    if (params.status) queryParams.append('status', params.status);
    
    const response = await api.get(`/api/v1/calendar/events?${queryParams.toString()}`);
    return response.data.data || [];
  },

  /**
   * Get a single event by ID
   * @param {string} eventId - Event ID
   */
  getEvent: async (eventId) => {
    const response = await api.get(`/api/v1/calendar/events/${eventId}`);
    return response.data.data;
  },

  /**
   * Create a new calendar event
   * @param {Object} eventData - Event data
   * @param {string} eventData.title - Event title
   * @param {string} eventData.start - Start date/time (ISO format)
   * @param {string} eventData.end - End date/time (ISO format)
   * @param {string} [eventData.entryType] - Event type (interment, exhumation, memorial, maintenance)
   * @param {string} [eventData.location] - Location/plot number
   * @param {string} [eventData.description] - Additional notes
   * @param {string} [eventData.status] - Event status
   * @param {string} [eventData.assignedTo] - Assigned staff member
   * @param {string} [eventData.reference] - Reference number
   */
  createEvent: async (eventData) => {
    const payload = {
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      category: eventData.entryType,
      location: eventData.location,
      description: eventData.description,
      status: eventData.status?.toUpperCase(),
      staff: eventData.assignedTo,
      color: eventData.color,
      notes: eventData.reference
    };

    const response = await api.post('/api/v1/calendar/events', payload);
    return response.data.data;
  },

  /**
   * Update an existing calendar event
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Updated event data
   */
  updateEvent: async (eventId, eventData) => {
    const payload = {
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      category: eventData.entryType,
      location: eventData.location,
      description: eventData.description,
      status: eventData.status?.toUpperCase(),
      staff: eventData.assignedTo,
      color: eventData.color,
      notes: eventData.reference
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });

    const response = await api.put(`/api/v1/calendar/events/${eventId}`, payload);
    return response.data.data;
  },

  /**
   * Delete a calendar event (soft delete)
   * @param {string} eventId - Event ID
   */
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/api/v1/calendar/events/${eventId}`);
    return response.data.success;
  },

  /**
   * Get event statistics for the current tenant
   */
  getStats: async () => {
    const response = await api.get('/api/v1/calendar/statistics');
    return response.data.data || { total: 0, today: 0, thisWeek: 0, byType: {} };
  },

  /**
   * Get upcoming events
   * @param {number} limit - Maximum number of events to return
   */
  getUpcomingEvents: async (limit = 5) => {
    const response = await api.get(`/api/v1/calendar/upcoming?limit=${limit}`);
    return response.data.data || [];
  },

  /**
   * Get events by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  getEventsByDateRange: async (startDate, endDate) => {
    const response = await api.get(
      `/api/v1/calendar/events/range?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data || [];
  },

  /**
   * Get events by month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   */
  getEventsByMonth: async (year, month) => {
    const response = await api.get(`/api/v1/calendar/events/month/${year}/${month}`);
    return response.data.data || [];
  },

  /**
   * Get availability slots for a specific date
   * @param {string} date - Date (YYYY-MM-DD)
   */
  getAvailabilitySlots: async (date) => {
    const response = await api.get(`/api/v1/calendar/availability?date=${date}`);
    return response.data.data?.slots || [];
  },

  /**
   * Search events
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   */
  searchEvents: async (query, limit = 50) => {
    const response = await api.get(`/api/v1/calendar/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data.data || [];
  }
};

export default calendarApi;