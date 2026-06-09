# Calendar Service v2.0.0

## Overview

The Calendar Service is a **multi-tenant, REST API service** for managing calendar events in the Montezuma Mortuary SaaS platform. It provides comprehensive event management with:

- ✅ **Tenant Isolation**: Each tenant's data is isolated in their own database
- ✅ **Event Management**: Full CRUD operations on calendar events
- ✅ **Availability Tracking**: Check available time slots for scheduling
- ✅ **Event Statistics**: Analytics and reporting on calendar events
- ✅ **Advanced Filtering**: Search and filter events by multiple criteria
- ✅ **Audit Logging**: Track all changes to events (via tenant database)
- ✅ **Soft Deletes**: Safe deletion with audit trail

## Architecture

```
┌─────────────────────────────────────────┐
│       Calendar Service (v2.0.0)         │
│   Multi-Tenant REST API                 │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴─────────┐
      ▼                  ▼
   Routes            Middleware
   (TypeScript)       (TenantMiddleware)
      │                  │
      └────────┬─────────┘
               ▼
        Controllers
   (CalendarEventController)
               │
      ┌────────┴─────────┐
      ▼                  ▼
   Services          Database
(CalendarEventService)  (Database.ts)
               │
      ┌────────┴─────────────────────┐
      ▼                              ▼
┌──────────────────┐    ┌──────────────────────┐
│ Tenant Database  │    │  Tenant Database     │
│ (tenant_abc123)  │    │  (tenant_xyz789)     │
│                  │    │                      │
│ events table     │    │ events table         │
│ event_attendees  │    │ event_attendees      │
│ event_reminders  │    │ event_reminders      │
└──────────────────┘    └──────────────────────┘
```

## Key Features

### 1. **Tenant Isolation**
- Each request must include `x-tenant-slug` header
- Automatically connects to tenant-specific database
- Data is completely isolated per tenant

### 2. **Event Management**
- Create, Read, Update, Delete events
- Support for recurring events
- Event categories, priorities, and statuses
- Attendee management and RSVP tracking
- Event reminders

### 3. **Availability & Scheduling**
- Check available time slots for specific dates
- Prevent double-booking
- 30-minute interval slots
- Filter by service type

### 4. **Advanced Search & Filtering**
- Search events by title, description, location, staff
- Filter by date range, category, status, priority
- Pagination support
- Sort by multiple fields

### 5. **Statistics & Reporting**
- Event count by status
- Monthly summaries
- Category breakdowns
- Staff workload analysis

## API Endpoints

### Health & Status
```
GET /health
GET /test
```

### Event Management
```
POST   /api/v1/calendar/events              - Create event
GET    /api/v1/calendar/events              - List all events (with filters)
GET    /api/v1/calendar/events/:id          - Get specific event
PUT    /api/v1/calendar/events/:id          - Update event
DELETE /api/v1/calendar/events/:id          - Delete event (soft delete)
```

### Event Queries
```
GET /api/v1/calendar/events/month/:year/:month     - Events by month
GET /api/v1/calendar/events/range?startDate=...&endDate=...  - Date range
GET /api/v1/calendar/upcoming?limit=10             - Upcoming events
GET /api/v1/calendar/search?q=search_term          - Full-text search
```

### Availability & Analytics
```
GET /api/v1/calendar/availability?date=YYYY-MM-DD - Available slots
GET /api/v1/calendar/statistics                    - Event statistics
```

## Request Headers

**Required:**
```
x-tenant-slug: my-mortuary    (identifies the tenant)
```

**Optional:**
```
x-tenant-id: uuid-format-id   (alternative tenant identifier)
```

**Standard:**
```
Content-Type: application/json
Authorization: Bearer token (if authentication is required)
```

## Example Requests

### 1. Create Event
```bash
curl -X POST http://localhost:8104/api/v1/calendar/events \
  -H "x-tenant-slug: my-mortuary" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Funeral Service - John Doe",
    "description": "Memorial service",
    "start": "2024-06-15T10:00:00",
    "end": "2024-06-15T12:00:00",
    "category": "FUNERAL",
    "priority": "HIGH",
    "location": "Chapel Hall",
    "staff": "Rev. James",
    "color": "#3B82F6"
  }'
```

### 2. Get Events by Month
```bash
curl -X GET "http://localhost:8104/api/v1/calendar/events/month/2024/6" \
  -H "x-tenant-slug: my-mortuary"
```

### 3. Get Availability Slots
```bash
curl -X GET "http://localhost:8104/api/v1/calendar/availability?date=2024-06-15" \
  -H "x-tenant-slug: my-mortuary"
```

### 4. Update Event
```bash
curl -X PUT http://localhost:8104/api/v1/calendar/events/5 \
  -H "x-tenant-slug: my-mortuary" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED",
    "staff": "Rev. James, Mr. Smith"
  }'
```

## Database Setup

### Required Tables (Created by Tenant Service)
All tables are created by the tenant service migrations in `apps/tenant-service/migrations/tenant/015_events.sql`

**Tables:**
1. `events` - Main calendar events table
2. `event_attendees` - Event attendees and RSVP status
3. `event_reminders` - Scheduled reminders
4. `event_categories` - Reference table for event types
5. `event_logs` - Audit trail of all changes

### Table Schemas

