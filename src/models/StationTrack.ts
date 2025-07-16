import mongoose, { Document, Schema } from 'mongoose';

export interface IStationTrack extends Document {
  station: string;
  status: 'Online' | 'Offline';
  lastDispense: Date;
  operator: string;
}

const stationNames = [
  'Shuwaikh',
  'Shuaiba North',
  'Shuaiba South',
  'Doha East',
  'Doha West',
  'Zour South',
  'Zour North',
  'Sabiya',
];

const StationTrackSchema = new Schema<IStationTrack>({
  station: { type: String, required: true, enum: stationNames },
  status: { type: String, enum: ['Online', 'Offline'], required: true },
  lastDispense: { type: Date, required: true },
  operator: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IStationTrack>('StationTrack', StationTrackSchema); 