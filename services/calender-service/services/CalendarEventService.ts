import { Pool } from 'mysql2/promise';
import { CalendarEvent, CreateEventDTO, UpdateEventDTO, EventQueryOptions } from '../models/Event';
import { getTenantPool, getTenantDatabaseName, executeTenantQuery } from '../database';

/**
 * Calendar Event Service
 * Handles all calendar event operations with tenant isolation
 */

export class CalendarEventService {
  /**
   * Create a new calendar event
   */
  static async createEvent(
    tenantSlug: string,
    eventData: CreateEventDTO
  ): Promise<{ id: number; event: CalendarEvent }> {
    const tenantDb = getTenantDatabaseName(tenantSlug);
    const pool = await getTenantPool(tenantDb);

    const {
      title,
      description,
      start,
      end,
      category = 'OTHER',
      priority = 'MEDIUM',
      status = 'PENDING',
      staff = 'Unassigned',
      location,
      all_day = false,
      recurring = false,
      recurrence_rule,
      color,
      reminder_minutes = 30,
      notes,
      created_by
    } = eventData;

    const query = `
      INSERT INTO events (
        title, description, start, end, category, priority, status, 
        staff, location, all_day, recurring, recurrence_rule, color, 
        reminder_minutes, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      title,
      description || null,
      start,
      end,
      category,
      priority,
      status,
      staff,
      location || null,
      all_day ? 1 : 0,
      recurring ? 1 : 0,
      recurrence_rule || null,
      color || null,
      reminder_minutes,
      notes || null,
      created_by || null
    ];

    const [result]: any = await pool.query(query, params);

    return {
      id: result.insertId,
      event: {
        id: result.insertId,
        title,
        description,
        start,
        end,
        category,
        priority: (priority as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
        status: (status as 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') || 'PENDING',
        staff,
        location,
        all_day,
        recurring,
        recurrence_rule,
        color,
        reminder_minutes,
        notes,
        created_by,
        created_at: new Date(),
        updated_at: new Date()
      }
    };
  }

  /**
   * Get event by ID
   */
  static async getEventById(tenantSlug: string, eventId: number): Promise<CalendarEvent | null> {
    const tenantDb = getTenantDatabaseName(tenantSlug);
    
    const result = await executeTenantQuery(
      tenantDb,
      `SELECT * FROM events WHERE id = ? AND is_deleted = FALSE`,
      [eventId]
    );

    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }

    return result[0] as CalendarEvent;
  }

  /**
   * Get all events with filters
   */
  static async getEvents(
    tenantSlug: string,
    options: EventQueryOptions = {}
  ): Promise<CalendarEvent[]> {
    const tenantDb = getTenantDatabaseName(tenantSlug);
    const {
      startDate,
      endDate,
      category,
      status,
      limit = 1000,
      offset = 0
    } = options;

    let query = `
      SELECT * FROM events 
      WHERE is_deleted = FALSE
    `;
    const params: any[] = [];

    if (startDate) {
      query += ` AND start >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND end <= ?`;
      params.push(endDate);
    }

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY start ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await executeTenantQuery(tenantDb, query, params);
    return (Array.isArray(result) ? result : []) as CalendarEvent[];
  }

  /**
   * Get events by month and year
   */
  static async getEventsByMonth(
    tenantSlug: string,
    year: number,
    month: number
  ): Promise<CalendarEvent[]> {
    const tenantDb = getTenantDatabaseName(tenantSlug);

    const result = await executeTenantQuery(
      tenantDb,
      `
      SELECT * FROM events 
      WHERE YEAR(start) = ? AND MONTH(start) = ?
      AND is_deleted = FALSE
      ORDER BY start ASC
      `,
      [year, month]
    );

    return (Array.isArray(result) ? result : []) as CalendarEvent[];
  }

  /**
   * Get events for specific date range
   */
  static async getEventsByDateRange(
    tenantSlug: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]> {
    const tenantDb = getTenantDatabaseName(tenantSlug);

    const result = await executeTenantQuery(
      tenantDb,
      `
      SELECT * FROM events 
      WHERE (start >= ? AND start <= ?)
      OR (end >= ? AND end <= ?)
      OR (start < ? AND end > ?)
      AND is_deleted = FALSE
      ORDER BY start ASC
      `,
      [startDate, endDate, startDate, endDate, startDate, endDate]
    );

    return (Array.isArray(result) ? result : []) as CalendarEvent[];
  }

  /**
   * Update an event
   */
  static async updateEvent(
    tenantSlug: string,
    eventId: number,
    updateData: UpdateEventDTO
  ): Promise<boolean> {
    const tenantDb = getTenantDatabaseName(tenantSlug);

    const allowedFields = [
      'title',
      'description',
      'start',
      'end',
      'category',
      'priority',
      'status',
      'staff',
      'location',
      'all_day',
      'recurring',
      'recurrence_rule',
      'color',
      'reminder_minutes',
      'notes'
    ];

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fieldsToUpdate.length === 0) {
      return false;
    }

    fieldsToUpdate.push('updated_at = NOW()');
    values.push(eventId);

    const query = `UPDATE events SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND is_deleted = FALSE`;

    const [result]: any = await executeTenantQuery(tenantDb, query, values);

    return result.affectedRows > 0;
  }

  /**
   * Delete an event (soft delete)
   */
  static async deleteEvent(tenantSlug: string, eventId: number, deletedBy?: number): Promise<boolean> {
    const tenantDb = getTenantDatabaseName(tenantSlug);

    const [result]: any = await executeTenantQuery(
      tenantDb,
      `
      UPDATE events 
      SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ?
      WHERE id = ? AND is_deleted = FALSE
      `,
      [deletedBy || null, eventId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Get availability slots for a specific date and service type
   */
  static async getAvailabilitySlots(
    tenantSlug: string,
    date: string
  ): Promise<{ time: string; available: boolean }[]> {
    const tenantDb = getTenantDatabaseName(tenantSlug);

    // Get events for the specific date
    const events = await executeTenantQuery(
      tenantDb,
      `
      SELECT start, end FROM events 
      WHERE DATE(start) = ? AND is_deleted = FALSE AND status != 'CANCELLED'
      ORDER BY start ASC
      `,
      [date]
    );

    // Generate time slots for the day (30-minute intervals)
    const slots = [];
    let currentTime = new Date(`${date}T09:00:00`);
    const endTime = new Date(`${date}T17:00:00`);

    const busyTimes = Array.isArray(events) ? events : [];

    while (currentTime < endTime) {
      const timeStr = currentTime.toTimeString().slice(0, 5);
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + 30 * 60 * 1000);

      const isAvailable = !busyTimes.some((event: any) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return slotStart < eventEnd && slotEnd > eventStart;
      });

      slots.push({
        time: timeStr,
        available: isAvailable
      });

      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    return slots;
  }

  /**
   * Get event statistics
   */
  static async getEventStatistics(tenantSlug: string): Promise<any> {
    const tenantDb = getTenantDatabaseName(tenantSlug);

    const result = await executeTenantQuery(
      tenantDb,
      `
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_events,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_events,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_events,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_events,
        COUNT(DISTINCT category) as unique_categories,
        COUNT(DISTINCT MONTH(start)) as events_in_months
      FROM events 
      WHERE is_deleted = FALSE
      `
    );

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(
    tenantSlug: string,
    limit: number = 10
  ): Promise<CalendarEvent[]> {
    const tenantDb = getTenantDatabaseName(tenantSlug);

    const result = await executeTenantQuery(
      tenantDb,
      `
      SELECT * FROM events 
      WHERE start > NOW() AND is_deleted = FALSE AND status != 'CANCELLED'
      ORDER BY start ASC
      LIMIT ?
      `,
      [limit]
    );

    return (Array.isArray(result) ? result : []) as CalendarEvent[];
  }

  /**
   * Search events
   */
  static async searchEvents(
    tenantSlug: string,
    query: string,
    limit: number = 50
  ): Promise<CalendarEvent[]> {
    const tenantDb = getTenantDatabaseName(tenantSlug);
    const searchTerm = `%${query}%`;

    const result = await executeTenantQuery(
      tenantDb,
      `
      SELECT * FROM events 
      WHERE (title LIKE ? OR description LIKE ? OR location LIKE ? OR staff LIKE ?)
      AND is_deleted = FALSE
      ORDER BY start ASC
      LIMIT ?
      `,
      [searchTerm, searchTerm, searchTerm, searchTerm, limit]
    );

    return (Array.isArray(result) ? result : []) as CalendarEvent[];
  }
}

export default CalendarEventService;
