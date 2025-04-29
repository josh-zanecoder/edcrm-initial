export interface Salesperson {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  role: 'salesperson';
  joinDate: string;
}

export interface CreateSalespersonInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: 'salesperson';
  twilio_number?: string; // Add this new field
}

export interface UpdateSalespersonInput extends Partial<CreateSalespersonInput> {
  status?: 'active' | 'inactive';
}