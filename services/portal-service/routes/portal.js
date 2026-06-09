const express = require('express');
const router = express.Router();

// Import controllers
const { loginToPortal, logoutFromPortal } = require('../controllers/aceesPortal');
const {
  getPortalDeceasedById,
  getDeceasedFinancialDetails,
  getDeceasedDocuments,
  getDeceasedServicesAndCosts,
  getDeceasedBillingSummary,
  getDeceasedCompleteProfile,
  getAllDeceasedData
} = require('../controllers/portal');

// ----------------- ROUTES -----------------

// Portal Authentication
router.post('/portal/login', loginToPortal);
router.post('/portal/logout', logoutFromPortal);

// Deceased Information Endpoints
router.get('/deceased/:deceased_id', getPortalDeceasedById);
router.get('/deceased/:deceased_id/complete', getDeceasedCompleteProfile);
router.get('/deceased/:deceased_id/all', getAllDeceasedData);

// Financial Endpoints
router.get('/deceased/:deceased_id/financial', getDeceasedFinancialDetails);
router.get('/deceased/:deceased_id/billing', getDeceasedBillingSummary);
router.get('/deceased/:deceased_id/services', getDeceasedServicesAndCosts);

// Document Endpoints
router.get('/documents/:deceased_id', getDeceasedDocuments);

// Portal Info (backward compatibility)
router.get('/portal/info/:deceased_id', getDeceasedFinancialDetails);
router.get('/portal/documents/:deceased_id', getDeceasedDocuments);
router.get('/portal/services/:deceased_id', getDeceasedServicesAndCosts);

module.exports = router;