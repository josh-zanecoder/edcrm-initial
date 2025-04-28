import { Schema, model } from 'mongoose';
import { ReminderType, ReminderStatus } from '@/types/reminder';

const reminderSchema = new Schema({
  prospectId: {
    type: Schema.Types.ObjectId,
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Update the updatedAt field before saving
reminderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default model('Reminder', reminderSchema); 