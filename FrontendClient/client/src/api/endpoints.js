// src/api/endpoints.js
// Rest Point — Canonical API endpoint map
// All paths use /api/v2/ for the PHP backend
// Base URL: VITE_API_URL || http://localhost:8000

const API_PREFIX = '/api/v2/restpoint';

export const ENDPOINTS = {
  AUTH: {
    LOGIN:    `${API_PREFIX}/auth/login`,
    LOGOUT:   `${API_PREFIX}/auth/logout`,
    REGISTER: `${API_PREFIX}/tenants/register`,
    REFRESH:  `${API_PREFIX}/auth/refresh`,
    ME:       `${API_PREFIX}/auth/me`,
    VERIFY:   `${API_PREFIX}/auth/verify`,
    STATUS:   `${API_PREFIX}/auth/status`,
    FORGOT_PASSWORD:  `${API_PREFIX}/auth/forgot-password`,
    VERIFY_CODE:      `${API_PREFIX}/auth/verify-code`,
    RESET_PASSWORD:   `${API_PREFIX}/auth/reset-password`,
  },

  TENANT: {
    REGISTER: `${API_PREFIX}/tenants/register`,
    CONFIG:   (slug) => `${API_PREFIX}/tenants/config/${slug}`,
    BRANDING: (slug) => `${API_PREFIX}/tenants/branding/${slug}`,
    LIST:     `${API_PREFIX}/tenants`,
    BRANCHES: `${API_PREFIX}/tenants/branches`,
    ADD_BRANCH: `${API_PREFIX}/tenants/branches`,
    CHARGES:  `${API_PREFIX}/tenants/charges`,
    ADD_CHARGE: `${API_PREFIX}/tenants/charges`,
  },

  DECEASED: {
    LIST:        `${API_PREFIX}/deceased/deceased-all`,
    CREATE:      `${API_PREFIX}/deceased/register-deceased`,
    DETAIL:      (id) => `${API_PREFIX}/deceased/deceased-id?id=${id}`,
    UPDATE:      (id) => `${API_PREFIX}/deceased/update-deceased/${id}`,
    DELETE:      (id) => `${API_PREFIX}/deceased/${id}`,
    SEARCH:      `${API_PREFIX}/deceased/search`,
    QR:          (id) => `${API_PREFIX}/deceased/${id}/qr`,
    CHECKOUT:    (id) => `${API_PREFIX}/deceased/${id}/checkout`,
    NEXT_OF_KIN: (id) => `${API_PREFIX}/deceased/${id}/next-of-kin`,
    DOCUMENTS:   (id) => `${API_PREFIX}/deceased/${id}/documents`,
    EXPORT_EXCEL: `${API_PREFIX}/deceased/export-excel`,
  },

  EMBALMING: {
    LIST:   `${API_PREFIX}/embalming`,
    CREATE: `${API_PREFIX}/embalming`,
    DETAIL: (id) => `${API_PREFIX}/embalming/${id}`,
    UPDATE: (id) => `${API_PREFIX}/embalming/${id}`,
    DELETE: (id) => `${API_PREFIX}/embalming/${id}`,
  },

  HEARSE: {
    LIST:      `${API_PREFIX}/hearse`,
    BOOKINGS:  `${API_PREFIX}/hearse/bookings`,
    CREATE:    `${API_PREFIX}/hearse/bookings`,
    DETAIL:    (id) => `${API_PREFIX}/hearse/bookings/${id}`,
    UPDATE:    (id) => `${API_PREFIX}/hearse/bookings/${id}`,
    DISPATCH:  (id) => `${API_PREFIX}/hearse/bookings/${id}/dispatch`,
    VEHICLES:  `${API_PREFIX}/hearse/vehicles`,
    TRACKING:  (vehicleId) => `${API_PREFIX}/hearse/vehicles/${vehicleId}/location`,
  },

  INVOICE: {
    LIST:    `${API_PREFIX}/invoices`,
    CREATE:  `${API_PREFIX}/invoices`,
    DETAIL:  (id) => `${API_PREFIX}/invoices/${id}`,
    UPDATE:  (id) => `${API_PREFIX}/invoices/${id}`,
    DELETE:  (id) => `${API_PREFIX}/invoices/${id}`,
    PAY:     (id) => `${API_PREFIX}/invoices/${id}/pay`,
    PDF:     (id) => `${API_PREFIX}/invoices/${id}/pdf`,
    MPESA:   (id) => `${API_PREFIX}/invoices/${id}/mpesa`,
    GENERATE:(deceasedId) => `${API_PREFIX}/invoice/${deceasedId}`,
  },

  PAYMENT: {
    LIST:           `${API_PREFIX}/payments`,
    DETAIL:         (id) => `${API_PREFIX}/payments/${id}`,
    DELETE:         (id) => `${API_PREFIX}/payments/${id}`,
    STATUS:         (id) => `${API_PREFIX}/payments/${id}/status`,
    MANUAL:         `${API_PREFIX}/payments/manual`,
    STATS:          `${API_PREFIX}/payments/stats`,
    UPDATE:         `${API_PREFIX}/update-payment`,
    STK_PUSH:       `${API_PREFIX}/initiate-stk-push`,
    VERIFY_MPESA:   `${API_PREFIX}/verify-mpesa`,
  },

  DOCUMENTS: {
    LIST:     `${API_PREFIX}/documents`,
    UPLOAD:   `${API_PREFIX}/documents/upload`,
    DETAIL:   (id) => `${API_PREFIX}/documents/${id}`,
    DELETE:   (id) => `${API_PREFIX}/documents/${id}`,
    DOWNLOAD: (id) => `${API_PREFIX}/documents/${id}/download`,
  },

  ANALYTICS: {
    MORTUARY:   `${API_PREFIX}/analytics/mortuary-analytics`,
    VEHICLES:   `${API_PREFIX}/analytics/vehicle-analytics`,
    FINANCIALS: `${API_PREFIX}/analytics/financials`,
    DASHBOARD:  `${API_PREFIX}/analytics/dashboard`,
  },

  REPORTS: {
    LIST:     `${API_PREFIX}/reports`,
    GENERATE: `${API_PREFIX}/reports/generate`,
    DOWNLOAD: (id) => `${API_PREFIX}/reports/${id}/download`,
  },

  NOTIFICATIONS: {
    LIST:      `${API_PREFIX}/notification/notifications`,
    CREATE:    `${API_PREFIX}/notification/notifications`,
    MARK_READ: (id) => `${API_PREFIX}/notification/notifications/${id}/read`,
    MARK_ALL:  `${API_PREFIX}/notification/notifications/mark-all-read`,
    DELETE:    (id) => `${API_PREFIX}/notification/notifications/${id}`,
  },

  VISITORS: {
    LIST:       `${API_PREFIX}/visitors`,
    CREATE:     `${API_PREFIX}/visitors`,
    DETAIL:     (id) => `${API_PREFIX}/visitors/${id}`,
    UPDATE:     (id) => `${API_PREFIX}/visitors/${id}`,
    CHECKOUT:   (id) => `${API_PREFIX}/visitors/${id}/checkout`,
  },

  CALENDAR: {
    LIST:            `${API_PREFIX}/calendar/events`,
    CREATE:          `${API_PREFIX}/calendar/events`,
    DETAIL:          (id) => `${API_PREFIX}/calendar/events/${id}`,
    UPDATE:          (id) => `${API_PREFIX}/calendar/events/${id}`,
    DELETE:          (id) => `${API_PREFIX}/calendar/events/${id}`,
    BY_DATE:         (date) => `${API_PREFIX}/calendar/events/date/${date}`,
    BY_RANGE:        `${API_PREFIX}/calendar/events/range`,
    BY_TYPE:         (type) => `${API_PREFIX}/calendar/events/type/${type}`,
    UPCOMING:        `${API_PREFIX}/calendar/events/upcoming`,
    EXPORT:          `${API_PREFIX}/calendar/events/export`,
    BY_MONTH:        (year, month) => `${API_PREFIX}/calendar/events/month/${year}/${month}`,
    AVAILABILITY:    `${API_PREFIX}/calendar/availability`,
    SEARCH:          `${API_PREFIX}/calendar/search`,
    STATISTICS:      `${API_PREFIX}/calendar/statistics`,
  },

  MORTUARY: {
    LIST:     `${API_PREFIX}/mortuary`,
    CHAMBERS: `${API_PREFIX}/mortuary/chambers`,
    OCCUPANCY:`${API_PREFIX}/mortuary/occupancy`,
    CHECKOUT: `${API_PREFIX}/mortuary/checkout`,
  },

  USERS: {
    LIST:     `${API_PREFIX}/users`,
    DETAIL:   (id) => `${API_PREFIX}/users/${id}`,
    UPDATE:   (id) => `${API_PREFIX}/users/${id}`,
    DELETE:   (id) => `${API_PREFIX}/users/${id}`,
    ROLES:    `${API_PREFIX}/users/roles`,
    REGISTER: `${API_PREFIX}/users/register`,
    STATUS:   (id) => `${API_PREFIX}/users/${id}/status`,
    PASSWORD: (id) => `${API_PREFIX}/users/${id}/password`,
  },

  COFFINS: {
    LIST:        `${API_PREFIX}/coffins`,
    CREATE:      `${API_PREFIX}/coffins`,
    DETAIL:      (id) => `${API_PREFIX}/coffins/${id}`,
    UPDATE:      (id) => `${API_PREFIX}/coffins/${id}`,
    DELETE:      (id) => `${API_PREFIX}/coffins/${id}`,
    ASSIGN:      `${API_PREFIX}/coffins/assign`,
    EXPORT:      `${API_PREFIX}/coffins/export/excel`,
    ASSIGNMENTS: `${API_PREFIX}/assignments/recent`,
  },

  SEARCH: {
    GLOBAL:      `${API_PREFIX}/search/global`,
    MODULE:      (module) => `${API_PREFIX}/search/${module}`,
    SUGGESTIONS: `${API_PREFIX}/search/suggestions`,
    RECENT:      `${API_PREFIX}/search/recent`,
  },

  PORTAL: {
    LOGIN:   `${API_PREFIX}/portal/login`,
    LOOKUP:  `${API_PREFIX}/portal/lookup`,
    DECEASED: (deceasedId) => `${API_PREFIX}/portal/deceased/${deceasedId}`,
  },

  PUBLIC: {
    TENANT_BRANDING:     (slug) => `/api/v2/public/tenants/${slug}/branding`,
    DECEASED_RECORD:     (slug, publicId) => `/api/v2/public/tenants/${slug}/deceased/${publicId}`,
    SEARCH_DECEASED:     (slug) => `/api/v2/public/tenants/${slug}/deceased/search`,
    PUBLISHED_DECEASED:  (slug) => `/api/v2/public/tenants/${slug}/deceased`,
    QR_CODE:             (qrCode) => `/api/v2/public/deceased/${qrCode}`,
    REQUEST_ACCESS:      (slug) => `/api/v2/public/tenants/${slug}/request-access`,
    HEARSE_BOOK:         (slug) => `/api/v2/public/tenants/${slug}/hearse/book`,
    TENANT_STATUS:       (slug) => `/api/v2/public/tenants/${slug}/status`,
  },

  CALL: {
    ROOM:      (slug) => `${API_PREFIX}/call/room/${slug}`,
    ROOMS:     `${API_PREFIX}/call/rooms`,
    CALL_TENANT: `${API_PREFIX}/call/call-tenant`,
    BRANCH_DIRECTORY: `${API_PREFIX}/call/branches`,
  },

  MEMORIAL: {
    BASE:        (slug) => `${API_PREFIX}/memorial/${slug}`,
    DETAIL:      (slug) => `${API_PREFIX}/memorial/${slug}`,
    CANDLES:     (slug) => `${API_PREFIX}/memorial/${slug}/candles`,
    LIGHT:       (slug) => `${API_PREFIX}/memorial/${slug}/candles/light`,
    CONDOLENCES: (slug) => `${API_PREFIX}/memorial/${slug}/condolences`,
    ADD_CONDOLENCE: (slug) => `${API_PREFIX}/memorial/${slug}/condolences`,
    MEMORIES:    (slug) => `${API_PREFIX}/memorial/${slug}/memories`,
    ADD_MEMORY:  (slug) => `${API_PREFIX}/memorial/${slug}/memories`,
    PROGRAM:     (slug) => `${API_PREFIX}/memorial/${slug}/program`,
    SHARE_LINK:  (slug, token) => `${API_PREFIX}/memorial/${slug}/share/${token}`,
    PUBLIC:      (slug, deceasedId) => `/api/v2/public/memorial/${slug}/${deceasedId}`,
  },

  // MARKETPLACE - Per-tenant listings with real-time orders
  MARKETPLACE: {
    PRODUCTS:  `${API_PREFIX}/marketplace/products`,
    ORDERS:    `${API_PREFIX}/marketplace/orders`,
    CATEGORIES: `${API_PREFIX}/marketplace/categories`,
  },

  // CHEMICALS - Chemical Management Module
  CHEMICALS: {
    LIST:        `${API_PREFIX}/chemicals`,
    CREATE:      `${API_PREFIX}/chemicals`,
    DETAIL:      (id) => `${API_PREFIX}/chemicals/${id}`,
    UPDATE:      (id) => `${API_PREFIX}/chemicals/${id}`,
    DELETE:      (id) => `${API_PREFIX}/chemicals/${id}`,
    RECEIVE:     (id) => `${API_PREFIX}/chemicals/${id}/receive`,
    ADJUST:      (id) => `${API_PREFIX}/chemicals/${id}/adjust`,
    TRANSACTIONS:(id) => `${API_PREFIX}/chemicals/${id}/transactions`,
    USAGE:       `${API_PREFIX}/chemicals/usage`,
    USAGE_BY_DECEASED: (id) => `${API_PREFIX}/chemicals/usage/deceased/${id}`,
    USAGE_REPORT:`${API_PREFIX}/chemicals/usage/report`,
    DASHBOARD:   `${API_PREFIX}/chemicals/dashboard/summary`,
    LOW_STOCK:   `${API_PREFIX}/chemicals/alerts/low-stock`,
  },

  // E-DOCUMENTS - Template/Document editing via PHP backend
  EDOCUMENTS: {
    LIST:        `${API_PREFIX}/edocuments`,
    CREATE:      `${API_PREFIX}/edocuments`,
    DETAIL:      (id) => `${API_PREFIX}/edocuments/${id}`,
    UPDATE:      (id) => `${API_PREFIX}/edocuments/${id}`,
    DELETE:      (id) => `${API_PREFIX}/edocuments/${id}`,
    TEMPLATES:   `${API_PREFIX}/edocuments/templates`,
    TEMPLATE_DETAIL: (id) => `${API_PREFIX}/edocuments/templates/${id}`,
    SAVE_CANVAS: (id) => `${API_PREFIX}/edocuments/${id}/canvas`,
    RENDER:      (id) => `${API_PREFIX}/edocuments/${id}/render`,
  },
};