import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ProfileData } from '../types';

// Dummy database stored in AsyncStorage for demonstration
const DB_USERS_KEY = '@dummy_db_users';

export const api = {
  register: async (email: string, password: string, age: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      
      if (users[email]) {
        throw new Error('Usuário já cadastrado');
      }

      users[email] = { password, age };
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      
      return { success: true, message: 'Usuário cadastrado com sucesso' };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha no cadastro';
      return { success: false, message: errorMessage };
    }
  },
  
  login: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};

      // Dummy default user if DB is empty
      if (email === 'test@test.com' && password === 'Test1234') {
        return { success: true };
      }

      const user = users[email];
      if (!user || user.password !== password) {
        throw new Error('E-mail ou senha inválidos');
      }

      return { success: true };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha no login';
      return { success: false, message: errorMessage };
    }
  },

  uploadProfilePhoto: async (email: string, photoUri: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};

      if (!users[email]) {
        // Create entry for default test user if it doesn't exist
        users[email] = {};
      }

      users[email].profilePhoto = photoUri;
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

      return { success: true, message: 'Foto de perfil salva com sucesso' };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha ao salvar foto';
      return { success: false, message: errorMessage };
    }
  },

  getProfilePhoto: async (email: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};

      const photoUri = users[email]?.profilePhoto || null;
      return { success: true, photoUri };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha ao carregar foto';
      return { success: false, photoUri: null, message: errorMessage };
    }
  },

  getProfile: async (email: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      const profile = users[email]?.profile || {};
      return { success: true, profile };
    } catch (e: unknown) {
      return { success: false, message: 'Falha ao carregar perfil', profile: {} };
    }
  },

  updateProfile: async (email: string, profileData: ProfileData): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      if (!users[email]) users[email] = {};
      
      users[email].profile = { ...users[email].profile, ...profileData };
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      
      return { success: true, message: 'Perfil atualizado' };
    } catch (e: unknown) {
      return { success: false, message: 'Falha ao atualizar perfil' };
    }
  },

  getPoints: async (email: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      const points = users[email]?.points || 0;
      return { success: true, points };
    } catch (e: unknown) {
      return { success: false, points: 0 };
    }
  },

  updatePoints: async (email: string, points: number): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      if (!users[email]) users[email] = {};
      
      users[email].points = points;
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      
      return { success: true };
    } catch (e: unknown) {
      return { success: false };
    }
  },

  getCompletedChallenges: async (email: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      const completedChallenges = users[email]?.completedChallenges || [];
      return { success: true, completedChallenges };
    } catch (e: unknown) {
      return { success: false, completedChallenges: [] };
    }
  },

  completeChallenge: async (email: string, challengeId: string): Promise<ApiResponse> => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      if (!users[email]) users[email] = {};
      
      const completed = users[email].completedChallenges || [];
      if (!completed.includes(challengeId)) {
        completed.push(challengeId);
      }
      users[email].completedChallenges = completed;
      
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      return { success: true };
    } catch (e: unknown) {
      return { success: false };
    }
  }
};
