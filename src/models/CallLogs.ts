import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog extends Document {
  to: string;
  from: string;
  userId: string;
  prospectId: string;
  callSid: string;
  parentCallSid?: string;
  activityId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema: Schema = new Schema({
  to: { type: String, required: true },
  from: { type: String, required: true },
  userId: { type: String, required: true },
  prospectId: { type: String, required: true },
  callSid: { type: String, required: true, unique: true },
  parentCallSid: { type: String },
  activityId: { type: String, required: true }
}, {
  timestamps: true
});

// Create indexes for better query performance
CallLogSchema.index({ userId: 1 });
CallLogSchema.index({ prospectId: 1 });
CallLogSchema.index({ callSid: 1 }, { unique: true });

export const CallLog = mongoose.model<ICallLog>('CallLog', CallLogSchema);
