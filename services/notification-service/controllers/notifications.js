const { safeTenantQuery, safeMasterQuery } = require('../../../shared/dbConfig');
const { getKenyaTimeISO } = require('../../utilities/timeStamps/timeStamps'); // Kenya timezone helper

async function handleDeceasedNotifications(tenantDbName, io = null) {
  console.log({ message: `📢 Running notifications for tenant DB: ${tenantDbName}` });

  try {
    // Only process deceased records created/updated in the last cycle
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    
    // Fetch recently created or updated deceased records
    const recentDeceased = await safeTenantQuery(tenantDbName, 
      `SELECT * FROM deceased WHERE created_at >= ? OR updated_at >= ?`,
      [oneHourAgo, oneHourAgo]
    );
    
    console.log(`🧾 Found ${recentDeceased.length} recent deceased record(s) for ${tenantDbName}.`);

    for (const deceased of recentDeceased) {
      const {
        deceased_id,
        full_name,
        date_of_birth,
        status,
        total_mortuary_charge,
        created_at,
      } = deceased;
      
      console.log(`⚰️ Processing deceased ID: ${deceased_id} - Name: ${full_name}`);

      const deceasedDetails = `Name: ${full_name}, DOB: ${date_of_birth || 'N/A'}, Status: ${status || 'N/A'}, Mortuary Charge: KES ${total_mortuary_charge || 0}`;

      // Only create new_body notification if recently created (within last hour)
      if (created_at && new Date(created_at) >= new Date(oneHourAgo)) {
        await insertNotification(tenantDbName,
          deceased_id,
          'new_body',
          `New body registered: ID #${deceased_id}. Details: ${deceasedDetails}`,
          io
        );
      }

      // Check Autopsy Record (only if not already notified)
      const existingAutopsy = await safeTenantQuery(tenantDbName,
        `SELECT * FROM notifications WHERE deceased_id = ? AND type = 'autopsy_done'`,
        [deceased_id],
      );
      
      if (existingAutopsy.length === 0) {
        const autopsy = await safeTenantQuery(tenantDbName,
          `SELECT * FROM postmortem WHERE deceased_id = ?`,
          [deceased_id],
        );
        if (autopsy.length > 0) {
          await insertNotification(tenantDbName,
            deceased_id,
            'autopsy_done',
            `Autopsy completed for body ID #${deceased_id}. Details: ${deceasedDetails}`,
            io
          );
        }
      }

      // Check Dispatch Record (only if not already notified)
      const existingDispatch = await safeTenantQuery(tenantDbName,
        `SELECT * FROM notifications WHERE deceased_id = ? AND type = 'dispatch_created'`,
        [deceased_id],
      );
      
      if (existingDispatch.length === 0) {
        const dispatch = await safeTenantQuery(tenantDbName,
          `SELECT * FROM vehicle_dispatch WHERE deceased_id = ? ORDER BY created_at DESC LIMIT 1`,
          [deceased_id],
        );
        if (dispatch.length > 0) {
          const { dispatch_date } = dispatch[0];
          await insertNotification(tenantDbName,
            deceased_id,
            'dispatch_created',
            `Dispatch date set for body ID #${deceased_id} - ${dispatch_date}. Details: ${deceasedDetails}`,
            io
          );
        }
      }

      console.log(`---------------------------------------`);
    }

    // Notify balance for deceased with outstanding balances (only if not already notified recently)
    const balanceDeceased = await safeTenantQuery(tenantDbName, `
      SELECT d.deceased_id, d.full_name, d.total_mortuary_charge, d.date_of_birth, d.status
      FROM deceased d
      LEFT JOIN notifications n ON d.deceased_id = n.deceased_id AND n.type = 'balance_update'
      WHERE d.total_mortuary_charge > 0 AND n.id IS NULL
      LIMIT 10
    `);

    console.log(`💰 Found ${balanceDeceased.length} deceased with outstanding balances for ${tenantDbName}`);

    for (const person of balanceDeceased) {
      const {
        deceased_id,
        full_name,
        total_mortuary_charge,
        date_of_birth,
        status,
      } = person;
      const balanceMessage = `Balance alert for ${full_name} (ID #${deceased_id}): KES ${total_mortuary_charge} remaining in morgue charges.`;
      await insertNotification(tenantDbName, deceased_id, 'balance_update', balanceMessage, io);
    }

    console.log('🎯 Notification cycle complete ✅');
  } catch (error) {
    console.error('❌ Error in notification handler:', error.message || error);
  }
}

