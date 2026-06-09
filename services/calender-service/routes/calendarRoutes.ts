import { Router } from 'express';
import CalendarEventController from '../controllers/CalendarEventController';

/**
 * Calendar Event Routes
 */

const router = Router();

// Create event
router.post('/events', CalendarEventController.createEvent);

// Get all events with filters
router.get('/events', CalendarEventController.getEvents);

// Get events by month
router.get('/events/month/:year/:month', CalendarEventController.getEventsByMonth);

// Get events by date range
router.get('/events/range', CalendarEventController.getEventsByDateRange);

// Get specific event
router.get('/events/:id', CalendarEventController.getEventById);

// Update event
router.put('/events/:id', CalendarEventController.updateEvent);

// Delete event
router.delete('/events/:id', CalendarEventController.deleteEvent);

// Get availability slots
router.get('/availability', CalendarEventController.getAvailabilitySlots);

// Get statistics
router.get('/statistics', CalendarEventController.getStatistics);

// Get upcoming events
router.get('/upcoming', CalendarEventController.getUpcomingEvents);

// Search events
router.get('/search', CalendarEventController.searchEvents);

export default router;
