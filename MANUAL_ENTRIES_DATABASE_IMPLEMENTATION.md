# Manual P&L Entries Database Implementation

## Overview

This implementation adds **persistent database storage** for manual P&L entries, ensuring that data is **never lost** during server restarts. Previously, manual entries were hardcoded and reset to 0 on every server restart.

## ✅ What's Been Implemented

### 1. **MongoDB Model** (`server/src/models/ManualPnLEntry.ts`)
- **Complete TypeScript interface** with proper typing
- **MongoDB schema** with validation and indexes
- **Static methods** for common queries
- **Instance methods** for updates and file attachments
- **Audit trail** with createdBy/updatedBy tracking
- **Soft delete** support with isActive flag

### 2. **Updated P&L Controller** (`server/src/controllers/pnlController.ts`)
- **Database operations** for all manual entry functions
- **Automatic initialization** of default entries on first run
- **Real-time integration** with P&L calculations
- **Proper error handling** and validation
- **User tracking** for audit purposes

### 3. **Key Features**
- **13 Default Manual Entries** automatically created
- **Persistent storage** across server restarts
- **Real-time updates** reflected in P&L calculations
- **Data validation** and error handling
- **Audit trail** for all changes
- **File attachment** support (ready for future use)

## 🗄️ Database Schema

```typescript
interface IManualPnLEntry {
  itemId: string;           // Unique identifier (e.g., 'rebate', 'sub_companies_revenue')
  description: string;      // Human-readable name
  amount: number;           // Current value (default: 0)
  category: 'revenue' | 'expense' | 'other_income';
  type: 'revenue' | 'expense';
  notes?: string;           // Optional notes
  createdBy: string;        // User who created the entry
  updatedBy: string;        // User who last updated
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
  isActive: boolean;        // Soft delete flag
  // Optional fields for future enhancements
  period?: string;
  startDate?: Date;
  endDate?: Date;
  attachedFiles?: Array<FileInfo>;
}
```

## 📊 Default Manual Entries

The system automatically creates these 13 manual entries:

### **Revenue Items:**
1. **Rebate** - Rebates received
2. **Sub Companies Revenue** - Revenue from subsidiary companies
3. **Other Revenue** - Other miscellaneous revenue
4. **Provision End Service** - Reversal of end of service provisions
5. **Provision Impairment** - Reversal of impairment provisions
6. **DS Revenue** - Direct sales revenue

### **Expense Items:**
7. **Rental Equipment Cost** - Costs associated with rental equipment
8. **DS Cost** - Direct sales costs
9. **General Admin Expenses** - General administrative expenses
10. **Provision Credit Loss** - Provision for credit losses
11. **Service Agreement Cost** - Costs for service agreements
12. **Finance Costs** - Financial costs and interest

### **Other Income:**
13. **Gain Selling Products** - Gains from selling products

## 🔄 API Endpoints

### **GET /api/pnl/manual-entries**
- **Purpose**: Fetch all active manual entries
- **Response**: Array of manual entry objects
- **Auto-initialization**: Creates default entries if none exist

### **PUT /api/pnl/manual-entries/:itemId**
- **Purpose**: Update a specific manual entry
- **Body**: `{ amount: number, notes?: string }`
- **Response**: Updated entry with timestamps
- **Validation**: Amount must be a valid number

## 🚀 How It Works

### **1. First Run (Database Initialization)**
```javascript
// When no entries exist, system automatically creates default entries
if (manualEntries.length === 0) {
  await initializeDefaultManualEntries();
}
```

### **2. Real-Time P&L Integration**
```javascript
// Manual entries are fetched and used in P&L calculations
const manualEntries = await ManualPnLEntry.find({ isActive: true }).lean();
const manualEntriesMap = manualEntries.reduce((acc, entry) => {
  acc[entry.itemId] = entry.amount;
  return acc;
}, {});

// Used in calculations
const rebate = manualEntriesMap['rebate'] || 0;
const subCompaniesRevenue = manualEntriesMap['sub_companies_revenue'] || 0;
```

### **3. Data Persistence**
- **All changes are saved** to MongoDB immediately
- **Data survives** server restarts
- **Audit trail** tracks who made changes and when
- **Validation** ensures data integrity

## 🧪 Testing

### **Test Script** (`server/test-manual-entries.js`)
```bash
# Run the test script
cd server
node test-manual-entries.js
```

**Test Coverage:**
- ✅ Database connection
- ✅ Entry creation and retrieval
- ✅ Entry updates
- ✅ Data persistence
- ✅ Static methods
- ✅ Error handling

## 📈 Benefits

### **Before (Hardcoded)**
- ❌ Data lost on server restart
- ❌ No user tracking
- ❌ No audit trail
- ❌ No validation
- ❌ Manual entries always showed 0

### **After (Database)**
- ✅ **Data persists** across server restarts
- ✅ **User tracking** for all changes
- ✅ **Complete audit trail**
- ✅ **Data validation** and error handling
- ✅ **Real-time P&L integration**
- ✅ **Scalable** for future enhancements

## 🔧 Configuration

### **Environment Variables**
```bash
MONGODB_URI=mongodb://localhost:27017/your-database-name
```

### **Database Indexes**
- `itemId` - Unique identifier
- `category` - For filtering by type
- `isActive` - For soft delete queries
- `createdAt` - For sorting by date

## 🚨 Error Handling

### **Common Scenarios**
1. **Entry not found**: Returns 404 with clear message
2. **Invalid amount**: Returns 400 with validation error
3. **Database connection**: Graceful fallback with error logging
4. **Duplicate itemId**: Prevented by unique index

### **Logging**
- All operations are logged with timestamps
- Error details are captured for debugging
- User actions are tracked for audit

## 🔮 Future Enhancements

### **Ready for Implementation**
1. **File Attachments**: Schema already supports file uploads
2. **Period-specific Entries**: Support for different time periods
3. **Approval Workflow**: Add approval states and workflows
4. **Bulk Operations**: Update multiple entries at once
5. **Export/Import**: CSV/Excel import/export functionality

### **Advanced Features**
1. **Version History**: Track all changes over time
2. **Rollback**: Revert to previous versions
3. **Notifications**: Alert when entries are updated
4. **Analytics**: Track usage patterns and trends

## 📋 Migration Guide

### **For Existing Systems**
1. **No data loss** - System gracefully handles existing data
2. **Automatic initialization** - Default entries created on first run
3. **Backward compatibility** - Existing API endpoints work unchanged
4. **Gradual migration** - Can be deployed without downtime

### **Deployment Steps**
1. Deploy the new model and controller
2. Restart the server
3. System automatically initializes default entries
4. Existing frontend continues to work
5. Data is now persistent!

## ✅ Verification

### **Check if Working**
1. **Start the server**
2. **Navigate to P&L page**
3. **Go to Manual Entries tab**
4. **Update any value** (e.g., set Rebate to 1000)
5. **Restart the server**
6. **Refresh the page** - value should still be 1000!

### **Database Verification**
```javascript
// Check in MongoDB
db.manualpnlentries.find({ isActive: true })
```

## 🎉 Summary

**The manual entries are now fully persistent!** 

- ✅ **No more data loss** on server restarts
- ✅ **Real-time P&L integration** with actual user values
- ✅ **Complete audit trail** for compliance
- ✅ **Scalable architecture** for future enhancements
- ✅ **Production-ready** with proper error handling

Your P&L system now has **enterprise-grade data persistence** for manual entries! 🚀
