#!/usr/bin/env node

/**
 * Sales API Testing Script for Coolify Deployment
 *
 * Tests all sales API endpoints on the deployed app:
 * - Authentication
 * - POST /api/sales (Create)
 * - GET /api/sales (List)
 * - GET /api/sales/[id] (Read)
 * - PUT /api/sales/[id] (Update)
 * - DELETE /api/sales/[id] (Delete)
 *
 * Run with: node scripts/test-sales-api-coolify.js
 */

// Production configuration
// Note: Using the sslip.io URL that's currently active in production
// The domain www.maest.streamlinexperts.rw is planned but not yet active
const PRODUCTION_URL = 'http://jso8o40kcgws0kck0ookg0sc.31.220.17.127.sslip.io';
const ADMIN_EMAIL = 'admin@mafende.com';
const ADMIN_PASSWORD = 'Admin123!';

// Test data
const testSale = {
  description: 'API Test Sale - Cinema Tickets',
  salePrice: 50000,
  saleDate: new Date().toISOString(),
  buyerName: 'Test Customer',
  buyerPhone: '+250788123456',
  buyerEmail: 'test@example.com',
  category: 'CINEMA',
  saleType: 'SHOP_SALE',
  paymentMethod: 'CASH',
  paymentStatus: 'COMPLETED',
  location: 'Ngoma Business Center',
  currency: 'UGX',
  notes: 'Automated API test - can be deleted'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSuccess(message) {
  log('✅', message, colors.green);
}

function logError(message) {
  log('❌', message, colors.red);
}

function logInfo(message) {
  log('ℹ️ ', message, colors.cyan);
}

function logWarning(message) {
  log('⚠️ ', message, colors.yellow);
}

function logStep(message) {
  log('📝', message, colors.blue);
}

// Login and get session cookie
async function loginToProduction() {
  logStep('Authenticating with production server...');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        redirect: false,
        json: true
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
    }

    const cookies = response.headers.get('set-cookie');
    const data = await response.json();

    logSuccess('Authentication successful');
    logInfo(`User: ${ADMIN_EMAIL}`);

    return cookies;
  } catch (error) {
    logError(`Authentication failed: ${error.message}`);
    throw error;
  }
}

// Test POST /api/sales - Create new sale
async function testCreateSale(cookies) {
  logStep('Testing POST /api/sales - Create new sale');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify(testSale)
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Sale created successfully`);
      logInfo(`Sale ID: ${data.id}`);
      logInfo(`Description: ${data.description}`);
      logInfo(`Amount: ${data.currency} ${data.salePrice.toLocaleString()}`);
      return data;
    } else {
      logError(`Failed to create sale: ${response.status}`);
      console.log('Error details:', data);
      return null;
    }
  } catch (error) {
    logError(`Error creating sale: ${error.message}`);
    return null;
  }
}

// Test GET /api/sales - List all sales
async function testListSales(cookies) {
  logStep('Testing GET /api/sales - List all sales');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sales`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Retrieved sales list successfully`);
      logInfo(`Total sales: ${data.length}`);

      // Show summary by category
      const byCategory = data.reduce((acc, sale) => {
        acc[sale.category] = (acc[sale.category] || 0) + 1;
        return acc;
      }, {});

      console.log('\n  Sales by category:');
      Object.entries(byCategory).forEach(([category, count]) => {
        console.log(`    ${category}: ${count}`);
      });

      return data;
    } else {
      logError(`Failed to list sales: ${response.status}`);
      console.log('Error details:', data);
      return null;
    }
  } catch (error) {
    logError(`Error listing sales: ${error.message}`);
    return null;
  }
}

// Test GET /api/sales with filters
async function testListSalesWithFilters(cookies) {
  logStep('Testing GET /api/sales with filters (category=CINEMA)');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sales?category=CINEMA`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Retrieved filtered sales successfully`);
      logInfo(`Cinema sales: ${data.length}`);
      return data;
    } else {
      logError(`Failed to list filtered sales: ${response.status}`);
      return null;
    }
  } catch (error) {
    logError(`Error listing filtered sales: ${error.message}`);
    return null;
  }
}

// Test GET /api/sales/[id] - Get single sale
async function testGetSale(cookies, saleId) {
  logStep(`Testing GET /api/sales/${saleId} - Get single sale`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sales/${saleId}`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Retrieved sale successfully`);
      logInfo(`Sale ID: ${data.id}`);
      logInfo(`Description: ${data.description}`);
      return data;
    } else {
      logError(`Failed to get sale: ${response.status}`);
      console.log('Error details:', data);
      return null;
    }
  } catch (error) {
    logError(`Error getting sale: ${error.message}`);
    return null;
  }
}

// Test PUT /api/sales/[id] - Update sale
async function testUpdateSale(cookies, saleId) {
  logStep(`Testing PUT /api/sales/${saleId} - Update sale`);

  const updateData = {
    description: 'API Test Sale - UPDATED',
    salePrice: 75000,
    saleDate: new Date().toISOString(),
    buyerName: 'Updated Customer',
    buyerPhone: '+250788999999',
    buyerEmail: 'updated@example.com',
    category: 'CINEMA',
    saleType: 'SHOP_SALE',
    paymentMethod: 'MPESA',
    paymentStatus: 'COMPLETED',
    quantity: 15,
    unitPrice: 5000,
    location: 'Ngoma Business Center - Updated',
    notes: 'Updated via API test'
  };

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sales/${saleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Sale updated successfully`);
      logInfo(`New price: ${data.currency} ${data.salePrice.toLocaleString()}`);
      logInfo(`New payment method: ${data.paymentMethod}`);
      return data;
    } else {
      logError(`Failed to update sale: ${response.status}`);
      console.log('Error details:', data);
      return null;
    }
  } catch (error) {
    logError(`Error updating sale: ${error.message}`);
    return null;
  }
}

