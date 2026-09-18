import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ProfileData } from '../types';

const DB_USERS_KEY = '@dummy_db_users';

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  avatar?: string;
  isCurrentUser: boolean;
  initials?: string;
}

const DEFAULT_LEADERBOARD: Omit<LeaderboardUser, 'rank' | 'isCurrentUser'>[] = [
  { name: 'Alice Smith', points: 2450, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { name: 'Bob Johnson', points: 1980, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { name: 'Charlie Brown', points: 1620, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { name: 'Diana Prince', points: 1400, initials: 'DP' },
  { name: 'Ethan Hunt', points: 1310, initials: 'EH' },
  { name: 'Fiona Gallagher', points: 1100, initials: 'FG' },
  { name: 'George Clark', points: 950, initials: 'GC' },
  { name: 'Hannah Abbott', points: 820, initials: 'HA' },
];

async function getUsersDB() {
  try {
    const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    // Ensure default test user exists with initial points
    if (!users['test@test.com']) {
      users['test@test.com'] = {
        password: 'Test1234',
        age: '28',
        points: 1250,
        completedChallenges: [],
        profile: { name: 'test' }
      };
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    }
    return users;
  } catch (e) {
    console.error('Error reading users DB:', e);
    return {};
  }
}

export const api = {
  register: async (email: string, password: string, age: string): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      
      if (users[email]) {
        throw new Error('Usuário já cadastrado');
      }

      users[email] = {
        password,
        age,
        points: 1000,
        completedChallenges: [],
        profile: { name: email.split('@')[0] }
      };
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      
      return { success: true, message: 'Usuário cadastrado com sucesso' };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha no cadastro';
      return { success: false, message: errorMessage };
    }
  },
  
  login: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();

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
      const users = await getUsersDB();

      if (!users[email]) {
        users[email] = { points: 1000, completedChallenges: [] };
      }

      users[email].profilePhoto = photoUri;
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

      return { success: true, message: 'Foto de perfil salva com sucesso' };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha ao salvar foto';
      return { success: false, photoUri: null, message: errorMessage };
    }
  },

  getProfilePhoto: async (email: string): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      const photoUri = users[email]?.profilePhoto || null;
      return { success: true, photoUri };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha ao carregar foto';
      return { success: false, photoUri: null, message: errorMessage };
    }
  },

  getProfile: async (email: string): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      const profile = users[email]?.profile || { name: email.split('@')[0] };
      return { success: true, profile };
    } catch (e: unknown) {
      return { success: false, message: 'Falha ao carregar perfil', profile: {} };
    }
  },

  updateProfile: async (email: string, profileData: ProfileData): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      if (!users[email]) users[email] = { points: 1000, completedChallenges: [] };
      
      users[email].profile = { ...users[email].profile, ...profileData };
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      
      return { success: true, message: 'Perfil atualizado' };
    } catch (e: unknown) {
      return { success: false, message: 'Falha ao atualizar perfil' };
    }
  },

  getPoints: async (email: string): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      const points = users[email]?.points ?? 1250;
      return { success: true, points };
    } catch (e: unknown) {
      return { success: false, points: 1250 };
    }
  },

  updatePoints: async (email: string, points: number): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      if (!users[email]) users[email] = { completedChallenges: [] };
      
      users[email].points = points;
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      
      return { success: true };
    } catch (e: unknown) {
      console.error('Error updating points:', e);
      return { success: false };
    }
  },

  getCompletedChallenges: async (email: string): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      const completedChallenges = users[email]?.completedChallenges || [];
      return { success: true, completedChallenges };
    } catch (e: unknown) {
      return { success: false, completedChallenges: [] };
    }
  },

  completeChallenge: async (email: string, challengeId: string): Promise<ApiResponse> => {
    try {
      const users = await getUsersDB();
      if (!users[email]) users[email] = { points: 1250, completedChallenges: [] };
      
      const completed: string[] = users[email].completedChallenges || [];
      if (!completed.includes(challengeId)) {
        completed.push(challengeId);
      }
      users[email].completedChallenges = completed;
      
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      return { success: true, completedChallenges: completed };
    } catch (e: unknown) {
      return { success: false };
    }
  },

  getLeaderboard: async (currentUserEmail: string): Promise<{ leaderboard: LeaderboardUser[]; userRank: number }> => {
    try {
      const users = await getUsersDB();
      const userObj = users[currentUserEmail];
      const userPoints = userObj?.points ?? 1250;
      const userName = userObj?.profile?.name || currentUserEmail.split('@')[0] || 'Usuário';
      const userAvatar = userObj?.profilePhoto;

      const allList: { name: string; points: number; avatar?: string; initials?: string; isCurrentUser: boolean }[] = [
        ...DEFAULT_LEADERBOARD.map(u => ({ ...u, isCurrentUser: false })),
        { name: `${userName} (You)`, points: userPoints, avatar: userAvatar, isCurrentUser: true }
      ];

      // Sort by points descending
      allList.sort((a, b) => b.points - a.points);

      const leaderboardWithRank: LeaderboardUser[] = allList.map((item, index) => ({
        ...item,
        rank: index + 1
      }));

      const currentUserItem = leaderboardWithRank.find(item => item.isCurrentUser);
      const userRank = currentUserItem ? currentUserItem.rank : 4;

      return { leaderboard: leaderboardWithRank, userRank };
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
      return {
        leaderboard: DEFAULT_LEADERBOARD.map((item, index) => ({ ...item, rank: index + 1, isCurrentUser: false })),
        userRank: 4
      };
    }
  }
};
