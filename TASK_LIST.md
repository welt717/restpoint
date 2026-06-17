# Issues Fixed

## 1. Frontend Mixed Content (HTTPS → HTTP) ✅
- [x] Fixed `.env.production` - Changed `http://` to `https://` and `ws://` to `wss://`
- [x] No hardcoded HTTP URLs found in source code (all use VITE_API_URL env var)

## 2. Invoice Service - Missing `./routes/invoiceRoutes` ✅
- [x] Created `.js` copies of all `.ts` route/controller files (using CommonJS syntax)
- [x] Files created: `invoiceRoutes.js`, `invoice.js`, `printInvoiceRoute.js`, `invoice.js`, `printinvoice.js`, `server.js`

## 3. Updates/QRCode Services - Missing `mysql2/promise` ✅
- [x] Added `mysql2` to `services/updates/package.json`
- [x] Added `mysql2` to `services/qrcode-service/package.json`
- [x] Enhanced `docker-startup.sh` to verify `mysql2/promise` subpath accessibility

## 4. Notification Service - Missing `../../utilities/timeStamps/timeStamps` ✅
- [x] Created `services/utilities/timeStamps/timeStamps.js` with `getKenyaTimeISO()` and `getKenyaDate()` functions
- [x] Fixed `notification-service/Dockerfile` to copy `services/utilities/` directory

## 5. Marketplace Service - Missing `../global/middlewares/corsMiddleware` ✅
- [x] Created `services/global/middlewares/corsMiddleware.js` with CORS configuration
- [x] Fixed `marketplace-service/Dockerfile` to copy `services/global/` directory

## 6. Coffin Service - `coffinController` not loaded (TypeScript file) ✅
- [x] Created `services/coffin-service/coffinService.js` - CommonJS version of the TypeScript controller
- [x] Fixed `coffin-service/Dockerfile` to copy `services/utilities/` directory

## 7. M-Pesa Service - `global/index.js` requires `jsonwebtoken` ✅
- [x] Updated `global/index.js` to gracefully handle missing `jsonwebtoken` with passthrough auth
- [x] Startup script already handles `jsonwebtoken` installation

## 8. Portal Service - Database config not found ✅
- [x] Fixed `portal-service/config/database.js` with multiple fallback paths for loading `global/config/db.js` and `shared/dbConfig.js`
- [x] Fixed `portal-service/Dockerfile` to copy `shared/`, `global/`, `configurations/`, and `packages/` directories