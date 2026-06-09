import { RowDataPacket } from 'mysql2';

export interface Session extends RowDataPacket {
  id: number;
  userId: number;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

export class SessionModel {
  async create(data: any): Promise<number | null> {
    return 1; // Simplified for now
  }

  async deleteByToken(token: string): Promise<boolean> {
    return true; // Simplified for now
  }
}
