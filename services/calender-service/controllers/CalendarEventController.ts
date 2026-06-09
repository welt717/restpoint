import { Request, Response } from 'express';
import CalendarEventService from '../services/CalendarEventService';
import { CreateEventDTO, UpdateEventDTO } from '../models/Event';

/**
 * Calendar Event Controller
 */

export class CalendarEventController {
  /**
   * Create a new calendar event
   * POST /api/v1/calendar/events
   */
  static async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const eventData: CreateEventDTO = req.body;

      // Validation
      if (!eventData.title || !eventData.start || !eventData.end) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: title, start, end'
        });
        return;
      }

      const result = await CalendarEventService.createEvent(tenantSlug, eventData);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: result.event,
        id: result.id
      });
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create event'
      });
    }
  }

  /**
   * Get all events with filters
   * GET /api/v1/calendar/events
   */
  static async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const { startDate, endDate, category, status, limit, offset } = req.query;

      const events = await CalendarEventService.getEvents(tenantSlug, {
        startDate: startDate as string,
        endDate: endDate as string,
        category: category as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : 1000,
        offset: offset ? parseInt(offset as string) : 0
      });

      res.json({
        success: true,
        message: 'Events retrieved successfully',
        data: events,
        count: events.length
      });
    } catch (error: any) {
      console.error('Error retrieving events:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve events'
      });
    }
  }

  /**
   * Get specific event by ID
   * GET /api/v1/calendar/events/:id
   */
  static async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const eventId = parseInt(req.params.id as string);

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
        return;
      }

      const event = await CalendarEventService.getEventById(tenantSlug, eventId);

      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Event retrieved successfully',
        data: event
      });
    } catch (error: any) {
      console.error('Error retrieving event:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve event'
      });
    }
  }

  /**
   * Get events by month
   * GET /api/v1/calendar/events/month/:year/:month
   */
  static async getEventsByMonth(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const year = parseInt(req.params.year as string);
      const month = parseInt(req.params.month as string);

      if (!year || !month || month < 1 || month > 12) {
        res.status(400).json({
          success: false,
          message: 'Invalid year or month'
        });
        return;
      }

      const events = await CalendarEventService.getEventsByMonth(tenantSlug, year, month);

      res.json({
        success: true,
        message: `Events for ${year}-${month} retrieved successfully`,
        data: events,
        count: events.length,
        month,
        year
      });
    } catch (error: any) {
      console.error('Error retrieving events by month:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve events'
      });
    }
  }

  /**
   * Get events by date range
   * GET /api/v1/calendar/events/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getEventsByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters: startDate, endDate'
        });
        return;
      }

      const events = await CalendarEventService.getEventsByDateRange(
        tenantSlug,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        message: 'Events retrieved successfully',
        data: events,
        count: events.length,
        dateRange: { startDate, endDate }
      });
    } catch (error: any) {
      console.error('Error retrieving events by date range:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve events'
      });
    }
  }

  /**
   * Update an event
   * PUT /api/v1/calendar/events/:id
   */
  static async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const eventId = parseInt(req.params.id as string);
      const updateData: UpdateEventDTO = req.body;

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
        return;
      }

      // Check if event exists
      const event = await CalendarEventService.getEventById(tenantSlug, eventId);
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found'
        });
        return;
      }

      const updated = await CalendarEventService.updateEvent(tenantSlug, eventId, updateData);

      if (!updated) {
        res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: { id: eventId, ...updateData }
      });
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update event'
      });
    }
  }

  /**
   * Delete an event (soft delete)
   * DELETE /api/v1/calendar/events/:id
   */
  static async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const eventId = parseInt(req.params.id as string);

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
        return;
      }

      const deleted = await CalendarEventService.deleteEvent(tenantSlug, eventId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Event not found or already deleted'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Event deleted successfully',
        data: { id: eventId }
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete event'
      });
    }
  }

  /**
   * Get availability slots
   * GET /api/v1/calendar/availability?date=YYYY-MM-DD
   */
  static async getAvailabilitySlots(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: date'
        });
        return;
      }

      const slots = await CalendarEventService.getAvailabilitySlots(tenantSlug, date as string);

      res.json({
        success: true,
        message: 'Availability slots retrieved successfully',
        data: {
          date,
          slots,
          totalSlots: slots.length,
          availableSlots: slots.filter(s => s.available).length
        }
      });
    } catch (error: any) {
      console.error('Error retrieving availability:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve availability'
      });
    }
  }

  /**
   * Get event statistics
   * GET /api/v1/calendar/statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;

      const statistics = await CalendarEventService.getEventStatistics(tenantSlug);

      res.json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: statistics
      });
    } catch (error: any) {
      console.error('Error retrieving statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve statistics'
      });
    }
  }

  /**
   * Get upcoming events
   * GET /api/v1/calendar/upcoming?limit=10
   */
  static async getUpcomingEvents(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const events = await CalendarEventService.getUpcomingEvents(tenantSlug, limit);

      res.json({
        success: true,
        message: 'Upcoming events retrieved successfully',
        data: events,
        count: events.length
      });
    } catch (error: any) {
      console.error('Error retrieving upcoming events:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve upcoming events'
      });
    }
  }

  /**
   * Search events
   * GET /api/v1/calendar/search?q=search_term
   */
  static async searchEvents(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.tenantSlug!;
      const { q, limit } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: q (search query)'
        });
        return;
      }

      const events = await CalendarEventService.searchEvents(
        tenantSlug,
        q as string,
        limit ? parseInt(limit as string) : 50
      );

      res.json({
        success: true,
        message: 'Search results retrieved successfully',
        data: events,
        count: events.length,
        query: q
      });
    } catch (error: any) {
      console.error('Error searching events:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search events'
      });
    }
  }
}

export default CalendarEventController;
