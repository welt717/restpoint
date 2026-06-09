import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface User {
  user_id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user';
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  tenant_id: number;
  tenant_name: string;
  tenant_slug: string;
  db_name: string;
  email: string;
  phone?: string;
  location?: string;
  status: 'active' | 'suspended' | 'deleted';
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  user_agent?: string;
  ip_address?: string;
  is_active: boolean;
  created_at: Date;
  expires_at: Date;
  revoked_at?: Date;
}

export interface LoginLog {
  id: number;
  user_id?: number;
  identifier: string;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface QueryResult<T = any> extends RowDataPacket {
  [key: string]: T;
}

export interface TransactionResult {
  insertId?: number;
  affectedRows?: number;
}

export type QueryResponse<T = any> = T[];
export type QueryOneResponse<T = any> = T | null;