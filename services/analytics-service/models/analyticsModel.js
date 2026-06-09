const { safeQuery } = require('../../configurations/sqlConfig/db');

class AnalyticsModel {
  // Get monthly analytics summary
  static async getMonthlyAnalytics(tenantId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endDateStr = endDate.toISOString().split('T')[0];

    const query = `
      SELECT 
        DATE_FORMAT(date_admitted, '%Y-%m') as period,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Released' THEN 1 END) as released_cases,
        COUNT(CASE WHEN status = 'Under Care' THEN 1 END) as under_care_cases,
        COALESCE(SUM(total_mortuary_charge), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'Released' THEN total_mortuary_charge ELSE 0 END), 0) as collected_revenue,
        COALESCE(SUM(CASE WHEN is_embalmed = 1 THEN total_mortuary_charge ELSE 0 END), 0) as embalming_revenue,
        COALESCE(AVG(DATEDIFF(COALESCE(dispatch_date, CURDATE()), date_admitted)), 0) as avg_stay_days,
        COUNT(CASE WHEN burial_type = 'Burial' THEN 1 END) as burial_count,
        COUNT(CASE WHEN burial_type = 'Cremation' THEN 1 END) as cremation_count
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ?
      GROUP BY DATE_FORMAT(date_admitted, '%Y-%m')
    `;

    return await safeQuery(query, [startDate, endDateStr]);
  }

  // Get yearly analytics
  static async getYearlyAnalytics(tenantId, year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const query = `
      SELECT 
        DATE_FORMAT(date_admitted, '%Y-%m') as month,
        COUNT(*) as cases,
        COALESCE(SUM(total_mortuary_charge), 0) as revenue,
        COALESCE(AVG(DATEDIFF(COALESCE(dispatch_date, CURDATE()), date_admitted)), 0) as avg_stay_days
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ?
      GROUP BY DATE_FORMAT(date_admitted, '%Y-%m')
      ORDER BY month ASC
    `;

    return await safeQuery(query, [startDate, endDate]);
  }

  // Get revenue breakdown by category
  static async getRevenueByCategory(tenantId, startDate, endDate) {
    const query = `
      SELECT 
        'Mortuary Charges' as category,
        COALESCE(SUM(total_mortuary_charge), 0) as amount
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ?
      UNION ALL
      SELECT 
        'Embalming Services' as category,
        COALESCE(SUM(embalming_cost), 0) as amount
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ? AND is_embalmed = 1
      UNION ALL
      SELECT 
        'Extra Services' as category,
        COALESCE(SUM(extra_service_charge), 0) as amount
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ?
    `;

    return await safeQuery(query, [startDate, endDate, startDate, endDate, startDate, endDate]);
  }

  // Get case distribution
  static async getCaseDistribution(tenantId, startDate, endDate) {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM deceased WHERE date_admitted >= ? AND date_admitted <= ?) * 100), 2) as percentage
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ?
      GROUP BY status
    `;

    return await safeQuery(query, [startDate, endDate, startDate, endDate]);
  }

  // Get top services
  static async getTopServices(tenantId, startDate, endDate, limit = 10) {
    const query = `
      SELECT 
        service_type,
        COUNT(*) as count,
        COALESCE(SUM(service_charge), 0) as total_revenue
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ? AND service_type IS NOT NULL
      GROUP BY service_type
      ORDER BY total_revenue DESC
      LIMIT ?
    `;

    return await safeQuery(query, [startDate, endDate, limit]);
  }

  // Get daily trends
  static async getDailyTrends(tenantId, startDate, endDate) {
    const query = `
      SELECT 
        DATE(date_admitted) as date,
        COUNT(*) as cases,
        COALESCE(SUM(total_mortuary_charge), 0) as revenue
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ?
      GROUP BY DATE(date_admitted)
      ORDER BY date ASC
    `;

    return await safeQuery(query, [startDate, endDate]);
  }

  // Get KPI metrics
  static async getKPIMetrics(tenantId, startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Released' THEN 1 END) as released_cases,
        COALESCE(SUM(total_mortuary_charge), 0) as total_revenue,
        COALESCE(AVG(DATEDIFF(COALESCE(dispatch_date, CURDATE()), date_admitted)), 0) as avg_stay_days,
        COUNT(CASE WHEN is_embalmed = 1 THEN 1 END) as embalmed_cases,
        COALESCE(SUM(balance), 0) as outstanding_balance
      FROM deceased
      WHERE date_admitted >= ? AND date_admitted <= ?
    `;

    return await safeQuery(query, [startDate, endDate]);
  }

  // Save report
  static async saveReport(reportData) {
    const { tenantId, title, type, data, createdBy } = reportData;
    const query = `
      INSERT INTO analytics_reports (tenant_id, title, type, data, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    return await safeQuery(query, [tenantId, title, type, JSON.stringify(data), createdBy]);
  }

  // Get saved reports
  static async getSavedReports(tenantId, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM analytics_reports
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    return await safeQuery(query, [tenantId, limit, offset]);
  }
}

module.exports = AnalyticsModel;
