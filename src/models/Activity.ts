import mongoose from 'mongoose';
import { ActivityType, ActivityStatus } from '@/types/activity';

const activitySchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'] 
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'] 
  },
  type: { 
    type: String, 
    required: [true, 'Activity type is required'],
    enum: Object.values(ActivityType)
  },
  status: { 
    type: String, 
    required: [true, 'Status is required'],
    enum: Object.values(ActivityStatus),
    default: ActivityStatus.PENDING
  },
  dueDate: { 
    type: Date, 
    required: [true, 'Due date is required'] 
  },
  completedAt: { 
    type: Date 
  },
  prospectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospect',
    required: [true, 'Prospect ID is required']
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Added by user is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for common queries
activitySchema.index({ prospectId: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ dueDate: 1 });
activitySchema.index({ addedBy: 1 });

// Add a compound index for prospect and status
activitySchema.index({ prospectId: 1, status: 1 });

// Method to mark activity as completed
activitySchema.methods.markAsCompleted = function() {
  this.status = ActivityStatus.COMPLETED;
  this.completedAt = new Date();
  return this.save();
};

// Method to update status
activitySchema.methods.updateStatus = function(newStatus: ActivityStatus) {
  this.status = newStatus;
  if (newStatus === ActivityStatus.COMPLETED) {
    this.completedAt = new Date();
  }
  return this.save();
};

// Pre-save middleware to validate status transitions
activitySchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === ActivityStatus.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema); 