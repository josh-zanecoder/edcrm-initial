import mongoose from 'mongoose';
import { ReminderType, ReminderStatus } from '@/types/reminder';

const reminderSchema = new mongoose.Schema({
  prospectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospect',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(ReminderType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ReminderStatus),
    default: ReminderStatus.PENDING
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Middleware to update `updatedAt`
reminderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
// Add indexes for common queries
reminderSchema.index({ prospectId: 1 });
reminderSchema.index({ dueDate: 1 });
reminderSchema.index({ status: 1 });

export default mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);
