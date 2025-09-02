import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: string;
  employee: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakDuration: number;
  status: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day' | 'remote' | 'travel';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  device?: {
    type: 'mobile' | 'web' | 'biometric' | 'rfid' | 'facial';
    deviceId: string;
    ipAddress: string;
  };
  biometricData?: {
    fingerprintId?: string;
    faceId?: string;
    confidence: number;
  };
  notes?: string;
  approvedBy?: string;
  isManualEntry: boolean;
  temperature?: number;
  healthCheck: boolean;
  workMode: 'office' | 'remote' | 'hybrid' | 'field' | 'travel';
  projectCode?: string;
  taskCategories?: string[];
  productivity: {
    score: number;
    keystrokes?: number;
    mouseClicks?: number;
    screenshotCount?: number;
    activeMinutes: number;
  };
  mood?: 'excellent' | 'good' | 'neutral' | 'tired' | 'stressed';
  energyLevel: number;
  achievements?: string[];
  violations?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkIn: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  checkOut: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  breakStart: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  breakEnd: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  regularHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  breakDuration: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'on-leave', 'half-day', 'remote', 'travel'],
    default: 'present',
    index: true
  },
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    address: String
  },
  device: {
    type: {
      type: String,
      enum: ['mobile', 'web', 'biometric', 'rfid', 'facial'],
      default: 'web'
    },
    deviceId: String,
    ipAddress: String
  },
  biometricData: {
    fingerprintId: String,
    faceId: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  notes: {
    type: String,
    maxlength: 500
  },
  approvedBy: {
    type: String
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  temperature: {
    type: Number,
    min: 30,
    max: 45
  },
  healthCheck: {
    type: Boolean,
    default: false
  },
  workMode: {
    type: String,
    enum: ['office', 'remote', 'hybrid', 'field', 'travel'],
    default: 'office',
    index: true
  },
  projectCode: {
    type: String,
    maxlength: 50
  },
  taskCategories: [{
    type: String,
    maxlength: 100
  }],
  productivity: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    keystrokes: {
      type: Number,
      min: 0
    },
    mouseClicks: {
      type: Number,
      min: 0
    },
    screenshotCount: {
      type: Number,
      min: 0
    },
    activeMinutes: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'neutral', 'tired', 'stressed']
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  achievements: [{
    type: String,
    maxlength: 200
  }],
  violations: [{
    type: String,
    maxlength: 200
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: -1 });
AttendanceSchema.index({ status: 1, date: -1 });
AttendanceSchema.index({ workMode: 1, date: -1 });
AttendanceSchema.index({ 'productivity.score': -1 });
AttendanceSchema.index({ createdAt: -1 });
AttendanceSchema.index({ updatedAt: -1 });

// Virtual for calculating late status
AttendanceSchema.virtual('isLate').get(function() {
  if (!this.checkIn) return false;
  const [hours, minutes] = this.checkIn.split(':').map(Number);
  const checkInMinutes = hours * 60 + minutes;
  const standardStartTime = 9 * 60; // 9:00 AM in minutes
  return checkInMinutes > standardStartTime;
});

// Virtual for calculating early departure
AttendanceSchema.virtual('isEarlyDeparture').get(function() {
  if (!this.checkOut) return false;
  const [hours, minutes] = this.checkOut.split(':').map(Number);
  const checkOutMinutes = hours * 60 + minutes;
  const standardEndTime = 17 * 60; // 5:00 PM in minutes
  return checkOutMinutes < standardEndTime;
});

// Virtual for work duration in minutes
AttendanceSchema.virtual('workDurationMinutes').get(function() {
  if (!this.checkIn || !this.checkOut) return 0;
  
  const [inHours, inMinutes] = this.checkIn.split(':').map(Number);
  const [outHours, outMinutes] = this.checkOut.split(':').map(Number);
  
  const checkInMinutes = inHours * 60 + inMinutes;
  const checkOutMinutes = outHours * 60 + outMinutes;
  
  return checkOutMinutes - checkInMinutes - (this.breakDuration || 0);
});

// Pre-save middleware to calculate hours and determine status
AttendanceSchema.pre('save', function(next) {
  // Calculate total hours if both check-in and check-out are present
  if (this.checkIn && this.checkOut) {
    const workMinutes = this.workDurationMinutes;
    this.totalHours = Math.round((workMinutes / 60) * 100) / 100;
    this.regularHours = Math.min(this.totalHours, 8);
    this.overtimeHours = Math.max(0, this.totalHours - 8);
  }
  
  // Auto-determine status based on check-in time and presence
  if (this.checkIn && this.status === 'present') {
    if (this.isLate) {
      this.status = 'late';
    }
  }
  
  // Set default productivity score if not provided
  if (!this.productivity.score) {
    this.productivity.score = Math.floor(Math.random() * 30) + 70; // Random between 70-100
  }
  
  next();
});

// Static method to get attendance summary for a date range
AttendanceSchema.statics.getAttendanceSummary = async function(startDate: Date, endDate: Date, employeeId?: string) {
  const matchQuery: any = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (employeeId) {
    matchQuery.employeeId = employeeId;
  }
  
  const summary = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        absentDays: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        lateDays: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        leaveDays: { $sum: { $cond: [{ $eq: ['$status', 'on-leave'] }, 1, 0] } },
        remoteDays: { $sum: { $cond: [{ $eq: ['$workMode', 'remote'] }, 1, 0] } },
        totalHours: { $sum: '$totalHours' },
        totalOvertimeHours: { $sum: '$overtimeHours' },
        avgProductivity: { $avg: '$productivity.score' },
        avgEnergyLevel: { $avg: '$energyLevel' }
      }
    }
  ]);
  
  return summary[0] || {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    remoteDays: 0,
    totalHours: 0,
    totalOvertimeHours: 0,
    avgProductivity: 0,
    avgEnergyLevel: 5
  };
};

// Static method to get top performers
AttendanceSchema.statics.getTopPerformers = async function(date: Date, limit: number = 10) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await this.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    'productivity.score': { $gt: 0 }
  })
  .populate('employee', 'name avatar department')
  .sort({ 'productivity.score': -1 })
  .limit(limit);
};

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
