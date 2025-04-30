export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
  twilioNumber: string | null;
  role: 'admin' | 'salesperson';
  redirectTo: string;
  twilio_number?: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
} 