const express = require('express');
const router = express.Router();
const { asyncHandler, verifyToken, verifyTenantAccess } = require('../middleware');
const {
  AuthService,
  DashboardService,
  ProfileService,
  BillingService,
  DocumentsService,
  MarketplaceService,
  CartService,
  OrdersService,
  PaymentsService
} = require('../services');

// ==================== AUTH ROUTES ====================

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({
      status: 'fail',
      message: 'Identifier (admission number or phone) is required'
    });
  }

  const result = await AuthService.login(identifier);
  res.status(200).json(result);
}));

// Verify Token
router.post('/verify-token', verifyToken, asyncHandler(async (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user
  });
}));

// ==================== DASHBOARD ROUTES ====================

// Get Dashboard Data
router.get('/dashboard/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await DashboardService.getDashboardData(deceased_id);
  res.status(200).json(result);
}));

// ==================== PROFILE ROUTES ====================

// Get Profile
router.get('/profile/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await ProfileService.getProfile(deceased_id);
  res.status(200).json(result);
}));

// Update Profile
router.put('/profile/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await ProfileService.updateProfile(deceased_id, req.body);
  res.status(200).json(result);
}));

// ==================== BILLING ROUTES ====================

// Get Billing Data
router.get('/billing/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await BillingService.getBillingData(deceased_id);
  res.status(200).json(result);
}));

// ==================== DOCUMENTS ROUTES ====================

// Get Documents
router.get('/documents/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await DocumentsService.getDocuments(deceased_id);
  res.status(200).json(result);
}));

// Upload Document
router.post('/documents/:deceased_id/upload', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  // File upload handled by middleware (multer)
  // For now, returning success
  res.status(200).json({
    status: 'success',
    message: 'Document uploaded successfully'
  });
}));

// Delete Document
router.delete('/documents/:deceased_id/:document_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { document_id } = req.params;
  const result = await DocumentsService.deleteDocument(document_id);
  res.status(200).json(result);
}));

// ==================== MARKETPLACE ROUTES ====================

// Get Marketplace Products (for THIS TENANT ONLY)
router.get('/marketplace/products/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const { category, search } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (search) filters.search = search;
  filters.status = 'available';

  const result = await MarketplaceService.getProducts(deceased_id, filters);
  res.status(200).json(result);
}));

// Get Single Product
router.get('/marketplace/products/:deceased_id/:product_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const result = await MarketplaceService.getProductById(req.params.product_id);
  res.status(200).json(result);
}));

// ==================== SHOPPING CART ROUTES ====================

// Get Cart
router.get('/cart/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await CartService.getCart(deceased_id);
  res.status(200).json(result);
}));

// Add to Cart
router.post('/cart/:deceased_id/add', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({
      status: 'fail',
      message: 'product_id is required'
    });
  }

  const result = await CartService.addToCart(deceased_id, product_id, quantity);
  res.status(200).json(result);
}));

// Update Cart Item
router.put('/cart/:deceased_id/update', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const { product_id, quantity } = req.body;

  if (!product_id || quantity === undefined) {
    return res.status(400).json({
      status: 'fail',
      message: 'product_id and quantity are required'
    });
  }

  const result = await CartService.updateCartItem(deceased_id, product_id, quantity);
  res.status(200).json(result);
}));

// Remove from Cart
router.delete('/cart/:deceased_id/remove/:product_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id, product_id } = req.params;
  const result = await CartService.removeFromCart(deceased_id, product_id);
  res.status(200).json(result);
}));

// Clear Cart
router.delete('/cart/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await CartService.clearCart(deceased_id);
  res.status(200).json(result);
}));

// ==================== ORDERS ROUTES ====================

// Get Orders
router.get('/orders/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await OrdersService.getOrders(deceased_id);
  res.status(200).json(result);
}));

// Checkout
router.post('/orders/:deceased_id/checkout', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const { notes } = req.body;
  const result = await OrdersService.checkoutCart(deceased_id, notes);
  res.status(200).json(result);
}));

// ==================== PAYMENTS ROUTES ====================

// Get Payment History
router.get('/payments/:deceased_id', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await PaymentsService.getPaymentHistory(deceased_id);
  res.status(200).json(result);
}));

// Record Payment
router.post('/payments/:deceased_id/record', verifyToken, verifyTenantAccess, asyncHandler(async (req, res) => {
  const { deceased_id } = req.params;
  const result = await PaymentsService.recordPayment(deceased_id, req.body);
  res.status(201).json(result);
}));

module.exports = router;
