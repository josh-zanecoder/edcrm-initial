import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

// Delete the model if it exists to prevent caching issues
if (mongoose.models.SalesPerson) {
    delete mongoose.models.SalesPerson;
}

export interface SalesPerson {
    _id: ObjectId;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    twilio_number?: string;
    forwarding_number?: string;
    is_forwarding?: boolean;
    firebase_uid: string;
    status: 'active' | 'inactive';
    role: 'salesperson';
    joinDate: string;
    createdAt: string;
    updatedAt: string;
}

const salesPersonSchema = new mongoose.Schema<SalesPerson>({
    first_name: { 
        type: String, 
        required: true,
        trim: true
    },
    last_name: { 
        type: String, 
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        unique: true
    },
    phone: { 
        type: String, 
        required: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    twilio_number: { 
        type: String,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    forwarding_number: { 
        type: String,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    is_forwarding: { 
        type: Boolean,
        default: false
    },
    firebase_uid: { 
        type: String, 
        required: true,
        unique: true
    },
    status: { 
        type: String, 
        required: true, 
        enum: ['active', 'inactive'],
        default: 'active'
    },
    role: { 
        type: String, 
        required: true, 
        default: 'salesperson',
        enum: ['salesperson']
    },
    joinDate: { 
        type: String, 
        required: true 
    }
}, {
    timestamps: true,
    collection: 'salespersons'
});

// Define indexes explicitly
salesPersonSchema.index({ email: 1 }, { unique: true });
salesPersonSchema.index({ phone: 1 });
salesPersonSchema.index({ firebase_uid: 1 }, { unique: true });
salesPersonSchema.index({ status: 1 });

// Export the model with explicit collection name
export const SalesPersonModel = mongoose.model<SalesPerson>('SalesPerson', salesPersonSchema, 'salespersons');
