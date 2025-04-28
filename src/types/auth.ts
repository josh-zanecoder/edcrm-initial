export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
  role: 'admin' | 'salesperson';
  redirectTo: string;
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