// Test DELETE /api/sales/[id] - Delete sale
async function testDeleteSale(cookies, saleId) {
  logStep(`Testing DELETE /api/sales/${saleId} - Delete sale`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sales/${saleId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Sale deleted successfully`);
      return true;
    } else {
      logError(`Failed to delete sale: ${response.status}`);
      console.log('Error details:', data);
      return false;
    }
  } catch (error) {
    logError(`Error deleting sale: ${error.message}`);
    return false;
  }
}

// Test API without authentication
async function testUnauthorizedAccess() {
  logStep('Testing unauthorized access (without authentication)');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sales`, {
      method: 'GET'
    });

    const data = await response.json();

    if (response.status === 401) {
      logSuccess('Unauthorized access correctly rejected (401)');
      return true;
    } else {
      logWarning(`Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error testing unauthorized access: ${error.message}`);
    return false;
  }
}

// Main test suite
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Sales API Test Suite - Coolify Deployment');
  console.log('='.repeat(60));
  console.log(`\n📍 Target: ${PRODUCTION_URL}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  try {
    // Test 1: Unauthorized access
    console.log('\n📋 Test 1: Security - Unauthorized Access');
    console.log('-'.repeat(60));
    results.total++;
    const unauthorizedTest = await testUnauthorizedAccess();
    if (unauthorizedTest) results.passed++; else results.failed++;

    // Test 2: Authentication
    console.log('\n📋 Test 2: Authentication');
    console.log('-'.repeat(60));
    results.total++;
    const cookies = await loginToProduction();
    if (cookies) results.passed++; else results.failed++;

    if (!cookies) {
      logError('Cannot proceed without authentication. Stopping tests.');
      return;
    }

    // Test 3: List all sales
    console.log('\n📋 Test 3: List All Sales (GET /api/sales)');
    console.log('-'.repeat(60));
    results.total++;
    const salesList = await testListSales(cookies);
    if (salesList) results.passed++; else results.failed++;

    // Test 4: List sales with filters
    console.log('\n📋 Test 4: List Sales with Filters');
    console.log('-'.repeat(60));
    results.total++;
    const filteredSales = await testListSalesWithFilters(cookies);
    if (filteredSales) results.passed++; else results.failed++;

    // Test 5: Create sale
    console.log('\n📋 Test 5: Create Sale (POST /api/sales)');
    console.log('-'.repeat(60));
    results.total++;
    const createdSale = await testCreateSale(cookies);
    if (createdSale) results.passed++; else results.failed++;

    if (!createdSale) {
      logWarning('Cannot proceed with update/delete tests without created sale.');
    } else {
      const saleId = createdSale.id;

      // Test 6: Get single sale
      console.log('\n📋 Test 6: Get Single Sale (GET /api/sales/[id])');
      console.log('-'.repeat(60));
      results.total++;
      const retrievedSale = await testGetSale(cookies, saleId);
      if (retrievedSale) results.passed++; else results.failed++;

      // Test 7: Update sale
      console.log('\n📋 Test 7: Update Sale (PUT /api/sales/[id])');
      console.log('-'.repeat(60));
      results.total++;
      const updatedSale = await testUpdateSale(cookies, saleId);
      if (updatedSale) results.passed++; else results.failed++;

      // Test 8: Delete sale (cleanup)
      console.log('\n📋 Test 8: Delete Sale (DELETE /api/sales/[id])');
      console.log('-'.repeat(60));
      results.total++;
      const deleted = await testDeleteSale(cookies, saleId);
      if (deleted) results.passed++; else results.failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.total}`);
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
      logError(`Failed: ${results.failed}`);
    }
    console.log('='.repeat(60) + '\n');

    if (results.failed === 0) {
      logSuccess('All tests passed! 🎉');
    } else {
      logWarning(`${results.failed} test(s) failed. Review the details above.`);
    }

  } catch (error) {
    logError(`Fatal error during tests: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n👋 Testing complete\n');
      process.exit(0);
    })
    .catch((error) => {
      logError(`Test suite failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runTests };
