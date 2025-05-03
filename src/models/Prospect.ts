import mongoose from 'mongoose';
import { CollegeType } from '@/types/prospect';

const userSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  id: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true }
}, { _id: false });

const prospectSchema = new mongoose.Schema({
  collegeName: { type: String, required: true },
  phone: { type: String, required: true },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  address: { type: addressSchema, required: true },
  county: { type: String, required: true },
  website: {
    type: String,
    required: true,
    match: [/^https?:\/\//, 'Please enter a valid URL starting with http:// or https://']
  },
  collegeTypes: {
    type: [String],
    required: true,
    enum: Object.values(CollegeType),
    validate: {
      validator: function (types: string[]) {
        return types.length > 0;
      },
      message: 'At least one college type must be selected'
    }
  },
  bppeApproved: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    required: true,
    enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'],
    default: 'New'
  },
  lastContact: {
    type: Date,
    required: true,
    default: Date.now
  },
  addedBy: { type: userSchema, required: true },
  assignedTo: { type: userSchema, required: true }
}, {
  timestamps: true
});

prospectSchema.index({ collegeName: 1 });
prospectSchema.index({ status: 1 });
prospectSchema.index({ 'address.state': 1 });
prospectSchema.index({ collegeTypes: 1 });

export default mongoose.models.Prospect || mongoose.model('Prospect', prospectSchema);
