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
