/**
 * Centralized API Service Index
 * 
 * This file exports all API services and provides a single entry point
 * for all API calls in the application. All API calls should go through
 * this module to ensure consistent handling of:
 * - Multi-tenant headers (x-tenant-slug)
 * - Authentication tokens
 * - Error handling and retries
 * - Request/response logging
 * 
 * Usage:
 *   import { authApi, deceasedApi, documentsApi, ... } from '@/api';
 */

// Core axios instance with interceptors
export { default as apiClient } from './axios';

// Individual API services
export { authApi } from './authApi';
export { deceasedApi } from './deceasedApi';
export { embalmingApi } from './embalmingApi';
export { invoiceApi } from './invoiceApi';
export { analyticsApi } from './analyticsApi';
export { tenantApi } from './tenant.api';
export { calendarApi } from './calendar.api';

// Re-export endpoints for direct access if needed
export { ENDPOINTS } from './endpoints';

// Public API (no auth required)
export { publicApi } from './publicApi';

// Generic client for custom requests
export { default as client } from './client';

/**
 * API Configuration
 * 
 * Base URL: VITE_API_URL (from .env) or http://localhost:8000
 * All requests include:
 * - Authorization header (Bearer token)
 * - x-tenant-slug header for multi-tenancy
 * - Content-Type: application/json
 * 
 * Rate limiting is handled by the API Gateway.
 */

/**
 * Multi-tenant header helper
 * Returns the current tenant slug from localStorage
 */
export const getCurrentTenantSlug = () => {
  return localStorage.getItem('tenant_slug') || 'system_shared';
};

/**
 * Set the active tenant slug
 * This will be included in all subsequent API calls
 */
export const setTenantSlug = (slug) => {
  localStorage.setItem('tenant_slug', slug);
};

/**
 * Clear tenant context (on logout)
 */
export const clearTenantContext = () => {
  localStorage.removeItem('tenant_slug');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};