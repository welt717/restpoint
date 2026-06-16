# Restpoint Platform - Database Audit

## Database Architecture

| Component | Technology | Version | Details |
|-----------|-----------|---------|---------|
| Primary DB | MariaDB | 10.11 | Centralized database for all services |
| Cache | Redis | 7 Alpine | Session cache, rate limiting, BullMQ queues |
| Migration Tool | Node.js scripts | - | Custom migrate.js/seed.js scripts |
| ORM | mysql2 (direct), Knex (marketplace) | - | Direct SQL connections |

## Configuration

- **Host**: mariadb (Docker), localhost (dev)
- **Port**: 3306
- **Database**: restpoint_system
- **User**: root
- **Password**: Defined in .env (DB_PASSWORD)
- **Connection Pool**: Min 5, Max 30
- **SSL**: Enabled (configurable)

## Migration Status

| File | Exists | Status |
|------|--------|--------|
| `scripts/migrate.js` | ❌ Not found | Missing |
| `scripts/seed.js` | ❌ Not found | Missing |
| `scripts/run-tenant-migrations.ts` | ✅ Tenant service | Present |
| `services/chemical-service/database.sql` | ✅ Present | SQL file |

## Seed Data

- Default admin: welt (configured in .env)
- System tenant configuration
- Service initialization data

## Issues Found

1. **Centralized database**: All services share one database - consider tenant isolation
2. **Missing migration scripts**: `scripts/migrate.js` and `scripts/seed.js` referenced in Makefile but missing
3. **Root user access**: All services connect as root - implement per-service database users
4. **No seed data tracking**: No migrations framework for tracking applied seeds
5. **Missing foreign keys**: Need to verify schema integrity

## Recommendations

1. **Create migration scripts**: Implement proper migration files
2. **Database per service**: Consider isolated databases for multi-tenancy
3. **Use service accounts**: Create per-service database users with limited permissions
4. **Add migration tracking**: Use a `migrations` table to track applied migrations
5. **Validate startup ordering**: Ensure MariaDB is healthy before services start
6. **Implement seed workers**: Add seed scripts that check if data already exists