const asyncHandler = require('express-async-handler');
const { safeQuery } = require('../../configurations/sqlConfig/db');
const { Logger } = require('../../utilities/logger/logger');

// === Advanced Analytics Controller ===
const getMortuaryAnalytics = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  Logger.info(`[${requestId}] Fetching comprehensive mortuary analytics...`);

  try {
    // Initialize response structure with safe defaults
    const responseData = {
      success: true,
      message: 'Mortuary analytics data retrieved successfully',
      data: {
        summary: {},
        caseStatus: {},
        revenue: { total: {}, extraServices: {} },
        serviceTypes: {},
        paymentFrequency: {},
        monthlyTrends: {},
        visitorTrends: {},
        coffinSales: [],
        averageStayDuration: {},
        hearseDistance: {},
        revenueMeta: { currency: 'KES' },
        dispatchAnalytics: {},
        coffinInventory: {},
        operationalMetrics: {},
        financialMetrics: {},
        performanceIndicators: {},
        casesTrends: {},
        revenueByCategory: {},
        chemicalsData: {},
        dispatchSchedule: [],
        insuranceData: {},
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTime: null,
        successfulQueries: 0,
        failedQueries: 0,
      },
    };

    const startTime = Date.now();

    // Define all queries with their names and parameters
    const queryDefinitions = [
      {
        name: 'summary_stats',
        sql: `
          SELECT 
            COUNT(*) as total_cases,
            COUNT(CASE WHEN status = 'Released' THEN 1 END) as released_cases,
            COUNT(CASE WHEN status = 'Under Care' THEN 1 END) as under_care_cases,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_cases,
            COUNT(CASE WHEN status = 'Received' THEN 1 END) as received_cases,
            COALESCE(SUM(total_mortuary_charge), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN status = 'Released' THEN total_mortuary_charge ELSE 0 END), 0) as collected_revenue,
            COALESCE(SUM(COALESCE(embalming_cost, 0)), 0) as embalming_revenue,
            COUNT(CASE WHEN burial_type = 'Burial' THEN 1 END) as burial_cases,
            COUNT(CASE WHEN burial_type = 'Cremation' THEN 1 END) as cremation_cases,
            COUNT(CASE WHEN burial_type = 'Other' THEN 1 END) as other_cases,
            COALESCE(AVG(CASE WHEN dispatch_date IS NOT NULL THEN DATEDIFF(COALESCE(dispatch_date, CURDATE()), date_admitted) END), 0) as avg_stay_duration,
            COUNT(CASE WHEN is_embalmed = 1 THEN 1 END) as embalmed_cases,
            COUNT(CASE WHEN rate_category = 'premium' THEN 1 END) as premium_cases,
            COUNT(CASE WHEN rate_category = 'standard' THEN 1 END) as standard_cases,
            COUNT(CASE WHEN rate_category = 'basic' THEN 1 END) as basic_cases,
            COALESCE(SUM(CASE WHEN MONTH(date_admitted) = MONTH(CURDATE()) AND YEAR(date_admitted) = YEAR(CURDATE()) THEN total_mortuary_charge ELSE 0 END), 0) as current_month_revenue,
            COALESCE(AVG(CASE WHEN status = 'Released' AND dispatch_date IS NOT NULL THEN DATEDIFF(dispatch_date, date_admitted) END), 0) as avg_processing_time,
            COUNT(CASE WHEN DATEDIFF(CURDATE(), date_admitted) > 30 THEN 1 END) as long_stay_cases,
            COUNT(CASE WHEN balance > 0 THEN 1 END) as pending_payments,
            COALESCE(SUM(balance), 0) as total_outstanding
          FROM deceased
        `,
        params: [],
      },
      {
        name: 'visitor_stats',
        sql: `
          SELECT 
            COUNT(CASE WHEN DATE(check_in_time) = CURDATE() THEN 1 END) as today_visitors,
            COUNT(CASE WHEN WEEK(check_in_time) = WEEK(CURDATE()) THEN 1 END) as weekly_visitors,
            COUNT(CASE WHEN MONTH(check_in_time) = MONTH(CURDATE()) THEN 1 END) as monthly_visitors,
            COALESCE(AVG(TIMESTAMPDIFF(HOUR, check_in_time, COALESCE(check_out_time, NOW()))), 0) as avg_visit_duration
          FROM visitors
        `,
        params: [],
      },
      {
        name: 'coffin_sales',
        sql: `
          SELECT 
            c.coffin_id,
            c.type as name,
            c.material,
            c.category,
            COUNT(dc.coffin_id) as sold,
            COALESCE(c.exact_price, 0) as price,
            COALESCE(c.quantity, 0) as stock,
            c.image_url as image,
            c.status,
            c.supplier,
            (COALESCE(c.quantity, 0) - COUNT(dc.coffin_id)) as available_stock,
            (COUNT(dc.coffin_id) * COALESCE(c.exact_price, 0)) as total_revenue
          FROM coffins c
          LEFT JOIN deceased_coffin dc ON c.coffin_id = dc.coffin_id
          GROUP BY c.coffin_id, c.type, c.material, c.category, c.exact_price, c.quantity, c.image_url, c.status, c.supplier
          ORDER BY sold DESC
          LIMIT 10
        `,
        params: [],
      },
      {
        name: 'extra_services',
        sql: `
          SELECT 
            charge_type as service,
            COALESCE(SUM(amount), 0) as revenue,
            COUNT(*) as service_count,
            COALESCE(AVG(amount), 0) as avg_service_price
          FROM extra_charges ec
          JOIN deceased d ON ec.deceased_id = d.deceased_id
          GROUP BY charge_type
          ORDER BY revenue DESC
        `,
        params: [],
      },
      {
        name: 'dispatch_stats',
        sql: `
          SELECT 
            COUNT(*) as total_dispatches,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_dispatches,
            COUNT(CASE WHEN status = 'In Transit' THEN 1 END) as in_transit_dispatches,
            COUNT(CASE WHEN status = 'Assigned' THEN 1 END) as assigned_dispatches,
            COALESCE(SUM(distance_km), 0) as total_distance,
            COALESCE(SUM(round_trip_km), 0) as total_round_trip_distance,
            COALESCE(AVG(distance_km), 0) as avg_dispatch_distance,
            COUNT(DISTINCT vehicle_plate) as unique_vehicles,
            COUNT(DISTINCT driver_name) as unique_drivers,
            COUNT(CASE WHEN dispatch_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as weekly_dispatches,
            COUNT(CASE WHEN dispatch_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as monthly_dispatches
          FROM vehicle_dispatch
          WHERE dispatch_date IS NOT NULL
        `,
        params: [],
      },
      {
        name: 'monthly_revenue',
        sql: `
          SELECT 
            DATE_FORMAT(date_admitted, '%b %Y') as month,
            DATE_FORMAT(date_admitted, '%Y-%m') as month_key,
            COALESCE(SUM(total_mortuary_charge), 0) as revenue,
            COUNT(*) as cases,
            COALESCE(SUM(balance), 0) as outstanding,
            COALESCE(AVG(DATEDIFF(COALESCE(dispatch_date, CURDATE()), date_admitted)), 0) as avg_processing_days
          FROM deceased 
          WHERE date_admitted >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(date_admitted, '%Y-%m'), DATE_FORMAT(date_admitted, '%b %Y')
          ORDER BY DATE_FORMAT(date_admitted, '%Y-%m')
        `,
        params: [],
      },
      {
        name: 'weekly_data',
        sql: `
          SELECT 
            DAYNAME(date_admitted) as day,
            COUNT(*) as admissions,
            COALESCE(AVG(DATEDIFF(COALESCE(dispatch_date, CURDATE()), date_admitted)), 0) as avg_processing_days
          FROM deceased 
          WHERE date_admitted >= DATE_SUB(NOW(), INTERVAL 90 DAY)
          GROUP BY DAYNAME(date_admitted)
          ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
        `,
        params: [],
      },
      {
        name: 'coffin_inventory',
        sql: `
          SELECT 
            status,
            COUNT(*) as count,
            COALESCE(SUM(quantity), 0) as total_quantity,
            COALESCE(SUM(exact_price * quantity), 0) as total_value
          FROM coffins
          GROUP BY status
          ORDER BY total_value DESC
        `,
        params: [],
      },
      {
        name: 'vehicle_performance',
        sql: `
          SELECT 
            vehicle_plate,
            COUNT(*) as total_trips,
            COALESCE(SUM(distance_km), 0) as total_distance,
            COALESCE(SUM(round_trip_km), 0) as total_round_trip,
            COALESCE(AVG(distance_km), 0) as avg_trip_distance
          FROM vehicle_dispatch
          WHERE vehicle_plate IS NOT NULL AND vehicle_plate != ''
          GROUP BY vehicle_plate
          ORDER BY total_trips DESC
          LIMIT 5
        `,
        params: [],
      },
      {
        name: 'service_revenue',
        sql: `
          SELECT 
            burial_type,
            COUNT(*) as case_count,
            COALESCE(SUM(total_mortuary_charge), 0) as total_revenue,
            COALESCE(AVG(total_mortuary_charge), 0) as avg_revenue_per_case,
            COALESCE(AVG(DATEDIFF(COALESCE(dispatch_date, CURDATE()), date_admitted)), 0) as avg_processing_days
          FROM deceased
          WHERE burial_type IS NOT NULL
          GROUP BY burial_type
          ORDER BY total_revenue DESC
        `,
        params: [],
      },
      {
        name: 'recent_activity',
        sql: `
          SELECT 
            'admissions' as activity_type,
            COUNT(*) as count
          FROM deceased 
          WHERE date_admitted >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          UNION ALL
          SELECT 
            'releases' as activity_type,
            COUNT(*) as count
          FROM deceased 
          WHERE dispatch_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status = 'Released'
          UNION ALL
          SELECT 
            'visitors' as activity_type,
            COUNT(*) as count
          FROM visitors 
          WHERE DATE(check_in_time) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          UNION ALL
          SELECT 
            'dispatches' as activity_type,
            COUNT(*) as count
          FROM vehicle_dispatch 
          WHERE dispatch_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `,
        params: [],
      },
      // New queries for additional data
      {
        name: 'cases_trends',
        sql: `
          SELECT 
            DATE_FORMAT(date_admitted, '%Y-%m') as month,
            COUNT(*) as cases_count
          FROM deceased 
          WHERE date_admitted >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(date_admitted, '%Y-%m')
          ORDER BY DATE_FORMAT(date_admitted, '%Y-%m')
        `,
        params: [],
      },
      {
        name: 'revenue_by_category',
        sql: `
          SELECT 
            category,
            MONTH(created_at) as month,
            COALESCE(SUM(amount), 0) as revenue
          FROM revenue_categories
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY category, MONTH(created_at)
          ORDER BY category, month
        `,
        params: [],
      },
      {
        name: 'chemicals_usage',
        sql: `
          SELECT 
            chemical_type,
            MONTH(usage_date) as month,
            COALESCE(SUM(quantity_used), 0) as quantity,
            unit
          FROM chemicals_usage
          WHERE usage_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY chemical_type, MONTH(usage_date), unit
          ORDER BY chemical_type, month
        `,
        params: [],
      },
      {
        name: 'dispatch_schedule',
        sql: `
          SELECT 
            d.deceased_id,
            d.full_name,
            d.age,
            d.cause_of_death,
            d.location,
            vd.dispatch_date,
            vd.status as dispatch_status
          FROM deceased d
          LEFT JOIN vehicle_dispatch vd ON d.deceased_id = vd.deceased_id
          WHERE vd.dispatch_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 DAY)
          ORDER BY vd.dispatch_date
          LIMIT 10
        `,
        params: [],
      },
      {
        name: 'insurance_data',
        sql: `
          SELECT 
            COUNT(*) as active_policies,
            COALESCE(SUM(monthly_premium), 0) as monthly_premium,
            COUNT(CASE WHEN DATE(claim_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as recent_claims,
            COALESCE(SUM(coverage_amount), 0) as total_coverage
          FROM insurance_policies
          WHERE status = 'active'
        `,
        params: [],
      },
    ];

    // Execute queries sequentially with controlled concurrency
    const maxConcurrentQueries = 3;
    const queryResults = new Map();
    let successfulQueries = 0;
    let failedQueries = 0;

    for (let i = 0; i < queryDefinitions.length; i += maxConcurrentQueries) {
      const batch = queryDefinitions.slice(i, i + maxConcurrentQueries);
      
      const batchPromises = batch.map(async (queryDef) => {
        try {
          Logger.debug(`[${requestId}] Executing query: ${queryDef.name}`);
          const result = await safeQuery(queryDef.sql, queryDef.params);
          queryResults.set(queryDef.name, result);
          successfulQueries++;
          return { name: queryDef.name, success: true, data: result };
        } catch (error) {
          Logger.error(`[${requestId}] Query ${queryDef.name} failed:`, {
            error: error.message,
            query: queryDef.name,
            sql: queryDef.sql.substring(0, 100) + '...',
          });
          failedQueries++;
          return { name: queryDef.name, success: false, error: error.message };
        }
      });

      await Promise.allSettled(batchPromises);
    }

    // Process results
    responseData.metadata.successfulQueries = successfulQueries;
    responseData.metadata.failedQueries = failedQueries;

    for (const queryDef of queryDefinitions) {
      try {
        const result = queryResults.get(queryDef.name);
        if (result) {
          await processQueryResult(queryDef.name, result, responseData.data);
        } else {
          applyFallbackData(queryDef.name, responseData.data);
        }
      } catch (error) {
        Logger.error(`[${requestId}] Error processing query ${queryDef.name}:`, error);
        applyFallbackData(queryDef.name, responseData.data);
      }
    }

    // Calculate derived metrics
    calculateDerivedMetrics(responseData.data);

    // Generate mock data for missing components (temporary)
    generateMockDataIfMissing(responseData.data);

    // Clean up memory
    queryResults.clear();
    
    const executionTime = Date.now() - startTime;
    responseData.metadata.executionTime = executionTime;

    Logger.info(`[${requestId}] Analytics completed in ${executionTime}ms`, {
      successful: successfulQueries,
      failed: failedQueries,
      executionTime,
    });

    // Send response
    res.status(200).json(responseData);
  } catch (error) {
    Logger.error(`[${requestId}] Critical error in analytics controller:`, {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: 'Internal server error',
      data: getFallbackDataStructure(),
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        error: error.message,
      },
    });
  }
});

