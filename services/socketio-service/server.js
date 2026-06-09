const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.SOCKET_PORT || 8010;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity
});

// Redis Adapter for Scalability
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log("🚀 Socket.IO Redis Adapter connected");
}).catch(err => {
  console.error("❌ Redis connection error:", err);
  process.exit(1);
});

// Store active user rooms
const userRooms = new Map();

io.on("connection", (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // ============================================
  // TENANT & USER ROOM MANAGEMENT
  // ============================================

  /**
   * Join tenant room for real-time updates
   * Expected: { tenantSlug, userId, userRole }
   */
  socket.on("join-tenant", (data) => {
    const { tenantSlug, userId, userRole } = data;
    
    if (!tenantSlug) {
      socket.emit("error", { message: "Tenant slug required" });
      return;
    }

    const tenantRoom = `tenant_${tenantSlug}`;
    const userRoom = `user_${userId}`;

    socket.join(tenantRoom);
    socket.join(userRoom);

    userRooms.set(socket.id, { tenantSlug, userId, userRole });

    console.log(`📡 Socket ${socket.id} joined tenant_${tenantSlug} as ${userRole}`);
    
    socket.emit("joined", {
      room: tenantRoom,
      userId,
      role: userRole,
      timestamp: new Date()
    });
  });

  /**
   * Join deceased record room for specific updates
   * Expected: { tenantSlug, deceasedId }
   */
  socket.on("join-deceased", (data) => {
    const { tenantSlug, deceasedId } = data;
    const deceasedRoom = `deceased_${tenantSlug}_${deceasedId}`;
    
    socket.join(deceasedRoom);
    console.log(`📡 Socket ${socket.id} joined ${deceasedRoom}`);
    
    socket.emit("joined-deceased", { room: deceasedRoom, deceasedId });
  });

  // ============================================
  // MORTUARY EVENT NOTIFICATIONS
  // ============================================

  /**
   * New deceased admission
   * Broadcast: { deceasedId, fullName, dateOfDeath, admissionNumber }
   */
  socket.on("deceased-admitted", (data) => {
    const { tenantSlug, deceasedId, fullName, admissionNumber, dateOfAdmission } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("notification:deceased-admitted", {
      deceasedId,
      fullName,
      admissionNumber,
      dateOfAdmission,
      timestamp: new Date()
    });
    
    console.log(`✅ New admission: ${fullName} (${deceasedId})`);
  });

  /**
   * Embalming status update
   */
  socket.on("deceased-embalmed", (data) => {
    const { tenantSlug, deceasedId, deceasedName, embalmerName } = data;
    
    io.to(`deceased_${tenantSlug}_${deceasedId}`).emit("status:embalmed", {
      deceasedId,
      deceasedName,
      embalmerName,
      status: "embalmed",
      timestamp: new Date()
    });

    io.to(`tenant_${tenantSlug}`).emit("notification:status-change", {
      deceasedId,
      status: "embalmed",
      timestamp: new Date()
    });
  });

  /**
   * Release approval request
   */
  socket.on("release-requested", (data) => {
    const { tenantSlug, deceasedId, deceasedName, requestedBy } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("notification:release-requested", {
      deceasedId,
      deceasedName,
      requestedBy,
      timestamp: new Date()
    });

    console.log(`🔔 Release requested for: ${deceasedName}`);
  });

  /**
   * Release approved
   */
  socket.on("release-approved", (data) => {
    const { tenantSlug, deceasedId, deceasedName, approvedBy } = data;
    
    io.to(`deceased_${tenantSlug}_${deceasedId}`).emit("status:release-approved", {
      deceasedId,
      deceasedName,
      approvedBy,
      timestamp: new Date()
    });

    io.to(`tenant_${tenantSlug}`).emit("notification:release-approved", {
      deceasedId,
      deceasedName,
      approvedBy,
      timestamp: new Date()
    });
  });

  /**
   * Deceased released
   */
  socket.on("deceased-released", (data) => {
    const { tenantSlug, deceasedId, deceasedName, releasedBy, releaseDate } = data;
    
    io.to(`deceased_${tenantSlug}_${deceasedId}`).emit("status:released", {
      deceasedId,
      deceasedName,
      releasedBy,
      releaseDate,
      timestamp: new Date()
    });

    // Remove from monitoring
    io.to(`deceased_${tenantSlug}_${deceasedId}`).disconnectSockets(true);
  });

  // ============================================
  // INVOICE & PAYMENT NOTIFICATIONS
  // ============================================

  /**
   * Invoice created/issued
   */
  socket.on("invoice-created", (data) => {
    const { tenantSlug, deceasedId, invoiceNumber, total, createdBy } = data;
    
    io.to(`deceased_${tenantSlug}_${deceasedId}`).emit("notification:invoice-created", {
      invoiceNumber,
      total,
      createdBy,
      timestamp: new Date()
    });

    io.to(`tenant_${tenantSlug}`).emit("notification:invoice-created", {
      deceasedId,
      invoiceNumber,
      total,
      timestamp: new Date()
    });
  });

  /**
   * Payment received
   */
  socket.on("payment-received", (data) => {
    const { tenantSlug, invoiceId, invoiceNumber, amount, paymentMethod, receivedBy } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("notification:payment-received", {
      invoiceId,
      invoiceNumber,
      amount,
      paymentMethod,
      receivedBy,
      timestamp: new Date()
    });

    console.log(`💰 Payment received: ${invoiceNumber} - ${amount}`);
  });

  /**
   * Invoice overdue alert
   */
  socket.on("invoice-overdue", (data) => {
    const { tenantSlug, invoiceNumber, daysOverdue, outstandingAmount } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("alert:invoice-overdue", {
      invoiceNumber,
      daysOverdue,
      outstandingAmount,
      timestamp: new Date()
    });
  });

  // ============================================
  // INVENTORY & STOCK NOTIFICATIONS
  // ============================================

  /**
   * Low stock alert
   */
  socket.on("stock-alert", (data) => {
    const { tenantSlug, itemType, itemName, currentStock, minimumStock } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("alert:low-stock", {
      itemType,
      itemName,
      currentStock,
      minimumStock,
      timestamp: new Date()
    });

    console.log(`⚠️ Low stock alert: ${itemName} (${currentStock}/${minimumStock})`);
  });

  /**
   * Coffin used
   */
  socket.on("coffin-used", (data) => {
    const { tenantSlug, coffinType, deceasedName, usedBy } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("notification:coffin-used", {
      coffinType,
      deceasedName,
      usedBy,
      timestamp: new Date()
    });
  });

  // ============================================
  // DOCUMENT & PROCESS NOTIFICATIONS
  // ============================================

  /**
   * Document generated
   */
  socket.on("document-generated", (data) => {
    const { tenantSlug, deceasedId, documentType, documentName, generatedBy } = data;
    
    io.to(`deceased_${tenantSlug}_${deceasedId}`).emit("notification:document-generated", {
      documentType,
      documentName,
      generatedBy,
      timestamp: new Date()
    });

    io.to(`tenant_${tenantSlug}`).emit("notification:document-generated", {
      deceasedId,
      documentType,
      documentName,
      timestamp: new Date()
    });
  });

  /**
   * Task/process completed
   */
  socket.on("task-completed", (data) => {
    const { tenantSlug, taskType, deceasedId, deceasedName, completedBy } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("notification:task-completed", {
      taskType,
      deceasedId,
      deceasedName,
      completedBy,
      timestamp: new Date()
    });
  });

  // ============================================
  // DASHBOARD & ANALYTICS
  // ============================================

  /**
   * Request live statistics
   */
  socket.on("request-stats", (data) => {
    const { tenantSlug } = data;
    const userRoom = userRooms.get(socket.id);

    if (!userRoom || userRoom.tenantSlug !== tenantSlug) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    // Emit to a stats service listener if available
    io.emit("stats-request", { tenantSlug, socketId: socket.id });
  });

  /**
   * Broadcast live statistics update
   */
  socket.on("broadcast-stats", (data) => {
    const { tenantSlug, stats } = data;
    
    io.to(`tenant_${tenantSlug}`).emit("stats-update", {
      stats,
      timestamp: new Date()
    });
  });

  // ============================================
  // SYSTEM EVENTS
  // ============================================

  socket.on("disconnect", () => {
    userRooms.delete(socket.id);
    console.log(`👋 User disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(`❌ Socket error (${socket.id}):`, error);
  });
});

// ============================================
// EXTERNAL API FOR SERVICE EMISSIONS
// ============================================

/**
 * REST endpoint for services to emit socket events
 * Used by microservices to trigger real-time notifications
 */
app.post("/emit/:event", express.json(), (req, res) => {
  const { event } = req.params;
  const { tenantSlug, data } = req.body;

  if (!tenantSlug || !data) {
    return res.status(400).json({ error: "Missing tenantSlug or data" });
  }

  // Emit to tenant room
  io.to(`tenant_${tenantSlug}`).emit(`notification:${event}`, {
    ...data,
    timestamp: new Date()
  });

  console.log(`📤 Emitted ${event} to tenant_${tenantSlug}`);
  res.json({ success: true, event, tenantSlug });
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "socketio-service",
    timestamp: new Date(),
    port: PORT
  });
});

/**
 * Active connections info
 */
app.get("/connections", (req, res) => {
  res.json({
    activeConnections: io.engine.clientsCount,
    userRooms: userRooms.size,
    timestamp: new Date()
  });
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n⚡ Socket.IO Service running on port ${PORT}`);
  console.log(`📍 WebSocket: ws://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 API: http://localhost:${PORT}/emit/:event`);
  console.log('\n🎯 Event handlers configured for:');
  console.log('   - Deceased admissions');
  console.log('   - Embalming status updates');
  console.log('   - Release approvals');
  console.log('   - Invoice notifications');
  console.log('   - Payment alerts');
  console.log('   - Stock notifications');
  console.log('   - Document generation');
  console.log('\n✅ Ready for real-time mortuary notifications!\n');
});
