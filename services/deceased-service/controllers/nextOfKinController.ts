import { Request, Response } from 'express';
import axios from 'axios';
import { NextOfKinModel, CreateNextOfKinDTO, UpdateNextOfKinDTO } from '../models/NextOfKin';
import { tenantDB } from '../config/tenantDatabase';

// Validation function for Next of Kin data
const validateNextOfKinData = (data: CreateNextOfKinDTO): string[] => {
  const errors: string[] = [];
  
  if (!data.deceased_id) errors.push('deceased_id is required');
  if (!data.full_name) errors.push('full_name is required');
  if (!data.relationship) errors.push('relationship is required');
  if (!data.contact) errors.push('contact is required');
  
  // Validate email format if provided
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate phone number (Kenyan format)
  if (data.contact && !/^(\+254|0)[17]\d{8}$/.test(data.contact)) {
    errors.push('Invalid contact number format. Use Kenyan format (e.g., 0712345678 or +254712345678)');
  }
  
  return errors;
};

// Register Next of Kin
export const nextOfKinRegister = async (req: Request, res: Response): Promise<Response> => {
  const { 
    deceased_id, 
    full_name, 
    relationship, 
    contact, 
    email,
    is_primary = false,
    address,
    alternative_contact
  } = req.body;

  // Get tenant slug from header or subdomain
  const tenantSlug = req.headers['x-tenant-slug'] as string || 'default';

  // Validate required fields
  const validationErrors = validateNextOfKinData({ deceased_id, full_name, relationship, contact, email });
  
  if (validationErrors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  try {
    // Check if deceased exists
    const conn = await tenantDB.getConnection(tenantSlug);
    try {
      const [deceasedCheck] = await conn.execute(
        'SELECT deceased_id FROM deceased WHERE deceased_id = ? AND is_deleted = FALSE',
        [deceased_id]
      );

      if ((deceasedCheck as any[]).length === 0) {
        return res.status(404).json({
          message: 'Deceased person not found'
        });
      }

      const createData: CreateNextOfKinDTO = {
        deceased_id,
        full_name,
        relationship,
        contact,
        email,
        is_primary,
        address,
        alternative_contact,
        created_by: (req as any).user?.userId || null
      };

      const result = await NextOfKinModel.create(tenantSlug, createData);

      if (!result) {
        res.status(500).json({
          message: 'Failed to create next of kin record'
        });
        return;
      }

      console.log(`Next of kin registered successfully: ${result.id}`);

      // Create notification for new next of kin registration
      try {
        const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8111';
        await axios.post(`${notificationServiceUrl}/api/v1/restpoint/notification/notifications`, {
          deceased_id,
          type: 'next_of_kin_added',
          message: `New next of kin added: ${full_name} (${relationship}) for deceased ID: ${deceased_id}`
        }, {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.warn('⚠️ Could not create notification:', err.message);
        });
      } catch (notifError) {
        console.warn('⚠️ Notification creation failed:', notifError);
        // Don't fail the registration if notification fails
      }

      return res.status(201).json({
        message: 'Next of kin registered successfully',
        kin_id: result.id,
        is_primary: result.is_primary
      });
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('Error inserting next of kin:', error.message);
    
    if (error.message.includes('Only one primary next of kin')) {
      return res.status(400).json({
        message: error.message
      });
    }
    
    return res.status(500).json({
      message: 'Failed to register next of kin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fetch Next of Kin By Deceased ID
export const getNextOfKinByDeceasedId = async (req: Request, res: Response): Promise<Response> => {
  const { deceased_id } = req.query as { deceased_id?: string };
  
  if (!deceased_id) {
    return res.status(400).json({ 
      message: 'deceased_id is required' 
    });
  }

  const tenantSlug = req.headers['x-tenant-slug'] as string || 'default';

  try {
    const rows = await NextOfKinModel.getByDeceasedId(tenantSlug, deceased_id);

    console.log(`Next of kin fetched for deceased ${deceased_id}: ${rows.length}`);

    return res.status(200).json({
      message: 'Next of kin fetched successfully',
      count: rows.length,
      data: rows,
    });
    
  } catch (error: any) {
    console.error('Error fetching next of kin:', error.message);
    
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update Next of Kin
export const updateNextOfKin = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const updates = req.body;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Next of kin ID is required' });
  }

  const tenantSlug = req.headers['x-tenant-slug'] as string || 'default';
  
  try {
    const updateData: UpdateNextOfKinDTO = {};
    const allowedFields = ['full_name', 'relationship', 'contact', 'email', 'is_primary', 'address', 'alternative_contact'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (updateData as any)[field] = updates[field];
      }
    });
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const result = await NextOfKinModel.update(tenantSlug, parseInt(id), updateData);
    
    if (!result) {
      return res.status(404).json({ message: 'Next of kin record not found' });
    }
    
    console.log(`Next of kin updated: ${id}`);
    
    return res.status(200).json({
      message: 'Next of kin updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating next of kin:', error.message);
    
    return res.status(500).json({
      message: 'Failed to update next of kin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete Next of Kin (Soft Delete)
export const deleteNextOfKin = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Next of kin ID is required' });
  }

  const tenantSlug = req.headers['x-tenant-slug'] as string || 'default';
  
  try {
    const result = await NextOfKinModel.delete(tenantSlug, parseInt(id));
    
    if (!result) {
      return res.status(404).json({ message: 'Next of kin record not found' });
    }
    
    console.log(`Next of kin deleted: ${id}`);
    
    return res.status(200).json({
      message: 'Next of kin deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting next of kin:', error.message);
    
    return res.status(500).json({
      message: 'Failed to delete next of kin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark as Notified
export const markAsNotified = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Next of kin ID is required' });
  }

  const tenantSlug = req.headers['x-tenant-slug'] as string || 'default';
  
  try {
    const result = await NextOfKinModel.markNotified(tenantSlug, parseInt(id));
    
    if (!result) {
      return res.status(404).json({ message: 'Next of kin record not found' });
    }
    
    return res.status(200).json({
      message: 'Next of kin marked as notified successfully'
    });
    
  } catch (error: any) {
    console.error('Error marking next of kin as notified:', error.message);
    
    return res.status(500).json({
      message: 'Failed to mark as notified'
    });
  }
};