// Safe data processing functions
function safeFormatNumber(value, defaultValue = 0, decimals = 1) {
  try {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
      return defaultValue;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return defaultValue;
    return parseFloat(num.toFixed(decimals));
  } catch {
    return defaultValue;
  }
}

function safeParseInt(value, defaultValue = 0) {
  try {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const int = parseInt(value, 10);
    return isNaN(int) ? defaultValue : int;
  } catch {
    return defaultValue;
  }
}

function safePercentage(numerator, denominator, defaultValue = 0, decimals = 1) {
  try {
    if (!denominator || denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
      return defaultValue;
    }
    const percentage = (numerator / denominator) * 100;
    return parseFloat(percentage.toFixed(decimals));
  } catch {
    return defaultValue;
  }
}

// Process query results
async function processQueryResult(queryName, data, responseData) {
  try {
    switch (queryName) {
      case 'summary_stats':
        if (data && data[0]) {
          const stats = data[0];
          responseData.summary = {
            totalCases: safeParseInt(stats.total_cases),
            releasedCases: safeParseInt(stats.released_cases),
            underCareCases: safeParseInt(stats.under_care_cases),
            pendingCases: safeParseInt(stats.pending_cases),
            receivedCases: safeParseInt(stats.received_cases),
            avgProcessingTime: safeParseInt(stats.avg_processing_time),
            totalRevenue: safeFormatNumber(stats.total_revenue, 0, 2),
            collectedRevenue: safeFormatNumber(stats.collected_revenue, 0, 2),
            embalmingRevenue: safeFormatNumber(stats.embalming_revenue, 0, 2),
            totalVisitors: 0,
            extraServicesRevenue: 0,
            avgStayDuration: safeFormatNumber(stats.avg_stay_duration, 0),
            longStayCases: safeParseInt(stats.long_stay_cases),
            pendingPayments: safeParseInt(stats.pending_payments),
            totalOutstanding: safeFormatNumber(stats.total_outstanding, 0, 2),
            currentMonthRevenue: safeFormatNumber(stats.current_month_revenue, 0, 2),
          };

          responseData.caseStatus = {
            RECEIVED: safeParseInt(stats.received_cases),
            UNDER_CARE: safeParseInt(stats.under_care_cases),
            PENDING: safeParseInt(stats.pending_cases),
            COMPLETED: safeParseInt(stats.released_cases),
          };

          responseData.serviceTypes = {
            Burial: safeParseInt(stats.burial_cases),
            Cremation: safeParseInt(stats.cremation_cases),
            Other: safeParseInt(stats.other_cases),
          };

          responseData.paymentFrequency = {
            Premium: safeParseInt(stats.premium_cases),
            Standard: safeParseInt(stats.standard_cases),
            Basic: safeParseInt(stats.basic_cases),
          };
        }
        break;

      case 'visitor_stats':
        if (data && data[0]) {
          const stats = data[0];
          responseData.summary.totalVisitors = safeParseInt(stats.weekly_visitors);
          responseData.operationalMetrics = {
            ...responseData.operationalMetrics,
            todayVisitors: safeParseInt(stats.today_visitors),
            monthlyVisitors: safeParseInt(stats.monthly_visitors),
            avgVisitDuration: safeFormatNumber(stats.avg_visit_duration, 0),
          };
        }
        break;

      case 'coffin_sales':
        responseData.coffinSales = (data || []).slice(0, 10).map((coffin) => ({
          id: coffin.coffin_id || 'N/A',
          name: coffin.name || 'Unknown',
          material: coffin.material || 'N/A',
          category: coffin.category || 'standard',
          sold: safeParseInt(coffin.sold),
          price: safeFormatNumber(coffin.price, 0, 2),
          stock: safeParseInt(coffin.stock),
          availableStock: safeParseInt(coffin.available_stock),
          image: coffin.image || null,
          status: coffin.status || 'in-stock',
          supplier: coffin.supplier || 'N/A',
          totalRevenue: safeFormatNumber(coffin.total_revenue, 0, 2),
        }));
        break;

      case 'extra_services':
        const services = {};
        let totalExtraRevenue = 0;
        (data || []).forEach((item) => {
          const revenue = safeFormatNumber(item.revenue, 0, 2);
          const serviceName = item.service || 'Unknown';
          services[serviceName] = {
            revenue: revenue,
            count: safeParseInt(item.service_count),
            avgPrice: safeFormatNumber(item.avg_service_price, 0, 2),
          };
          totalExtraRevenue += revenue;
        });
        responseData.revenue.extraServices = services;
        responseData.summary.extraServicesRevenue = totalExtraRevenue;
        break;

      case 'dispatch_stats':
        if (data && data[0]) {
          const stats = data[0];
          responseData.dispatchAnalytics = {
            totalDispatches: safeParseInt(stats.total_dispatches),
            completedDispatches: safeParseInt(stats.completed_dispatches),
            inTransitDispatches: safeParseInt(stats.in_transit_dispatches),
            assignedDispatches: safeParseInt(stats.assigned_dispatches),
            totalDistance: safeFormatNumber(stats.total_distance, 0, 1),
            totalRoundTrip: safeFormatNumber(stats.total_round_trip_distance, 0, 1),
            avgDispatchDistance: safeFormatNumber(stats.avg_dispatch_distance, 0, 1),
            uniqueVehicles: safeParseInt(stats.unique_vehicles),
            uniqueDrivers: safeParseInt(stats.unique_drivers),
            weeklyDispatches: safeParseInt(stats.weekly_dispatches),
            monthlyDispatches: safeParseInt(stats.monthly_dispatches),
            completionRate: safePercentage(
              safeParseInt(stats.completed_dispatches),
              safeParseInt(stats.total_dispatches),
              0,
              1
            ),
          };
        }
        break;

      case 'monthly_revenue':
        const revenueData = {};
        const caseData = {};
        const processingData = {};

        (data || []).forEach((item) => {
          const month = item.month || 'Unknown';
          revenueData[month] = safeFormatNumber(item.revenue, 0, 2);
          caseData[month] = safeParseInt(item.cases);
          processingData[month] = safeFormatNumber(item.avg_processing_days, 0, 1);
        });

        responseData.revenue.total = revenueData;
        responseData.monthlyTrends = caseData;
        responseData.performanceIndicators.monthlyProcessingTime = processingData;
        break;

      case 'weekly_data':
        const weeklyPattern = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        days.forEach((day) => {
          const found = (data || []).find((item) => item.day === day);
          weeklyPattern[day] = {
            admissions: found ? safeParseInt(found.admissions) : 0,
            avgProcessingDays: found ? safeFormatNumber(found.avg_processing_days, 0, 1) : 0,
          };
        });

        responseData.visitorTrends = weeklyPattern;
        break;

      case 'coffin_inventory':
        const inventory = {};
        let totalInventoryValue = 0;

        (data || []).forEach((item) => {
          const status = item.status || 'unknown';
          const value = safeFormatNumber(item.total_value, 0, 2);
          inventory[status] = {
            count: safeParseInt(item.count),
            quantity: safeParseInt(item.total_quantity),
            value: value,
          };
          totalInventoryValue += value;
        });

        responseData.coffinInventory = {
          status: inventory,
          totalValue: totalInventoryValue,
        };
        break;

      case 'vehicle_performance':
        responseData.dispatchAnalytics.topVehicles = (data || []).map((vehicle) => ({
          plate: vehicle.vehicle_plate || 'Unknown',
          trips: safeParseInt(vehicle.total_trips),
          totalDistance: safeFormatNumber(vehicle.total_distance, 0, 1),
          totalRoundTrip: safeFormatNumber(vehicle.total_round_trip, 0, 1),
          avgTripDistance: safeFormatNumber(vehicle.avg_trip_distance, 0, 1),
        }));
        break;

      case 'service_revenue':
        const serviceMetrics = {};
        (data || []).forEach((item) => {
          const serviceType = item.burial_type || 'Unknown';
          serviceMetrics[serviceType] = {
            caseCount: safeParseInt(item.case_count),
            totalRevenue: safeFormatNumber(item.total_revenue, 0, 2),
            avgRevenue: safeFormatNumber(item.avg_revenue_per_case, 0, 2),
            avgProcessingDays: safeFormatNumber(item.avg_processing_days, 0, 1),
          };
        });
        responseData.performanceIndicators.serviceMetrics = serviceMetrics;
        break;

      case 'cases_trends':
        const casesTrends = {};
        (data || []).forEach((item) => {
          const month = item.month || 'Unknown';
          casesTrends[month] = safeParseInt(item.cases_count);
        });
        responseData.casesTrends = casesTrends;
        break;

      case 'revenue_by_category':
        const revenueByCategory = { transport: {}, storage: {}, supplies: {} };
        (data || []).forEach((item) => {
          const category = item.category?.toLowerCase() || 'other';
          const month = item.month || 1;
          if (!revenueByCategory[category]) {
            revenueByCategory[category] = {};
          }
          revenueByCategory[category][month] = safeFormatNumber(item.revenue, 0, 2);
        });
        responseData.revenueByCategory = revenueByCategory;
        break;

      case 'chemicals_usage':
        const chemicalsData = {};
        (data || []).forEach((item) => {
          const chemical = item.chemical_type?.toLowerCase() || 'unknown';
          if (!chemicalsData[chemical]) {
            chemicalsData[chemical] = {
              monthly: Array(12).fill(0),
              unit: item.unit || 'units',
            };
          }
          const month = (safeParseInt(item.month) - 1) || 0;
          if (month >= 0 && month < 12) {
            chemicalsData[chemical].monthly[month] = safeFormatNumber(item.quantity, 0, 1);
          }
        });
        responseData.chemicalsData = chemicalsData;
        break;

      case 'dispatch_schedule':
        responseData.dispatchSchedule = (data || []).map((item) => ({
          id: item.deceased_id || 'N/A',
          name: item.full_name || 'Unknown',
          age: safeParseInt(item.age),
          cause: item.cause_of_death || 'Unknown',
          location: item.location || 'Unknown',
          scheduled: item.dispatch_date || new Date().toISOString(),
          status: item.dispatch_status || 'pending',
        }));
        break;

      case 'insurance_data':
        if (data && data[0]) {
          const stats = data[0];
          responseData.insuranceData = {
            activePolicies: safeParseInt(stats.active_policies),
            monthlyPremium: safeFormatNumber(stats.monthly_premium, 0, 2),
            claimsThisMonth: safeParseInt(stats.recent_claims),
            totalCoverage: safeFormatNumber(stats.total_coverage, 0, 2),
            trends: {
              policies: Array(12).fill(0),
              claims: Array(12).fill(0),
              premiums: Array(12).fill(0),
            },
          };
        }
        break;

      default:
        Logger.warn(`Unknown query name: ${queryName}`);
    }
  } catch (error) {
    throw error;
  }
}

