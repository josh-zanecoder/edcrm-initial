import { User } from './prospect';

export enum MemberRole {
  Director = 'Director',
  Administrator = 'Administrator',
  Instructor = 'Instructor',
  Staff = 'Staff',
  Other = 'Other'
}

export interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: MemberRole;
  createdAt: Date;
  updatedAt: Date;
  addedBy: User;
  prospectId: string;
  collegeName: string;
} 