#### events
```sql
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start TIMESTAMP NOT NULL,
  end TIMESTAMP NOT NULL,
  category ENUM('BURIAL', 'FUNERAL', 'VIEWING', 'EMBALMING', 'COLLECTION', 'MEETING', 'OTHER') DEFAULT 'OTHER',
  priority ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
  status ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  staff VARCHAR(255),
  location VARCHAR(255),
  all_day BOOLEAN DEFAULT FALSE,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(255),
  parent_event_id INT,
  color VARCHAR(50),
  reminder_minutes INT DEFAULT 30,
  notes TEXT,
  created_by INT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  deleted_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (deleted_by) REFERENCES users(user_id),
  FOREIGN KEY (parent_event_id) REFERENCES events(id)
);
```

## Installation & Setup

### 1. Install Dependencies
```bash
cd apps/calender-service
npm install
```

### 2. Configure Environment
Edit `.env` file with your database settings:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
PORT=8104
NODE_ENV=development
```

### 3. Build TypeScript
```bash
npm run build
```

### 4. Run Migrations (In Tenant Service)
```bash
cd apps/tenant-service
npm run migrate
```

### 5. Start Calendar Service
```bash
# Development
npm run dev

# Production
npm start
```

## Development

### Build Project
```bash
npm run build
```

### Watch Mode (Auto-recompile)
```bash
npm run build:watch
```

### Development Server (tsx)
```bash
npm run dev
```

### Watch Mode (Development)
```bash
npm run dev:watch
```

## Important Notes

### ⚠️ Migrations
- **DO NOT** add migrations to calendar service
- All migrations are managed by **tenant service** only
- Calendar service is stateless and only performs queries
- New tenants get their database created by the tenant service

### ⚠️ Database Naming
- Tenant databases follow the pattern: `tenant_{tenant_slug}`
- Slugs are automatically sanitized (lowercase, alphanumeric + underscore)
- Example: tenant slug `MyMortuary-123` → database name `tenant_mymortuary_123`

### ⚠️ Tenant Isolation
- Always include `x-tenant-slug` header in requests
- Missing header will return 400 Bad Request
- Service will connect to appropriate tenant database automatically

### ✅ Soft Deletes
- Events are soft-deleted (not permanently removed)
- Use `is_deleted = FALSE` in queries to exclude deleted events
- Admin can restore or permanently delete if needed

### ✅ Audit Trail
- All event changes are logged in `event_logs` table
- Created by database triggers
- Tracks who made what changes and when

## Error Handling

### Common Errors

**400 Bad Request**
- Missing required fields
- Invalid event ID
- Missing tenant header

**404 Not Found**
- Event not found
- Route not found

**500 Internal Server Error**
- Database connection failed
- Table not found (migrations not run)
- Query execution error

**503 Service Unavailable**
- Database connection refused
- Check database host and port

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* event or array of events */ },
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Performance Optimization

### Indexes
- Date range queries: `idx_start_date`, `idx_end_date`, `idx_start_status`
- Category queries: `idx_category`
- User queries: `idx_created_by`
- Search queries: supported via full-text columns

### Connection Pooling
- Min pool size: 2 connections
- Max pool size: 10 connections
- Connections are cached per tenant database

### Query Optimization
- Pagination supported for large result sets
- Proper indexes on all frequently queried columns
- Views for common queries (upcoming_events_view, today_events_view)

## Monitoring & Logging

### Log Messages
```
✅ Connected to tenant database: tenant_abc123
📍 Request from tenant: my-mortuary
[POST] /api/v1/calendar/events - 201 (45ms)
❌ Error retrieving events: Connection refused
```

### Health Check
```bash
curl http://localhost:8104/health
```

Response:
```json
{
  "status": "UP",
  "service": "calendar-service",
  "timestamp": "2024-06-06T20:02:50.453Z",
  "version": "2.0.0",
  "features": {
    "tenantIsolation": true,
    "eventManagement": true,
    "availability": true,
    "statistics": true
  }
}
```

## Troubleshooting

### Issue: "Tenant information missing"
**Solution**: Add `x-tenant-slug` header to all requests

### Issue: "Calendar table not found"
**Solution**: Run tenant service migrations:
```bash
cd apps/tenant-service
npm run migrate
```

### Issue: "Database connection refused"
**Solution**: 
- Check if MySQL is running
- Verify DB_HOST, DB_USER, DB_PASSWORD in .env
- Check network connectivity

### Issue: "Port already in use"
**Solution**: Change PORT in .env or stop the service using port 8104

## Contributing

When modifying the calendar service:

1. All database schema changes must go to: `apps/tenant-service/migrations/tenant/015_events.sql`
2. Update TypeScript interfaces in `models/Event.ts`
3. Add new service methods to `services/CalendarEventService.ts`
4. Add new endpoints to `routes/calendarRoutes.ts`
5. Add controller methods to `controllers/CalendarEventController.ts`
6. Test with multiple tenants to ensure isolation

## Related Services

- **Tenant Service**: Manages tenant creation and migrations
- **Auth Service**: Provides authentication and authorization
- **API Gateway**: Routes requests to appropriate services
- **Notification Service**: Sends event reminders
- **Deceased Service**: References deceased persons for events

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify database connection settings
3. Ensure migrations are run
4. Check tenant database existence
5. Verify request headers are correct

---

**Last Updated**: June 6, 2024
**Version**: 2.0.0
**Status**: Production Ready ✅