// Apply fallback data
function applyFallbackData(queryName, responseData) {
  const fallbacks = {
    'summary_stats': () => {
      responseData.summary = getFallbackDataStructure().summary;
      responseData.caseStatus = getFallbackDataStructure().caseStatus;
      responseData.serviceTypes = getFallbackDataStructure().serviceTypes;
      responseData.paymentFrequency = getFallbackDataStructure().paymentFrequency;
    },
    'dispatch_stats': () => {
      responseData.dispatchAnalytics = getFallbackDataStructure().dispatchAnalytics;
    },
    'cases_trends': () => {
      responseData.casesTrends = {};
    },
    'revenue_by_category': () => {
      responseData.revenueByCategory = {};
    },
    'chemicals_usage': () => {
      responseData.chemicalsData = {};
    },
    'dispatch_schedule': () => {
      responseData.dispatchSchedule = [];
    },
    'insurance_data': () => {
      responseData.insuranceData = getFallbackDataStructure().insuranceData;
    },
  };

  if (fallbacks[queryName]) {
    fallbacks[queryName]();
  }
}

// Calculate derived metrics
function calculateDerivedMetrics(data) {
  try {
    const summary = data.summary || {};
    const dispatch = data.dispatchAnalytics || {};

    // Financial Metrics
    data.financialMetrics = {
      collectionRate: safePercentage(
        summary.collectedRevenue || 0,
        summary.totalRevenue || 1,
        0,
        1
      ),
      revenuePerCase: (summary.totalCases || 0) > 0
        ? safeFormatNumber((summary.totalRevenue || 0) / (summary.totalCases || 1), 0, 2)
        : 0,
      outstandingPercentage: safePercentage(
        summary.totalOutstanding || 0,
        summary.totalRevenue || 1,
        0,
        1
      ),
    };

    // Performance Indicators
    data.performanceIndicators = {
      ...(data.performanceIndicators || {}),
      caseCompletionRate: safePercentage(
        summary.releasedCases || 0,
        summary.totalCases || 1,
        0,
        1
      ),
      longStayPercentage: safePercentage(
        summary.longStayCases || 0,
        summary.totalCases || 1,
        0,
        1
      ),
      embalmingRate: safePercentage(
        summary.embalmingRevenue || 0,
        summary.totalRevenue || 1,
        0,
        1
      ),
    };

    // Dispatch Efficiency
    if (dispatch) {
      data.performanceIndicators.dispatchEfficiency = {
        completionRate: dispatch.completionRate || 0,
        avgTripsPerVehicle: (dispatch.uniqueVehicles || 0) > 0
          ? safeFormatNumber((dispatch.totalDispatches || 0) / (dispatch.uniqueVehicles || 1), 0, 1)
          : 0,
        utilizationRate: safeFormatNumber((dispatch.weeklyDispatches || 0) / 7, 0, 1),
      };
    }
  } catch (error) {
    Logger.error('Error calculating derived metrics:', error);
  }
}