async function insertNotification(tenantDbName, deceased_id, type, message, io = null) {
  // Check existing notification of the same type for the deceased to avoid duplicates
  const existing = await safeTenantQuery(tenantDbName,
    `SELECT * FROM notifications WHERE deceased_id = ? AND type = ?`,
    [deceased_id, type],
  );

  if (existing.length > 0) {
    console.log(`⚠️ Skipped duplicate: ${type} - ID: ${deceased_id}`);
    return null;
  }

  // Use your external Kenya timezone timestamp utility
  const formattedDate = getKenyaTimeISO();

  const result = await safeTenantQuery(tenantDbName,
    `INSERT INTO notifications (deceased_id, type, message, created_at, is_read)
     VALUES (?, ?, ?, ?, ?)`,
    [deceased_id, type, message, formattedDate, 0],
  );

  console.log(`✅ Registered: ${type} - ID: ${deceased_id}`);

  const notification = {
    id: result.insertId,
    deceased_id,
    type,
    message,
    created_at: formattedDate,
    is_read: 0
  };

  // Broadcast new notification via Socket.IO if io instance is provided
  if (io) {
    io.emit('new_notification', notification);
    console.log(`📢 Broadcasted new_notification via Socket.IO - Type: ${type}`);
  }

  return notification;
}

// ====================== CREATE NOTIFICATION (Real-time API) ======================
async function createNotification(req, res) {
  try {
    const { deceased_id, type, message } = req.body;
    const tenantDb = req.tenantDbName || req.headers['x-tenant-db'];
    
    if (!tenantDb) {
      return res.status(400).json({ success: false, message: 'Tenant DB not provided' });
    }
    
    if (!deceased_id || !type || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'deceased_id, type, and message are required' 
      });
    }

    const notification = await insertNotification(tenantDb, deceased_id, type, message, req.io);
    
    if (!notification) {
      return res.status(409).json({ 
        success: false, 
        message: 'Notification already exists (duplicate)' 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Notification created successfully',
      data: notification 
    });
  } catch (error) {
    console.error('❌ Failed to create notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message,
    });
  }
}

async function getAllNotifications(req, res) {
  try {
    const tenantDb = req.tenantDbName || req.headers['x-tenant-db'];
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant DB not provided' });

    const notifications = await safeTenantQuery(tenantDb, `
      SELECT * FROM notifications
      ORDER BY created_at DESC
    `);

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
}

// ====================== MARK AS READ ======================
async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;

    const tenantDb = req.tenantDbName || req.headers['x-tenant-db'];
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant DB not provided' });

    await safeTenantQuery(tenantDb, `UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
}

// ====================== MARK ALL AS READ ======================
async function markAllNotificationsAsRead(req, res) {
  try {
    const tenantDb = req.tenantDbName || req.headers['x-tenant-db'];
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant DB not provided' });

    await safeTenantQuery(tenantDb, `UPDATE notifications SET is_read = 1`);

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Failed to mark all notifications as read:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message,
    });
  }
}

// ====================== DELETE NOTIFICATION ======================
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    const tenantDb = req.tenantDbName || req.headers['x-tenant-db'];
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant DB not provided' });

    await safeTenantQuery(tenantDb, `DELETE FROM notifications WHERE id = ?`, [id]);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('❌ Failed to delete notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
}

module.exports = {
  getAllNotifications,
  handleDeceasedNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
};
