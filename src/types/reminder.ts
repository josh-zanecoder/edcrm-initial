export enum ReminderType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  CALL = 'CALL',
  MEETING = 'MEETING',
  OTHER = 'OTHER'
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED'
}

export interface Reminder {
  _id: string;
  prospectId: string;
  title: string;
  description: string;
  type: ReminderType;
  status: ReminderStatus;
  dueDate: Date;
  completedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addedBy: string;
} 