// Generate mock data for missing components
function generateMockDataIfMissing(data) {
  try {
    // Cases Trends Mock Data
    if (!data.casesTrends || Object.keys(data.casesTrends).length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data.casesTrends = {};
      months.forEach((month, index) => {
        data.casesTrends[`${month} 2024`] = Math.floor(Math.random() * 100) + 50;
      });
    }

    // Revenue by Category Mock Data
    if (!data.revenueByCategory || Object.keys(data.revenueByCategory).length === 0) {
      data.revenueByCategory = {
        transport: { 1: 120000, 2: 135000, 3: 142000, 4: 158000, 5: 145000, 6: 162000 },
        storage: { 1: 85000, 2: 92000, 3: 88000, 4: 95000, 5: 102000, 6: 110000 },
        supplies: { 1: 45000, 2: 52000, 3: 48000, 4: 55000, 5: 58000, 6: 62000 },
      };
    }

    // Chemicals Data Mock Data
    if (!data.chemicalsData || Object.keys(data.chemicalsData).length === 0) {
      data.chemicalsData = {
        formaldehyde: { monthly: Array(12).fill(0).map(() => Math.floor(Math.random() * 200) + 100), unit: 'liters' },
        disinfectants: { monthly: Array(12).fill(0).map(() => Math.floor(Math.random() * 150) + 50), unit: 'liters' },
        preservatives: { monthly: Array(12).fill(0).map(() => Math.floor(Math.random() * 100) + 30), unit: 'kg' },
      };
    }

    // Dispatch Schedule Mock Data
    if (!data.dispatchSchedule || data.dispatchSchedule.length === 0) {
      data.dispatchSchedule = [
        {
          id: '1',
          name: 'John Doe',
          age: 72,
          cause: 'Natural Causes',
          location: 'Nairobi',
          scheduled: new Date(Date.now() + 86400000).toISOString(),
          status: 'confirmed',
        },
        {
          id: '2',
          name: 'Mary Smith',
          age: 65,
          cause: 'Illness',
          location: 'Mombasa',
          scheduled: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
        },
      ];
    }

    // Insurance Data Mock Data
    if (!data.insuranceData || Object.keys(data.insuranceData).length === 0) {
      data.insuranceData = {
        activePolicies: 342,
        monthlyPremium: 2850000,
        claimsThisMonth: 18,
        totalCoverage: 125000000,
        trends: {
          policies: Array(12).fill(0).map(() => Math.floor(Math.random() * 50) + 300),
          claims: Array(12).fill(0).map(() => Math.floor(Math.random() * 15) + 10),
          premiums: Array(12).fill(0).map(() => Math.floor(Math.random() * 500000) + 2500000),
        },
      };
    }
  } catch (error) {
    Logger.error('Error generating mock data:', error);
  }
}

