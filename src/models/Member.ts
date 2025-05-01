import mongoose from 'mongoose';
import { MemberRole } from '@/types/member';

const memberSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'] 
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'] 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true, // <-- This sets the index
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-()]{10,}$/, 'Please enter a valid phone number with at least 10 digits']
  },
  role: { 
    type: String, 
    required: [true, 'Role is required'],
    enum: Object.values(MemberRole)
  },
  prospectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospect',
    required: [true, 'Prospect ID is required']
  },
  collegeName: {
    type: String,
    required: [true, 'College name is required']
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Added by user is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastContactDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ Removed this: memberSchema.index({ email: 1 }, { unique: true })

// Other indexes
memberSchema.index({ prospectId: 1 });
memberSchema.index({ collegeName: 1 });
memberSchema.index({ role: 1 });
memberSchema.index({ addedBy: 1 });
memberSchema.index({ prospectId: 1, role: 1 }); // compound index

// Virtual full name
memberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to update last contact date
memberSchema.methods.updateLastContact = function() {
  this.lastContactDate = new Date();
  return this.save();
};

// Format phone before save
memberSchema.pre('save', function(next) {
  if (this.isModified('phone')) {
    this.phone = this.phone.replace(/[^\d+]/g, '');
  }
  next();
});

export default mongoose.models.Member || mongoose.model('Member', memberSchema);
  