import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessTrip extends Document {
  employee: mongoose.Types.ObjectId;
  tripType: string;
  region: string;
  agendaFile?: string;
  departureDate: Date;
  returnDate: Date;
  requiresVisa: boolean;
  seminarFile?: string;
  cost: number;
  flightClass: string;
  hotelQuotes?: string[];
  flightQuotes?: string[];
  travelArrangedBy?: string;
  costPaid?: boolean;
  costPaymentDate?: Date;
  receipts?: string[];
  claimSheet?: string;
  financeApproval?: 'approved' | 'rejected' | 'pending';
  financeComments?: string;
  // Add amortization fields
  costAmortization?: boolean;
  amortizationPeriod?: string;
  amortizationStartDate?: Date;
  amortizationEndDate?: Date;
  totalTripCost?: number;
  customPeriod?: number;
  approvalChain?: Array<{
    role: string;
    name: string;
    status: 'Approved' | 'Under Review' | 'Pending' | 'Rejected';
    timestamp?: Date;
    comment?: string;
  }>;
  postTripSummary?: string;
  boardingPass?: string;
  signedClaimForm?: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Completed' | 'Reimbursed' | 'Rejected';
  timeline?: Array<{
    date: Date;
    event: string;
    description?: string;
    type: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessTripSchema = new Schema<IBusinessTrip>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  tripType: { type: String, required: true },
  region: { type: String, required: true },
  agendaFile: { type: String },
  departureDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  requiresVisa: { type: Boolean, default: false },
  seminarFile: { type: String },
  cost: { type: Number, required: true },
  flightClass: { type: String, required: true },
  hotelQuotes: [{ type: String }],
  flightQuotes: [{ type: String }],
  travelArrangedBy: { type: String },
  costPaid: { type: Boolean, default: false },
  costPaymentDate: { type: Date },
  receipts: [{ type: String }],
  claimSheet: { type: String },
  financeApproval: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
  financeComments: { type: String },
  // Add amortization fields
  costAmortization: { type: Boolean },
  amortizationPeriod: { type: String },
  amortizationStartDate: { type: Date },
  amortizationEndDate: { type: Date },
  totalTripCost: { type: Number },
  customPeriod: { type: Number },
  approvalChain: [{
    role: String,
    name: String,
    status: { type: String, enum: ['Approved', 'Under Review', 'Pending', 'Rejected'], default: 'Pending' },
    timestamp: Date,
    comment: String,
  }],
  postTripSummary: { type: String },
  boardingPass: { type: String },
  signedClaimForm: { type: String },
  status: { type: String, enum: ['Draft', 'Under Review', 'Approved', 'Completed', 'Reimbursed', 'Rejected'], default: 'Draft' },
  timeline: [
    {
      date: Date,
      event: String,
      description: String,
      type: String,
    }
  ],
}, { timestamps: true });

export default mongoose.model<IBusinessTrip>('BusinessTrip', BusinessTripSchema); 