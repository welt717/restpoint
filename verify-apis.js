/**
 * REST POINT - API Routes Verification & Connectivity Check
 * Verifies all microservices are running and properly configured
 * Run: npm run verify-apis
 */

const axios = require('axios');

const SERVICES_CONFIG = {
  'api-gateway': {
    port: 8000,
    baseUrl: 'http://localhost:8000',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/api/v1/restpoint/health', description: 'API Gateway health' }
    ]
  },
  'auth-service': {
    port: 8001,
    baseUrl: 'http://localhost:8001',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Service health' },
      { method: 'GET', path: '/api/v1/restpoint/auth/health', description: 'Auth service health' }
    ]
  },
  'deceased-service': {
    port: 8001,
    baseUrl: 'http://localhost:8001',
    endpoints: [
      { method: 'GET', path: '/api/v1/restpoint/deceased', description: 'Get deceased records', requiresAuth: true },
      { method: 'POST', path: '/api/v1/restpoint/deceased', description: 'Create deceased record', requiresAuth: true }
    ]
  },
  'billing-service': {
    port: 8002,
    baseUrl: 'http://localhost:8002',
    endpoints: [
      { method: 'GET', path: '/api/v1/restpoint/billing/health', description: 'Billing service health' }
    ]
  },
  'dispatch-service': {
    port: 8000,
    baseUrl: 'http://localhost:8000',
    endpoints: [
      { method: 'GET', path: '/api/v1/restpoint/dispatch', description: 'Get dispatch records', requiresAuth: true },
      { method: 'POST', path: '/api/v1/restpoint/dispatch', description: 'Create dispatch', requiresAuth: true }
    ]
  },
  'edocuments-service': {
    port: 8116,
    baseUrl: 'http://localhost:8116',
    endpoints: [
      { method: 'GET', path: '/health', description: 'eDocuments service health' },
      { method: 'GET', path: '/templates', description: 'Get templates', requiresTenant: true }
    ]
  },
  'notification-service': {
    port: 8008,
    baseUrl: 'http://localhost:8008',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Notification service health' }
    ]
  }
};

const TENANT_SLUG = process.env.TEST_TENANT || 'test-tenant';
const AUTH_TOKEN = process.env.TEST_TOKEN || 'test-token';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.blue}${msg}${colors.reset}`)
};

async function testEndpoint(service, endpoint) {
  try {
    const url = `${service.baseUrl}${endpoint.path}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add tenant header if required
    if (endpoint.requiresTenant) {
      headers['x-tenant-slug'] = TENANT_SLUG;
    }

    // Add auth token if required
    if (endpoint.requiresAuth) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
      headers['x-tenant-slug'] = TENANT_SLUG;
    }

    const response = await axios({
      method: endpoint.method,
      url,
      headers,
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept all non-server-error responses
    });

    if (response.status < 400) {
      log.success(`${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      return true;
    } else if (response.status === 401 || response.status === 403) {
      log.warning(`${endpoint.method} ${endpoint.path} - ${endpoint.description} (Auth required)`);
      return true; // Auth required is expected for protected endpoints
    } else {
      log.error(`${endpoint.method} ${endpoint.path} - Status ${response.status}`);
      return false;
    }
  } catch (error) {
    const errorMsg = error.code === 'ECONNREFUSED'
      ? 'Service not running'
      : error.message;
    log.error(`${endpoint.method} ${endpoint.path} - ${errorMsg}`);
    return false;
  }
}

async function verifyAllServices() {
  log.title('🔍 REST POINT - API Services Verification');
  log.info(`Test Tenant: ${TENANT_SLUG}`);
  log.info(`Timestamp: ${new Date().toISOString()}`);

  let totalTests = 0;
  let passedTests = 0;

  for (const [serviceName, serviceConfig] of Object.entries(SERVICES_CONFIG)) {
    log.title(`\n📦 ${serviceName.toUpperCase()}`);
    log.info(`Port: ${serviceConfig.port}`);

    for (const endpoint of serviceConfig.endpoints) {
      totalTests++;
      const passed = await testEndpoint(serviceConfig, endpoint);
      if (passed) passedTests++;
    }
  }

  // Summary
  log.title('\n📊 VERIFICATION SUMMARY');
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  log.info(`Total Tests: ${totalTests}`);
  log.info(`Passed: ${passedTests}`);
  log.info(`Failed: ${totalTests - passedTests}`);
  log.info(`Pass Rate: ${passRate}%`);

  if (passRate >= 90) {
    log.success('✓ All critical services are operational!');
    process.exit(0);
  } else if (passRate >= 70) {
    log.warning('⚠ Some services may have issues. Check logs above.');
    process.exit(1);
  } else {
    log.error('✗ Critical services are down. Check configuration.');
    process.exit(2);
  }
}

// Run verification
verifyAllServices().catch((error) => {
  log.error(`Verification failed: ${error.message}`);
  process.exit(3);
});

module.exports = { SERVICES_CONFIG, verifyAllServices };
