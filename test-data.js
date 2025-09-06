// Quick test script to check database data
const mongoose = require('mongoose');
require('dotenv').config();

// Import models from compiled dist folder
const BusinessTrip = require('./dist/models/BusinessTrip').default;
const Overtime = require('./dist/models/Overtime').default;
const TripAllowance = require('./dist/models/TripAllowance').default;
const FoodAllowance = require('./dist/models/FoodAllowance').default;
const HSE = require('./dist/models/Environmental').default;
const Invoice = require('./dist/models/Invoice').default;
const FuelLog = require('./dist/models/FuelLog').default;

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/masar');
    console.log('Connected to MongoDB');

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    console.log('\n=== CHECKING DATABASE DATA ===');
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

    // Check each module
    const [businessTrips, overtime, tripAllowance, foodAllowance, hse, invoices, fuelLogs] = await Promise.all([
      BusinessTrip.countDocuments({ departureDate: { $gte: startDate, $lte: endDate } }),
      Overtime.countDocuments({}),
      TripAllowance.countDocuments({}),
      FoodAllowance.countDocuments({}),
      HSE.countDocuments({}),
      Invoice.countDocuments({ invoiceDate: { $gte: startDate, $lte: endDate } }),
      FuelLog.countDocuments({ dateTime: { $gte: startDate, $lte: endDate } })
    ]);

    console.log('📊 DATA COUNTS:');
    console.log(`Business Trips: ${businessTrips}`);
    console.log(`Overtime Records: ${overtime}`);
    console.log(`Trip Allowance Records: ${tripAllowance}`);
    console.log(`Food Allowance Records: ${foodAllowance}`);
    console.log(`HSE Records: ${hse}`);
    console.log(`Invoices: ${invoices}`);
    console.log(`Fuel Logs: ${fuelLogs}`);

    // Check for any data at all
    const totalRecords = businessTrips + overtime + tripAllowance + foodAllowance + hse + invoices + fuelLogs;
    console.log(`\nTotal Records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('\n❌ NO DATA FOUND!');
      console.log('This explains why P&L is showing empty/old data.');
      console.log('You need to add some data to these modules first.');
    } else {
      console.log('\n✅ DATA FOUND!');
      console.log('The issue might be with the P&L calculation or display.');
    }

    // Sample some data
    if (businessTrips > 0) {
      const sampleTrip = await BusinessTrip.findOne({ departureDate: { $gte: startDate, $lte: endDate } });
      console.log('\nSample Business Trip:', {
        departureDate: sampleTrip?.departureDate,
        totalTripCost: sampleTrip?.totalTripCost,
        perDiem: sampleTrip?.perDiem
      });
    }

    if (invoices > 0) {
      const sampleInvoice = await Invoice.findOne({ invoiceDate: { $gte: startDate, $lte: endDate } });
      console.log('\nSample Invoice:', {
        invoiceDate: sampleInvoice?.invoiceDate,
        amount: sampleInvoice?.amount,
        status: sampleInvoice?.status
      });
    }

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkData();
