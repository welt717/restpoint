# Restpoint Platform - Repository Map

## Architecture Overview

```
restpoint/
├── FrontendClient/          # Frontend Application
│   └── client/              # Vite + React SPA
├── packages/                # Shared Libraries
│   ├── shared-config/       # Configuration
│   ├── shared-logger/       # Logging utilities
│   ├── shared-services/     # Shared service interfaces
│   └── shared-utils/        # Common utilities
├── scripts/                 # Build and deploy scripts
│   └── deploy.sh
├── services/                # Microservice Backend
│   ├── api-gateway/         # API Gateway (to be renamed restpoint-gateway)
│   ├── analytics-service/   # Analytics & reporting
│   ├── auth-service/        # Authentication & authorization
│   ├── bodycheckout-service/# Body checkout management
│   ├── calender-service/    # Calendar & scheduling
│   ├── call-service/        # Call management
│   ├── chemical-service/    # Chemical/embalming inventory
│   ├── coffin-service/      # Coffin inventory & assignment
│   ├── deceased-service/    # Deceased records management
│   ├── documents-service/   # Document management
│   ├── edocuments-service/  # Electronic documents editor
│   ├── extra-services/      # Extra service charges
│   ├── invoice-service/     # Invoice generation & management
│   ├── marketplace-service/ # Marketplace/ordering
│   ├── mpesa-service/       # M-Pesa payment integration
│   ├── notification-service/# Email/SMS notifications
│   ├── portal-service/      # Family portal
│   ├── qrcode-service/      # QR code generation
│   ├── socketio-service/    # WebSocket real-time communication
│   ├── tenant-service/      # Multi-tenant management
│   ├── updates/             # System updates
│   └── visitors-service/    # Visitor management
├── shared/                  # Shared code (legacy)
│   ├── dbConfig.ts
│   └── services/
└── config files:            # Root configuration
    ├── .env, .env.example, .env.production
    ├── docker-compose.yml, docker-compose.prod.yml
    ├── tsconfig.json, tsconfig.base.json
    ├── Makefile
    ├── nginx.conf
    ├── eslint.config.js
    └── package.json
```

## Service Port Mapping

| Service              | Port | Container Name          |
|----------------------|------|-------------------------|
| API Gateway          | 5000 | restpoint_gateway       |
| Auth Service         | 5001 | restpoint_auth          |
| Tenant Service       | 5002 | restpoint_tenant        |
| Deceased Service     | 5003 | restpoint_deceased      |
| Marketplace Service  | 5004 | restpoint_marketplace   |
| Invoice Service      | 5005 | restpoint_invoice       |
| Coffin Service       | 5006 | restpoint_coffin        |
| Documents Service    | 5007 | restpoint_documents     |
| Edocuments Service   | 5008 | restpoint_edocuments    |
| Analytics Service    | 5009 | restpoint_analytics     |
| Calender Service     | 5010 | restpoint_calender      |
| Mpesa Service        | 5011 | restpoint_mpesa         |
| QR Code Service      | 5012 | restpoint_qrcode        |
| SocketIO Service     | 5013 | restpoint_socketio      |
| Visitors Service     | 5014 | restpoint_visitors      |
| Bodycheckout Service | 5015 | restpoint_bodycheckout  |
| Extra Services       | 5016 | restpoint_extra         |
| Updates Service      | 5017 | restpoint_updates       |
| Call Service         | 5018 | restpoint_call          |
| Portal Service       | 5019 | restpoint_portal        |
| Chemical Service     | 5105 | restpoint_chemical      |
| Notification Service | 5111 | restpoint_notification  |
| MariaDB              | 3306 | restpoint_db            |
| Redis                | 6379 | restpoint_redis         |
| Frontend             | 8082 | restpoint_frontend      |

## Technology Stack

- **Frontend**: React 18, Vite 8, MUI 5, TailwindCSS, React Router v6
- **Backend**: Node.js, Express, TypeScript
- **Database**: MariaDB 10.11
- **Cache**: Redis 7 Alpine
- **Container**: Docker, Docker Compose
- **Package Manager**: Yarn (Yarn Workspaces)
- **API Gateway**: Custom Node.js + HTTP Proxy

## Package Manager

- Root: Yarn Workspaces with `packages/*` and `services/*`
- Frontend: npm-based (FrontendClient/client/package-lock.json)
- Shared packages in `packages/` directory
- 21 microservices in `services/` directory

## Current Issues Identified

1. **Missing scripts**: Root package.json lacks dev, build, lint, test, typecheck scripts
2. **Broken workspace**: Services are JS-based but tsconfig expects TS; FrontendClient not in workspaces
3. **TypeScript inconsistency**: Different tsconfig targets (ES2020 vs ES2022), missing project references
4. **Security concerns**: Hardcoded passwords/secrets in Makefile and .env
5. **Docker issues**: Some Dockerfiles may be missing or incorrect
6. **API Gateway naming**: Needs rename from api-gateway to restpoint-gateway
7. **No .nvmrc, .tool-versions**: Runtime version management missing
8. **Dependency conflicts**: Various package versions may conflict
9. **Missing health endpoints**: Need to verify every service has /health
10. **Makefile uses deprecated commands**: `docker-compose` should be `docker compose`
11. **Hardcoded credentials**: In Makefile (line 54-55) exposed admin credentials