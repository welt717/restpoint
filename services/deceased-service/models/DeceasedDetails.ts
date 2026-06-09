import { RowDataPacket } from 'mysql2';

// Base Deceased Interface
export interface IDeceased extends RowDataPacket {
  id: number;
  deceased_id: string;
  tenant_id: string;
  admission_number: string;
  cause_of_death: string;
  date_admitted: string;
  date_of_birth: string;
  date_of_death: string;
  date_registered: string;
  full_name: string;
  gender: 'Male' | 'Female' | 'Other';
  place_of_death: string;
  county: string;
  national_id: string;
  location: string;
  portal_slug: string;
  billing: number;
  currency: string;
  is_embalmed: boolean;
  cold_room_no: string | null;
  tray_no: string | null;
  registered_by_user_id: number;
  registered_by_name?: string;
  registered_by_username?: string;
  registered_by_role?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// Next of Kin Interface
export interface INextOfKin extends RowDataPacket {
  id: number;
  deceased_id: string;
  full_name: string;
  relationship: string;
  contact: string;
  email: string | null;
  is_primary: boolean;
  is_notified: boolean;
  notified_at: string | null;
  created_at: string;
}

// Vehicle Dispatch Interface
export interface IDispatch extends RowDataPacket {
  id: number;
  deceased_id: string;
  vehicle_id: string;
  driver_name: string;
  dispatch_date: string;
  destination: string;
  status: string;
  notes: string;
}

// Charges Interface
export interface ICharges extends RowDataPacket {
  id: number;
  deceased_id: string;
  charge_type: string;
  amount: number;
  description: string;
  created_at: string;
}

// Payments Interface
export interface IPayments extends RowDataPacket {
  id: number;
  deceased_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: string;
  payment_date: string;
}

// Visitors Interface
export interface IVisitors extends RowDataPacket {
  id: number;
  deceased_id: string;
  visitor_name: string;
  relationship: string;
  visit_date: string;
  contact: string;
  notes: string;
}

// Documents Interface
export interface IDocuments extends RowDataPacket {
  id: number;
  deceased_id: number;
  document_type: string;
  file_path: string;
  file_name: string;
  file_url?: string;
  uploaded_at: string;
}

// Postmortem Interface
export interface IPostmortem extends RowDataPacket {
  id: number;
  deceased_id: string;
  pathologist_id: number;
  pathologist_name?: string;
  findings: string;
  cause_of_death: string;
  report_date: string;
  report_url: string;
}

// Coffin Assignment Interface
export interface ICoffinAssignment extends RowDataPacket {
  id: number;
  deceased_id: string;
  coffin_id: string;
  assigned_date: string;
  created_at: string;
  coffin_custom_id: string;
  coffin_type: string;
  coffin_material: string;
  coffin_size: string;
  coffin_color: string;
  coffin_price: number;
  coffin_currency: string;
  coffin_price_usd: number;
  coffin_quantity: number;
  coffin_supplier: string;
  coffin_origin: string;
  coffin_category: string;
  coffin_image_url: string;
  coffin_notes: string;
}

// Coffin Data Output
export interface ICoffinData {
  assignment_id: number;
  coffin_id: string;
  custom_id: string;
  type: string;
  material: string;
  size: string;
  color: string;
  price: number;
  currency: string;
  price_usd: number;
  quantity: number;
  supplier: string;
  origin: string;
  category: string;
  images: string[];
  primary_image: string | null;
  notes: string;
  assignment_date: string;
}

// Financial Details
export interface IFinancialDetails {
  billing: number;
  other_charges: number;
  extra_charges: number;
  total_charges: number;
  total_payments: number;
  balance: number;
  currency: string;
}

// Cold Room Info
export interface IColdRoomInfo {
  room_no: string | null;
  tray_no: string | null;
}

// Notification
export interface INotification {
  type: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

// Complete Deceased Response
export interface IDeceasedDetailsResponse {
  success: boolean;
  message: string;
  data?: IDeceasedFullData;
  notifications?: INotification[];
  cached?: boolean;
  error?: string;
}

export interface IDeceasedFullData extends IDeceased {
  next_of_kin: INextOfKin[];
  dispatch: IDispatch | null;
  charges: ICharges[];
  extra_charges: ICharges[];
  payments: IPayments[];
  visitors: IVisitors[];
  documents: IDocuments[];
  postmortem: IPostmortem | null;
  coffin_assignment: ICoffinData | null;
  financial_details: IFinancialDetails;
  cold_room_info: IColdRoomInfo;
}

// Cache Entry
interface ICacheEntry {
  data: IDeceasedFullData;
  notifications: INotification[];
  timestamp: number;
}

// Request Parameters
export interface IGetDeceasedParams {
  id?: string;
  deceased_id?: string;
}


// Add these interfaces to existing DeceasedDetails.ts

// Coffin Status Update DTO
export interface ICoffinStatusUpdateDTO {
  deceased_id: string;
  coffin_status: 'pending' | 'assigned' | 'ready' | 'dispatched' | 'collected';
}

// Coffin Status Response
export interface ICoffinStatusResponse {
  success: boolean;
  message: string;
  data?: {
    deceased_id: string;
    coffin_status: string;
    updated_at: string;
  };
}

// Dispatch Date Update DTO
export interface IDispatchDateUpdateDTO {
  deceased_id: string;
  dispatch_date: string;
}

// Dispatch Date Response
export interface IDispatchDateResponse {
  success: boolean;
  message: string;
  data?: {
    deceased_id: string;
    dispatch_date: string;
    updated_at: string;
  };
}

// Deceased Status Log Interface
export interface IDeceasedStatusLog extends RowDataPacket {
  id: number;
  deceased_id: string;
  status: string;
  previous_status: string | null;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

// Deceased Status Update DTO
export interface IDeceasedStatusUpdateDTO {
  deceased_id: string;
  status: 'active' | 'pending' | 'completed' | 'dispatched' | 'archived';
  previous_status?: string;
  changed_by?: string;
  notes?: string;
}

// Deceased Status Update Response
export interface IDeceasedStatusResponse {
  success: boolean;
  message: string;
  data?: {
    deceased_id: string;
    status: string;
    log_id: number;
    timestamp: string;
  };
}

// Status History Query Response
export interface IStatusHistoryResponse {
  success: boolean;
  data?: IDeceasedStatusLog[];
  count?: number;
}


// Add these interfaces to existing DeceasedDetails.ts

// Deceased Update DTO
export interface IDeceasedUpdateDTO {
  full_name?: string;
  gender?: 'Male' | 'Female' | 'Other';
  date_of_birth?: string;
  date_of_death?: string;
  cause_of_death?: string;
  place_of_death?: string;
  admission_number?: string;
  mortuary_id?: string;
  date_admitted?: string;
  dispatch_date?: string;
  county?: string;
  location?: string;
  status?: 'active' | 'pending' | 'completed' | 'dispatched' | 'archived';
  total_mortuary_charge?: number;
  coffin_status?: 'pending' | 'assigned' | 'ready' | 'dispatched' | 'collected';
  is_embalmed?: boolean;
  cold_room_no?: string;
  tray_no?: string;
  billing?: number;
  currency?: string;
}

// Deceased Update Response
export interface IDeceasedUpdateResponse {
  success: boolean;
  message: string;
  data?: IDeceasedFullData;
  updated_fields?: string[];
  error?: string;
}

// Field validation rules
export interface IFieldValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  message?: string;
}