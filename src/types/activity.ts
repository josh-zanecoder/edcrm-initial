export interface Activity {
  _id: string;
  prospectId: string;
  title: string;
  description: string;
  type: ActivityType;
  status: ActivityStatus;
  dueDate: Date;
  completedAt?: Date;
  addedBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ActivityType {
  CALL = 'Call',
  EMAIL = 'Email',
  MEETING = 'Meeting',
  TASK = 'Task',
  NOTE = 'Note'
}

export enum ActivityStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export type CreateActivity = Omit<Activity, '_id' | 'createdAt' | 'updatedAt' | 'addedBy' | 'isActive'>;
export type UpdateActivity = Partial<CreateActivity>; 