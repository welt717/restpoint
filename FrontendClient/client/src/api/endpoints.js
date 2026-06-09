// src/api/endpoints.js
// Montezuma ERP — Canonical API endpoint map
// All paths routed through the API Gateway (base: VITE_API_URL || http://localhost:8000)

export const ENDPOINTS = {
  AUTH: {
    LOGIN:    '/api/v1/restpoint/auth/login',
    LOGOUT:   '/api/v1/restpoint/auth/logout',
    REGISTER: '/api/v1/restpoint/tenants/register',  // Actually tenant registration
    REFRESH:  '/api/v1/restpoint/auth/refresh',
    ME:       '/api/v1/restpoint/auth/me',
    VERIFY:   '/api/v1/restpoint/auth/verify',
    STATUS:   '/api/v1/restpoint/auth/status',
  },

  // ─── TENANT ─────────────────────────────────────────────────────────────────
  TENANT: {
    REGISTER: '/api/v1/restpoint/tenants/register',
    CONFIG:   (slug) => `/api/v1/restpoint/tenants/config/${slug}`,
    BRANDING: (slug) => `/api/v1/restpoint/tenants/branding/${slug}`,
    LIST:     '/api/v1/restpoint/tenants',
  },

  // ─── DECEASED ───────────────────────────────────────────────────────────────
  DECEASED: {
    LIST:        '/api/v1/restpoint/deceased/deceased-all',
    CREATE:      '/api/v1/restpoint/deceased/register-deceased',
    DETAIL:      (id) => `/api/v1/restpoint/deceased/deceased-id?id=${id}`,
    UPDATE:      (id) => `/api/v1/restpoint/deceased/update-deceased/${id}`,
    DELETE:      (id) => `/api/v1/restpoint/deceased/${id}`,
    SEARCH:      '/api/v1/restpoint/deceased/search',
    QR:          (id) => `/api/v1/restpoint/deceased/${id}/qr`,
    CHECKOUT:    (id) => `/api/v1/restpoint/deceased/${id}/checkout`,
    NEXT_OF_KIN: (id) => `/api/v1/restpoint/deceased/${id}/next-of-kin`,
    DOCUMENTS:   (id) => `/api/v1/restpoint/deceased/${id}/documents`,
    EXPORT_EXCEL: '/api/v1/restpoint/deceased/export-excel',
  },

  // ─── EMBALMING ──────────────────────────────────────────────────────────────
  EMBALMING: {
    LIST:   '/api/v1/restpoint/embalming',
    CREATE: '/api/v1/restpoint/embalming',
    DETAIL: (id) => `/api/v1/restpoint/embalming/${id}`,
    UPDATE: (id) => `/api/v1/restpoint/embalming/${id}`,
    DELETE: (id) => `/api/v1/restpoint/embalming/${id}`,
  },

  // ─── HEARSE ─────────────────────────────────────────────────────────────────
  HEARSE: {
    LIST:      '/api/v1/restpoint/hearse',
    BOOKINGS:  '/api/v1/restpoint/hearse/bookings',
    CREATE:    '/api/v1/restpoint/hearse/bookings',
    DETAIL:    (id) => `/api/v1/restpoint/hearse/bookings/${id}`,
    UPDATE:    (id) => `/api/v1/restpoint/hearse/bookings/${id}`,
    DISPATCH:  (id) => `/api/v1/restpoint/hearse/bookings/${id}/dispatch`,
    VEHICLES:  '/api/v1/restpoint/hearse/vehicles',
    TRACKING:  (vehicleId) => `/api/v1/restpoint/hearse/vehicles/${vehicleId}/location`,
  },

  // ─── INVOICES ───────────────────────────────────────────────────────────────
  INVOICE: {
    LIST:    '/api/v1/restpoint/invoices',
    CREATE:  '/api/v1/restpoint/invoices',
    DETAIL:  (id) => `/api/v1/restpoint/invoices/${id}`,
    UPDATE:  (id) => `/api/v1/restpoint/invoices/${id}`,
    DELETE:  (id) => `/api/v1/restpoint/invoices/${id}`,
    PAY:     (id) => `/api/v1/restpoint/invoices/${id}/pay`,
    PDF:     (id) => `/api/v1/restpoint/invoices/${id}/pdf`,
    MPESA:   (id) => `/api/v1/restpoint/invoices/${id}/mpesa`,
  },

  // ─── DOCUMENTS ──────────────────────────────────────────────────────────────
  DOCUMENTS: {
    LIST:     '/api/v1/restpoint/documents',
    UPLOAD:   '/api/v1/restpoint/documents/upload',
    DETAIL:   (id) => `/api/v1/restpoint/documents/${id}`,
    DELETE:   (id) => `/api/v1/restpoint/documents/${id}`,
    DOWNLOAD: (id) => `/api/v1/restpoint/documents/${id}/download`,
  },

  // ─── ANALYTICS ──────────────────────────────────────────────────────────────
  ANALYTICS: {
    MORTUARY:   '/api/v1/restpoint/analytics/mortuary-analytics',
    VEHICLES:   '/api/v1/restpoint/analytics/vehicle-analytics',
    FINANCIALS: '/api/v1/restpoint/analytics/financials',
    DASHBOARD:  '/api/v1/restpoint/analytics/dashboard',
  },

  // ─── REPORTS ────────────────────────────────────────────────────────────────
  REPORTS: {
    LIST:     '/api/v1/restpoint/reports',
    GENERATE: '/api/v1/restpoint/reports/generate',
    DOWNLOAD: (id) => `/api/v1/restpoint/reports/${id}/download`,
  },

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    LIST:       '/api/v1/restpoint/notifications',
    MARK_READ:  (id) => `/api/v1/restpoint/notifications/${id}/read`,
    MARK_ALL:   '/api/v1/restpoint/notifications/read-all',
    DELETE:     (id) => `/api/v1/restpoint/notifications/${id}`,
  },

  // ─── VISITORS ───────────────────────────────────────────────────────────────
  VISITORS: {
    LIST:       '/api/v1/restpoint/visitors',
    CREATE:     '/api/v1/restpoint/visitors',
    DETAIL:     (id) => `/api/v1/restpoint/visitors/${id}`,
    UPDATE:     (id) => `/api/v1/restpoint/visitors/${id}`,
    CHECKOUT:   (id) => `/api/v1/restpoint/visitors/${id}/checkout`,
  },

  // ─── CALENDAR ───────────────────────────────────────────────────────────────
  CALENDAR: {
    LIST:      '/api/v1/restpoint/calendar/events',
    CREATE:    '/api/v1/restpoint/calendar/events',
    DETAIL:    (id) => `/api/v1/restpoint/calendar/events/${id}`,
    UPDATE:    (id) => `/api/v1/restpoint/calendar/events/${id}`,
    DELETE:    (id) => `/api/v1/restpoint/calendar/events/${id}`,
    BY_DATE:   (date) => `/api/v1/restpoint/calendar/events/date/${date}`,
    BY_RANGE:  '/api/v1/restpoint/calendar/events/range',
    BY_TYPE:   (type) => `/api/v1/restpoint/calendar/events/type/${type}`,
    UPCOMING:  '/api/v1/restpoint/calendar/events/upcoming',
    EXPORT:    '/api/v1/restpoint/calendar/events/export',
  },

  // ─── MORTUARY / BODY CHECKOUT ───────────────────────────────────────────────
  MORTUARY: {
    LIST:     '/api/v1/restpoint/mortuary',
    CHAMBERS: '/api/v1/restpoint/mortuary/chambers',
    OCCUPANCY:'/api/v1/restpoint/mortuary/occupancy',
    CHECKOUT: '/api/v1/restpoint/mortuary/checkout',
  },

  // ─── USERS (admin) ──────────────────────────────────────────────────────────
  USERS: {
    LIST:   '/api/v1/restpoint/users',
    DETAIL: (id) => `/api/v1/restpoint/users/${id}`,
    UPDATE: (id) => `/api/v1/restpoint/users/${id}`,
    DELETE: (id) => `/api/v1/restpoint/users/${id}`,
    ROLES:  '/api/v1/restpoint/users/roles',
  },

  // ─── COFFINS ──────────────────────────────────────────────────────────────────
  COFFINS: {
    LIST:       '/api/v1/restpoint/coffins',
    CREATE:     '/api/v1/restpoint/coffins',
    DETAIL:     (id) => `/api/v1/restpoint/coffins/${id}`,
    UPDATE:     (id) => `/api/v1/restpoint/coffins/${id}`,
    DELETE:     (id) => `/api/v1/restpoint/coffins/${id}`,
    ASSIGN:     '/api/v1/restpoint/coffins/assign',
    EXPORT:     '/api/v1/restpoint/coffins/export/excel',
    ASSIGNMENTS: '/api/v1/restpoint/assignments/recent',
  },

  // ─── SEARCH (AI Assistant) ────────────────────────────────────────────────────
  SEARCH: {
    GLOBAL:     '/api/v1/search/global',
    MODULE:     (module) => `/api/v1/search/${module}`,
    SUGGESTIONS: '/api/v1/search/suggestions',
    RECENT:     '/api/v1/search/recent',
  },

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    LIST:      '/api/v1/restpoint/notification/notifications',
    CREATE:    '/api/v1/restpoint/notification/notifications',
    MARK_READ: (id) => `/api/v1/restpoint/notification/notifications/${id}/read`,
    MARK_ALL:  '/api/v1/restpoint/notification/notifications/mark-all-read',
    DELETE:    (id) => `/api/v1/restpoint/notification/notifications/${id}`,
  },
};
