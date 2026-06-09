export interface OnboardingRequest {
  organizationName: string;
  email: string;
  location: string;
  password: string;
  termsAccepted: boolean;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  organizationId?: number;
  userId?: number;
  token?: string;
  user?: {
    id: number;
    organizationId: number;
    email: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    organizationId: number;
    email: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        organizationId: number;
        email: string;
        role: string;
      };
    }
  }
}
