const asyncHandler = require('express-async-handler');
const AnalyticsService = require('../services/analyticsService');
const AnalyticsModel = require('../models/analyticsModel');
const { Logger } = require('../../utilities/logger/logger');

// Get dashboard overview
exports.getDashboard = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const tenantId = req.tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);

  res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: dashboardData,
    period: { startDate: start, endDate: end }
  });
});

// Get monthly analytics
exports.getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const tenantId = req.tenant?.id || 'default';

  const currentDate = new Date();
  const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const currentYear = year ? parseInt(year) : currentDate.getFullYear();

  const monthlyData = await AnalyticsService.calculateMonthlyStats(tenantId, currentMonth, currentYear);
  const monthlyTrends = await AnalyticsService.getMonthlyTrends(tenantId, currentYear);

  res.status(200).json({
    success: true,
    message: 'Monthly analytics retrieved successfully',
    data: {
      summary: monthlyData,
      trends: monthlyTrends,
      month: currentMonth,
      year: currentYear
    }
  });
});

// Get yearly analytics
exports.getYearlyAnalytics = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const tenantId = req.tenant?.id || 'default';

  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const yearlyData = await AnalyticsService.calculateYearlyStats(tenantId, currentYear);

  res.status(200).json({
    success: true,
    message: 'Yearly analytics retrieved successfully',
    data: {
      monthlyBreakdown: yearlyData,
      year: currentYear
    }
  });
});

// Get comprehensive report
exports.getComprehensiveReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;
  const tenantId = req.tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);

  if (format === 'pdf') {
    const pdfBuffer = await AnalyticsService.generatePDFReport(dashboardData, 'Comprehensive Analytics Report');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');
    res.send(pdfBuffer);
  } else if (format === 'excel') {
    const excelBuffer = await AnalyticsService.generateExcelReport(dashboardData, 'Comprehensive Analytics Report');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.xlsx"');
    res.send(excelBuffer);
  } else if (format === 'csv') {
    const csv = await AnalyticsService.exportToCSV(dashboardData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
    res.send(csv);
  } else {
    res.status(200).json({
      success: true,
      message: 'Comprehensive report retrieved successfully',
      data: dashboardData,
      period: { startDate: start, endDate: end }
    });
  }
});

// Export to PDF
exports.exportPDF = asyncHandler(async (req, res) => {
  const { startDate, endDate, title } = req.body;
  const tenantId = req.tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);
  const pdfBuffer = await AnalyticsService.generatePDFReport(dashboardData, title || 'Analytics Report');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title || 'report'}.pdf"`);
  res.send(pdfBuffer);
});

// Export to Excel
exports.exportExcel = asyncHandler(async (req, res) => {
  const { startDate, endDate, title } = req.body;
  const tenantId = req.tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);
  const excelBuffer = await AnalyticsService.generateExcelReport(dashboardData, title || 'Analytics Report');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${title || 'report'}.xlsx"`);
  res.send(excelBuffer);
});

// Export to CSV
exports.exportCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, title } = req.body;
  const tenantId = req.tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);
  const csv = await AnalyticsService.exportToCSV(dashboardData);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${title || 'report'}.csv"`);
  res.send(csv);
});

// Save report
exports.saveReport = asyncHandler(async (req, res) => {
  const { title, type, startDate, endDate } = req.body;
  const tenantId = req.tenant?.id || 'default';
  const userId = req.user?.id || 'system';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);

  await AnalyticsModel.saveReport({
    tenantId,
    title,
    type,
    data: dashboardData,
    createdBy: userId
  });

  res.status(201).json({
    success: true,
    message: 'Report saved successfully'
  });
});

// Get saved reports
exports.getSavedReports = asyncHandler(async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  const tenantId = req.tenant?.id || 'default';

  const reports = await AnalyticsModel.getSavedReports(tenantId, parseInt(limit), parseInt(offset));

  res.status(200).json({
    success: true,
    message: 'Saved reports retrieved successfully',
    data: reports,
    pagination: { limit: parseInt(limit), offset: parseInt(offset) }
  });
});

module.exports = exports;
