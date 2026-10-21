export interface ProfileData {
  name?: string;
  birthday?: string;
  address?: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  photoUri?: string | null;
  points?: number;
  completedChallenges?: string[];
  profile?: ProfileData;
  apiKey?: string;
  data?: T;
}

export interface FormErrors {
  email?: string;
  password?: string;
  age?: string;
  api?: string;
}

export interface UserContextType {
  email: string | null;
  points: number;
}

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  created_at?: string;
  is_read?: boolean;
  read?: boolean;
  icon_name?: string | null;
  icon_color?: string | null;
}
