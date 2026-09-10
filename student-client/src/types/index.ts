export interface Student {
  id: number;
  name: string;
  email: string;
  course: string;
  created_at?: string;
}

export interface AuthState {
  token: string | null;
  username: string | null;
}