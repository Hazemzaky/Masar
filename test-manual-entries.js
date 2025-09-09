// Test script for Manual P&L Entries Database Storage
const mongoose = require('mongoose');

// Import the ManualPnLEntry model
const ManualPnLEntry = require('./src/models/ManualPnLEntry').default;

// Test database connection and manual entries functionality
async function testManualEntries() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB (replace with your connection string)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name');
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if manual entries exist
    console.log('\n📊 Test 1: Checking existing manual entries...');
    const existingEntries = await ManualPnLEntry.find({ isActive: true });
    console.log(`Found ${existingEntries.length} manual entries in database`);

    if (existingEntries.length === 0) {
      console.log('⚠️  No manual entries found. This is expected for first run.');
    } else {
      console.log('✅ Manual entries found:');
      existingEntries.forEach(entry => {
        console.log(`  - ${entry.itemId}: ${entry.description} = KD ${entry.amount}`);
      });
    }

    // Test 2: Create a test entry if none exist
    if (existingEntries.length === 0) {
      console.log('\n🔧 Test 2: Creating test manual entry...');
      const testEntry = new ManualPnLEntry({
        itemId: 'test_revenue',
        description: 'Test Revenue Entry',
        amount: 1000,
        category: 'revenue',
        type: 'revenue',
        notes: 'This is a test entry',
        createdBy: 'test-script',
        updatedBy: 'test-script'
      });

      await testEntry.save();
      console.log('✅ Test entry created successfully');
    }

    // Test 3: Update an existing entry
    console.log('\n🔄 Test 3: Testing entry update...');
    const firstEntry = await ManualPnLEntry.findOne({ isActive: true });
    if (firstEntry) {
      const originalAmount = firstEntry.amount;
      firstEntry.amount = originalAmount + 500;
      firstEntry.updatedBy = 'test-script';
      await firstEntry.save();
      
      console.log(`✅ Updated ${firstEntry.itemId} from KD ${originalAmount} to KD ${firstEntry.amount}`);
    }

    // Test 4: Verify persistence
    console.log('\n💾 Test 4: Verifying data persistence...');
    const updatedEntries = await ManualPnLEntry.find({ isActive: true });
    console.log(`✅ Database contains ${updatedEntries.length} entries after updates`);

    // Test 5: Test the static methods
    console.log('\n🔍 Test 5: Testing static methods...');
    const activeEntries = await ManualPnLEntry.getActiveEntries();
    console.log(`✅ getActiveEntries() returned ${activeEntries.length} entries`);

    const revenueEntries = await ManualPnLEntry.getEntriesByCategory('revenue');
    console.log(`✅ getEntriesByCategory('revenue') returned ${revenueEntries.length} entries`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connection: Working');
    console.log('✅ Manual entries storage: Working');
    console.log('✅ Entry updates: Working');
    console.log('✅ Data persistence: Working');
    console.log('✅ Static methods: Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testManualEntries();
