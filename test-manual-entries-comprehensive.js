#!/usr/bin/env node

/**
 * Comprehensive Manual P&L Entries Test Script
 * Senior-level solution for debugging manual entries issues
 */

const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  log('\n🔌 Testing Database Connection...', 'cyan');
  
  try {
    await mongoose.connect(MONGODB_URI);
    log('✅ Database connected successfully', 'green');
    
    // Test ManualPnLEntry model
    const ManualPnLEntry = require('./src/models/ManualPnLEntry').default;
    const count = await ManualPnLEntry.countDocuments();
    log(`📊 Manual entries in database: ${count}`, 'blue');
    
    if (count > 0) {
      const sample = await ManualPnLEntry.findOne();
      log(`📝 Sample entry: ${sample.description} - ${sample.amount}`, 'blue');
    }
    
    return { success: true, count };
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testServerEndpoints() {
  log('\n🌐 Testing Server Endpoints...', 'cyan');
  
  const endpoints = [
    { name: 'P&L Test', url: '/api/pnl/test' },
    { name: 'Manual Entries Health', url: '/api/pnl/health/manual-entries' },
    { name: 'Manual Entries', url: '/api/pnl/manual-entries' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      log(`Testing ${endpoint.name}...`, 'yellow');
      const response = await axios.get(`${SERVER_URL}${endpoint.url}`, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      log(`✅ ${endpoint.name}: ${response.status} - ${response.data.message || 'Success'}`, 'green');
      results.push({ name: endpoint.name, success: true, data: response.data });
    } catch (error) {
      log(`❌ ${endpoint.name}: ${error.message}`, 'red');
      results.push({ name: endpoint.name, success: false, error: error.message });
    }
  }
  
  return results;
}

async function initializeManualEntries() {
  log('\n🔧 Initializing Manual Entries...', 'cyan');
  
  try {
    const ManualPnLEntry = require('./src/models/ManualPnLEntry').default;
    
    // Check if entries exist
    const existingCount = await ManualPnLEntry.countDocuments({ isActive: true });
    
    if (existingCount > 0) {
      log(`✅ Manual entries already exist: ${existingCount}`, 'green');
      return { success: true, count: existingCount };
    }
    
    // Create default entries
    const defaultEntries = [
      {
        itemId: 'rebate',
        description: 'Rebate',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Rebates received',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'sub_companies_revenue',
        description: 'Sub Companies Revenue',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Revenue from subsidiary companies',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'other_revenue',
        description: 'Other Revenue',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Other miscellaneous revenue',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'provision_end_service',
        description: 'Provision End Service',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Reversal of end of service provisions',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'provision_impairment',
        description: 'Provision Impairment',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Reversal of impairment provisions',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'gain_selling_products',
        description: 'Gain Selling Products',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'Gains from selling products',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'provision_credit_loss',
        description: 'Provision Credit Loss',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Provision for credit losses',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'rental_equipment_cost',
        description: 'Rental Equipment Cost',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Cost of rental equipment',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'service_agreement_cost',
        description: 'Service Agreement Cost',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Cost of service agreements',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'ds_revenue',
        description: 'DS Revenue',
        amount: 0,
        category: 'revenue',
        type: 'revenue',
        notes: 'DS revenue',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'ds_cost',
        description: 'DS Cost',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'DS cost',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'general_admin_expenses',
        description: 'General Admin Expenses',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'General administrative expenses',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      },
      {
        itemId: 'finance_costs',
        description: 'Finance Costs',
        amount: 0,
        category: 'expense',
        type: 'expense',
        notes: 'Finance and interest costs',
        createdBy: 'system',
        updatedBy: 'system',
        isActive: true
      }
    ];
    
    await ManualPnLEntry.insertMany(defaultEntries);
    log(`✅ Created ${defaultEntries.length} manual entries`, 'green');
    
    return { success: true, count: defaultEntries.length };
  } catch (error) {
    log(`❌ Failed to initialize manual entries: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTest() {
  log('🚀 Starting Comprehensive Manual P&L Entries Test', 'bright');
  log('=' .repeat(60), 'cyan');
  
  const results = {
    database: null,
    server: null,
    initialization: null
  };
  
  // Test 1: Database Connection
  results.database = await testDatabaseConnection();
  
  // Test 2: Server Endpoints
  results.server = await testServerEndpoints();
  
  // Test 3: Initialize Manual Entries
  results.initialization = await initializeManualEntries();
  
  // Test 4: Verify Final State
  log('\n🔍 Final Verification...', 'cyan');
  const finalTest = await testServerEndpoints();
  
  // Summary
  log('\n📊 TEST SUMMARY', 'bright');
  log('=' .repeat(60), 'cyan');
  
  log(`Database Connection: ${results.database.success ? '✅ PASS' : '❌ FAIL'}`, 
      results.database.success ? 'green' : 'red');
  
  if (results.database.success) {
    log(`  - Manual entries count: ${results.database.count}`, 'blue');
  }
  
  const serverSuccess = results.server.every(r => r.success);
  log(`Server Endpoints: ${serverSuccess ? '✅ PASS' : '❌ FAIL'}`, 
      serverSuccess ? 'green' : 'red');
  
  log(`Manual Entries Init: ${results.initialization.success ? '✅ PASS' : '❌ FAIL'}`, 
      results.initialization.success ? 'green' : 'red');
  
  if (results.initialization.success) {
    log(`  - Created/Found entries: ${results.initialization.count}`, 'blue');
  }
  
  const finalSuccess = finalTest.every(r => r.success);
  log(`Final Verification: ${finalSuccess ? '✅ PASS' : '❌ FAIL'}`, 
      finalSuccess ? 'green' : 'red');
  
  // Recommendations
  log('\n💡 RECOMMENDATIONS', 'bright');
  log('=' .repeat(60), 'cyan');
  
  if (!results.database.success) {
    log('1. Check MongoDB connection string and ensure MongoDB is running', 'yellow');
  }
  
  if (!serverSuccess) {
    log('2. Ensure the server is running on the correct port', 'yellow');
    log('3. Check server logs for any startup errors', 'yellow');
  }
  
  if (!results.initialization.success) {
    log('4. Check database permissions and model definitions', 'yellow');
  }
  
  if (finalSuccess) {
    log('🎉 All tests passed! Manual entries should now be working.', 'green');
    log(`🌐 Test your frontend at: ${SERVER_URL}/api/pnl/manual-entries`, 'blue');
  } else {
    log('⚠️  Some tests failed. Check the recommendations above.', 'yellow');
  }
  
  // Cleanup
  await mongoose.disconnect();
  log('\n🔌 Database disconnected', 'cyan');
}

// Run the test
runComprehensiveTest().catch(error => {
  log(`💥 Test failed with error: ${error.message}`, 'red');
  process.exit(1);
});