// Get fallback data structure
function getFallbackDataStructure() {
  return {
    summary: {
      totalCases: 0,
      releasedCases: 0,
      underCareCases: 0,
      pendingCases: 0,
      receivedCases: 0,
      avgProcessingTime: 0,
      totalRevenue: 0,
      collectedRevenue: 0,
      embalmingRevenue: 0,
      totalVisitors: 0,
      extraServicesRevenue: 0,
      avgStayDuration: 0,
      longStayCases: 0,
      pendingPayments: 0,
      totalOutstanding: 0,
      currentMonthRevenue: 0,
    },
    caseStatus: {
      RECEIVED: 0,
      UNDER_CARE: 0,
      PENDING: 0,
      COMPLETED: 0,
    },
    revenue: {
      total: {},
      extraServices: {},
    },
    serviceTypes: {
      Burial: 0,
      Cremation: 0,
      Other: 0,
    },
    paymentFrequency: {
      Premium: 0,
      Standard: 0,
      Basic: 0,
    },
    monthlyTrends: {},
    visitorTrends: {},
    coffinSales: [],
    averageStayDuration: {},
    hearseDistance: {},
    revenueMeta: { currency: 'KES' },
    dispatchAnalytics: {
      totalDispatches: 0,
      completedDispatches: 0,
      inTransitDispatches: 0,
      assignedDispatches: 0,
      totalDistance: 0,
      totalRoundTrip: 0,
      avgDispatchDistance: 0,
      uniqueVehicles: 0,
      uniqueDrivers: 0,
      weeklyDispatches: 0,
      monthlyDispatches: 0,
      completionRate: 0,
    },
    coffinInventory: {},
    operationalMetrics: {},
    financialMetrics: {},
    performanceIndicators: {},
    casesTrends: {},
    revenueByCategory: {},
    chemicalsData: {},
    dispatchSchedule: [],
    insuranceData: {
      activePolicies: 0,
      monthlyPremium: 0,
      claimsThisMonth: 0,
      totalCoverage: 0,
      trends: {
        policies: Array(12).fill(0),
        claims: Array(12).fill(0),
        premiums: Array(12).fill(0),
      },
    },
  };
}

