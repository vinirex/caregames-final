import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ProfileData } from '../types';

// NOTE: 10.0.2.2 is the Android Emulator alias for the host machine.
// On a real physical device, EXPO_PUBLIC_API_URL MUST be set to your server's
// public IP or domain (e.g. http://192.168.1.100:8080/api/v1) at build time.
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:8080/api/v1`;

const API_KEY_STORAGE = '@user_api_key';

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  avatar?: string;
  isCurrentUser: boolean;
  initials?: string;
}

export interface ChallengeItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  progressText: string;
  targetText: string;
  progressPercent: number;
  status: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  image: string;
  stock?: number;
}

async function getStoredApiKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<any> {
  const apiKey = await getStoredApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithTimeout(url, { ...options, headers });
  
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Resposta do servidor em formato inválido (${response.status}): ${text.substring(0, 100)}`);
  }

  const data = await response.json();
  return { status: response.status, ...data };
}

export const api = {
  register: async (email: string, password: string, age: string): Promise<ApiResponse> => {
    const ageNum = parseInt(age, 10) || 18;
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, age: ageNum }),
      });

      if (res.success || res.status === 201) {
        return { success: true, message: res.message || 'Usuário cadastrado com sucesso' };
      }
      return { success: false, message: res.error?.message || res.message || 'Falha no cadastro' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de rede ao cadastrar' };
    }
  },

  login: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data?.api_key) {
        await AsyncStorage.setItem(API_KEY_STORAGE, res.data.api_key);
        return {
          success: true,
          apiKey: res.data.api_key,
          message: res.message || 'Login realizado com sucesso',
        };
      }
      return { success: false, message: res.error?.message || res.message || 'E-mail ou senha inválidos' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de conexão ao servidor backend' };
    }
  },

  getProfile: async (email: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/profile', { method: 'GET' });
      if (res.success && res.data) {
        const p = res.data;
        const profile: ProfileData = {
          name: p.name || email.split('@')[0],
          birthday: p.birthday ? p.birthday.split('T')[0] : '',
          address: p.address || '',
        };
        return { success: true, profile, photoUri: p.photo_url || null };
      }
      return { success: false, profile: { name: email.split('@')[0] } };
    } catch (err) {
      return { success: false, profile: { name: email.split('@')[0] } };
    }
  },

  updateProfile: async (email: string, profileData: ProfileData): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileData.name || '',
          birthday: profileData.birthday || '',
          address: profileData.address || '',
        }),
      });
      if (res.success) {
        return { success: true, message: 'Perfil atualizado com sucesso' };
      }
      return { success: false, message: res.error?.message || 'Falha ao atualizar perfil' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao conectar ao servidor' };
    }
  },

  getProfilePhoto: async (email: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/profile', { method: 'GET' });
      if (res.success && res.data?.photo_url) {
        return { success: true, photoUri: res.data.photo_url };
      }
    } catch {}
    return { success: false, photoUri: null };
  },

  uploadProfilePhoto: async (email: string, photoUri: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({ photo_url: photoUri }),
      });
      return { success: res.success, photoUri, message: res.message || 'Foto atualizada' };
    } catch (err: any) {
      return { success: false, photoUri: null, message: err.message };
    }
  },

  getPoints: async (email: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/points', { method: 'GET' });
      if (res.success && res.data) {
        const balance = typeof res.data.balance === 'number' ? res.data.balance : (typeof res.data === 'number' ? res.data : 0);
        return { success: true, points: balance };
      }
    } catch {}
    return { success: false, points: 0 };
  },

  updatePoints: async (email: string, points: number): Promise<ApiResponse> => {
    // Points are managed by backend transaction actions
    return { success: true };
  },

  spendPoints: async (amount: number, reason: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/points/spend', {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      if (res.success) {
        return { success: true, points: res.data?.new_balance };
      }
      return { success: false, message: res.error?.message || 'Pontos insuficientes' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de conexão ao backend' };
    }
  },

  getChallenges: async (): Promise<{ success: boolean; challenges: ChallengeItem[] }> => {
    try {
      const res = await apiRequest('/challenges', { method: 'GET' });
      if (res.success && Array.isArray(res.data)) {
        const challenges: ChallengeItem[] = res.data.map((c: any) => {
          const current = c.current_value || 0;
          const goal = c.goal_value || 100;
          const percent = Math.min(100, Math.round((current / goal) * 100));
          return {
            id: c.id || c.slug,
            slug: c.slug || c.id,
            title: c.title,
            description: c.description,
            points: c.points_reward || 50,
            icon: c.icon_name || (c.slug === 'steps_10k' ? 'directions-walk' : c.slug === 'water_2l' ? 'water-drop' : 'self-improvement'),
            progressText: `${current.toLocaleString('pt-BR')}`,
            targetText: `${goal.toLocaleString('pt-BR')}`,
            progressPercent: percent,
            status: c.status || 'not_started',
          };
        });
        return { success: true, challenges };
      }
    } catch {}
    return { success: false, challenges: [] };
  },

  getCompletedChallenges: async (email: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/challenges', { method: 'GET' });
      if (res.success && Array.isArray(res.data)) {
        const completed = res.data
          .filter((c: any) => c.status === 'completed')
          .map((c: any) => c.id || c.slug);
        return { success: true, completedChallenges: completed };
      }
    } catch {}
    return { success: false, completedChallenges: [] };
  },

  completeChallenge: async (email: string, challengeId: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest(`/challenges/${challengeId}/complete`, { method: 'POST' });
      if (res.success) {
        return { success: true, points: res.data?.points_awarded };
      }
      return { success: false, message: res.error?.message || 'Erro ao concluir desafio' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  getBenefits: async (): Promise<{ success: boolean; benefits: BenefitItem[] }> => {
    try {
      const res = await apiRequest('/benefits', { method: 'GET' });
      if (res.success && Array.isArray(res.data)) {
        const benefits: BenefitItem[] = res.data.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          points: b.points_cost || 500,
          category: b.category || 'geral',
          image: b.image_url || `https://picsum.photos/seed/${b.category || b.id}/200`,
          stock: b.stock,
        }));
        return { success: true, benefits };
      }
    } catch {}
    return { success: false, benefits: [] };
  },

  redeemBenefit: async (benefitId: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest(`/benefits/${benefitId}/redeem`, { method: 'POST' });
      if (res.success) {
        return { success: true, message: res.message || 'Benefício resgatado com sucesso' };
      }
      return { success: false, message: res.error?.message || 'Pontos insuficientes ou benefício esgotado' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de conexão' };
    }
  },

  getLeaderboard: async (currentUserEmail: string): Promise<{ leaderboard: LeaderboardUser[]; userRank: number }> => {
    try {
      const res = await apiRequest('/rankings/global', { method: 'GET' });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const list: LeaderboardUser[] = res.data.map((item: any, idx: number) => {
          const isUser = item.email === currentUserEmail || item.is_current_user === true;
          return {
            rank: item.rank || idx + 1,
            name: item.name || item.email?.split('@')[0] || 'Atleta',
            points: item.points || item.balance || 0,
            avatar: item.photo_url || item.avatar,
            isCurrentUser: isUser,
            initials: (item.name || item.email || 'A').substring(0, 2).toUpperCase(),
          };
        });

        const userItem = list.find(u => u.isCurrentUser);
        const userRank = userItem ? userItem.rank : 1;
        return { leaderboard: list, userRank };
      }
    } catch {}

    return { leaderboard: [], userRank: 1 };
  },

  syncHealthData: async (steps: number, heartRate?: number | null): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/health/sync', {
        method: 'POST',
        body: JSON.stringify({
          steps,
          heart_rate: heartRate || 0,
          sync_date: new Date().toISOString().split('T')[0],
        }),
      });
      return { success: res.success || res.status === 200 };
    } catch {
      return { success: false };
    }
  }
};
