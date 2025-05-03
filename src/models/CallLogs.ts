import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog extends Document {
  to: string;
  from: string;
  userId: string;
  prospectId: string;
  memberId: string;
  callSid: string;
  parentCallSid?: string;
  activityId: string;
  transcription: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema: Schema = new Schema({
  to: { type: String, required: true },
  from: { type: String, required: true },
  userId: { type: String, required: true },
  prospectId: { type: String, required: true },
  callSid: { type: String, required: true, unique: true },
  memberId: { type: String, required: false},
  parentCallSid: { type: String },
  activityId: { type: String, required: true },
  transcription: { type: String, required: true}
}, {
  timestamps: true
});

// Create indexes for better query performance
CallLogSchema.index({ userId: 1 });
CallLogSchema.index({ prospectId: 1 });
CallLogSchema.index({ memberId: 1 });

// Use the existing model if it exists, otherwise create a new one
export const CallLog = mongoose.models.CallLog || mongoose.model<ICallLog>('CallLog', CallLogSchema);
