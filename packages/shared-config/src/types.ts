/**
 * Shared types for configuration, database, and tenancy
 */

import type { Request } from 'express';

// ============================================================
// DATABASE
// ============================================================

export type DatabaseRow = Record<string, unknown>;

export interface QueryResult {
  affectedRows?: number;
  insertId?: number;
  changedRows?: number;
}

// ============================================================
// TENANT INTERFACES
// ============================================================

export interface TenantRecord {
  id: number;
  slug: string;
  organization_name: string;
  is_active: 0 | 1;
  subscription_status: string | null;
  subscription_expires_at: string | null;
}

export interface TenantValidationResult {
  active: boolean;
  reason?: string;
  tenant?: TenantRecord;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends AppError {
  public readonly query?: string;

  constructor(message = 'Database operation failed', query?: string) {
    super(message, 500, 'DATABASE_ERROR', false);
    this.query = query;
  }
}

export class TenantIsolationError extends AppError {
  public readonly tenantSlug?: string;

  constructor(message = 'Tenant access denied', tenantSlug?: string) {
    super(message, 403, 'TENANT_ISOLATION_ERROR');
    this.tenantSlug = tenantSlug;
  }
}

export class ValidationError extends AppError {
  public readonly fields?: string[];

  constructor(message: string, fields?: string[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

// ============================================================
// REQUEST AUGMENTATION
// ============================================================

declare module 'express-serve-static-core' {
  interface Request {
    tenantId?: number;
    tenantSlug?: string;
    tenant?: TenantRecord;
  }
}