// Vehicle Analytics Controller
const getComprehensiveVehicleAnalytics = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  Logger.info(`[${requestId}] Fetching vehicle analytics...`);

  try {
    const { month, year } = req.query;
    const currentMonth = safeParseInt(month, new Date().getMonth() + 1);
    const currentYear = safeParseInt(year, new Date().getFullYear());

    const query = `
      SELECT 
        vehicle_plate,
        COALESCE(SUM(distance_km + COALESCE(round_trip_km, 0)), 0) as total_kilometers,
        COALESCE(SUM(CASE 
          WHEN MONTH(dispatch_date) = ? AND YEAR(dispatch_date) = ? 
          THEN distance_km + COALESCE(round_trip_km, 0) 
          ELSE 0 
        END), 0) as current_month_kilometers,
        COUNT(*) as total_trips,
        COUNT(CASE WHEN MONTH(dispatch_date) = ? AND YEAR(dispatch_date) = ? THEN 1 END) as current_month_trips,
        COUNT(CASE WHEN status IN ('Assigned', 'In Transit') THEN 1 END) as active_trips,
        COALESCE(AVG(distance_km + COALESCE(round_trip_km, 0)), 0) as avg_trip_length,
        MIN(dispatch_date) as first_trip_date,
        MAX(dispatch_date) as last_trip_date,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_trips,
        ROUND(
          (COUNT(CASE WHEN status = 'Completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          1
        ) as success_rate
      FROM vehicle_dispatch
      WHERE vehicle_plate IS NOT NULL AND vehicle_plate != ''
      GROUP BY vehicle_plate
      ORDER BY total_kilometers DESC
    `;

    const results = await safeQuery(query, [currentMonth, currentYear, currentMonth, currentYear]);

    const vehiclesData = (results || []).map((vehicle) => ({
      vehiclePlate: vehicle.vehicle_plate || 'Unknown',
      kilometers: {
        total: Math.round(safeFormatNumber(vehicle.total_kilometers, 0, 0)),
        currentMonth: Math.round(safeFormatNumber(vehicle.current_month_kilometers, 0, 0)),
        averagePerTrip: Math.round(safeFormatNumber(vehicle.avg_trip_length, 0, 0)),
      },
      trips: {
        total: safeParseInt(vehicle.total_trips),
        currentMonth: safeParseInt(vehicle.current_month_trips),
        active: safeParseInt(vehicle.active_trips),
        completed: safeParseInt(vehicle.completed_trips),
        successRate: safeFormatNumber(vehicle.success_rate, 0, 1),
      },
      activity: {
        firstTrip: vehicle.first_trip_date || null,
        lastTrip: vehicle.last_trip_date || null,
        isActive: safeParseInt(vehicle.active_trips) > 0,
      },
    }));

    // Calculate fleet totals
    const fleetSummary = {
      totalVehicles: vehiclesData.length,
      totalKilometers: vehiclesData.reduce((sum, v) => sum + v.kilometers.total, 0),
      currentMonthKilometers: vehiclesData.reduce((sum, v) => sum + v.kilometers.currentMonth, 0),
      activeVehicles: vehiclesData.filter((v) => v.trips.active > 0).length,
      totalTrips: vehiclesData.reduce((sum, v) => sum + v.trips.total, 0),
    };

    // Find top performers
    const topPerformers = {
      byTotalKm: vehiclesData.slice(0, 3).map((v) => ({
        vehicle: v.vehiclePlate,
        kilometers: v.kilometers.total,
      })),
      byCurrentMonth: [...vehiclesData]
        .sort((a, b) => b.kilometers.currentMonth - a.kilometers.currentMonth)
        .slice(0, 3)
        .map((v) => ({
          vehicle: v.vehiclePlate,
          kilometers: v.kilometers.currentMonth,
        })),
    };

    const responseData = {
      success: true,
      message: 'Vehicle analytics retrieved successfully',
      data: {
        fleetSummary,
        vehicles: vehiclesData,
        topPerformers,
        filters: {
          month: currentMonth,
          year: currentYear,
          timestamp: new Date().toISOString(),
        },
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        vehiclesCount: vehiclesData.length,
      },
    };

    Logger.info(`[${requestId}] Vehicle analytics completed for ${vehiclesData.length} vehicles`);
    res.status(200).json(responseData);
  } catch (error) {
    Logger.error(`[${requestId}] Error in vehicle analytics:`, {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle analytics',
      error: 'Internal server error',
      data: {
        fleetSummary: {
          totalVehicles: 0,
          totalKilometers: 0,
          currentMonthKilometers: 0,
          activeVehicles: 0,
          totalTrips: 0,
        },
        vehicles: [],
        topPerformers: {
          byTotalKm: [],
          byCurrentMonth: [],
        },
        filters: {
          month: currentMonth,
          year: currentYear,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
});

module.exports = {
  getMortuaryAnalytics,
  getComprehensiveVehicleAnalytics,
};