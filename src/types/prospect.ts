export interface Address {
  city: string;
  state: string;
  zip: string;
}

export enum CollegeType {
  BEAUTY_SCHOOL = 'Beauty School',
  NURSING_SCHOOL = 'Nursing School',
  MASSAGE_THERAPY_SCHOOL = 'Massage Therapy School',
  MEDICAL_ASSISTANT_SCHOOL = 'Medical Assistant School',
  DENTAL_ASSISTANT_SCHOOL = 'Dental Assistant School',
  PMU_MICROBLADING_SCHOOL = 'PMU/Microblading School',
  TECH_BOOTCAMP = 'Tech Bootcamp',
  HEALTH_SCHOOL = 'Health School',
  LANGUAGE_SCHOOL = 'Language School',
  REAL_ESTATE_SCHOOL = 'Real Estate School',
  TRUCK_DRIVING_SCHOOL = 'Truck Driving School',
  OTHER_VOCATIONAL_TRADE_SCHOOL = 'Other Vocational Trade School'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface Prospect {
  id: string;
  collegeName: string;
  phone: string;
  email: string;
  address: Address;
  county: string;
  website: string;
  collegeTypes: CollegeType[];
  bppeApproved: boolean;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed';
  lastContact: string;
  createdAt: string;
  updatedAt: string;
  addedBy: User;
  assignedTo: User;
} 