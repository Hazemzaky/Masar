import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  phone: string;
  email: string;
  address: string;
  tradeLicense?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  registrationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  tradeLicense: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'blacklisted'], default: 'inactive' },
  registrationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IVendor>('Vendor', VendorSchema); 