export type UserData = {
  id: string;
  firebase_uid: string;
  phone: string;
  twilio_phone_number: string;
  role: string;
  email: string;
  avatar: string;
  status: string;
  firstName: string;
  lastName: string;
  displayName: string;
  // Add other properties as needed
};

export type College = {
  id: string;
  collegeName: string;
  phone: string;
  email: string;
  address: {
    city: string;
    state: string;
    zip: string;
  };
  country: string;
  website: string;
  collegeType: [];
  bppeApproved: boolean;
  status: string;
  addedBy: {
    id: string;
    email: string;
    role: string;
  };
  assignedTo: {
    id: string;
    email: string;
    role: string;
  };
  updatedBy: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
  // Add other properties as needed
};

export type UserStore = {
  userRole: string | null;
  colleges: College[];
  userData: UserData | null;
  getUser: () => Promise<void>;
  fetchColleges: () => Promise<void>;
};
