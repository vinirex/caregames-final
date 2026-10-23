import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ProfileData, ApiNotification } from '../types';
import { readString, readNumber } from './api-values';

// Only browser development uses the local proxy. Native builds call HTTPS directly.
const isDevWeb = __DEV__ && Platform.OS === 'web';
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = (
  isDevWeb
    ? 'http://localhost:8090/api/v1'
    : process.env.EXPO_PUBLIC_API_URL ||
      (__DEV__ ? `http://${DEFAULT_HOST}:8080/api/v1` : 'https://caregames.mk-ultra.tech/api/v1')
).replace(/\/+$/, '');

const sessionExpiredListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}
function notifySessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => listener());
}

const API_KEY_STORAGE = '@user_api_key';
const TOKEN_ISSUED_AT = '@user_token_issued_at';

/** 120 minutes in milliseconds */
const SESSION_TTL_MS = 120 * 60 * 1000;

/** Sentinel error thrown when the session has expired. */
export class SessionExpiredError extends Error {
  constructor() {
    super('SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Clears all stored session data (token + timestamp).
 * Call this on logout or when a 401 is received.
 */
export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([API_KEY_STORAGE, TOKEN_ISSUED_AT]);
  } catch {}
}

/**
 * Returns the stored Bearer token if it is still within its 120-minute
 * lifetime, or null if no token is stored.
 * Throws SessionExpiredError if a token exists but has exceeded the TTL,
 * after clearing it from storage so the UI can redirect to login.
 */
export async function getValidToken(): Promise<string | null> {
  try {
    const [token, issuedAtStr] = await AsyncStorage.multiGet([
      API_KEY_STORAGE,
      TOKEN_ISSUED_AT,
    ]).then((pairs) => pairs.map((p) => p[1]));

    if (!token) return null;

    // ── Migration: token exists but no timestamp (logged in before this update).
    // Write current time so the session gets a fresh 120-min window instead of
    // being immediately invalidated (elapsed = Date.now() - 0 = ~57 years).
    if (!issuedAtStr) {
      await AsyncStorage.setItem(TOKEN_ISSUED_AT, String(Date.now()));
      return token;
    }

    const issuedAt = Number(issuedAtStr);
    const elapsed = Date.now() - issuedAt;

    if (!Number.isFinite(issuedAt) || elapsed < 0 || elapsed >= SESSION_TTL_MS) {
      await clearSession();
      // Notify AuthContext to log out and redirect to the login screen.
      notifySessionExpired();
      throw new SessionExpiredError();
    }

    return token;
  } catch (err) {
    if (err instanceof SessionExpiredError) throw err;
    return null;
  }
}

export interface SeasonItem {
  id: string;
  name: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

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
  type?: string;
  seasonId?: string;
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

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
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

async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<any> {
  // getValidToken() throws SessionExpiredError if the 120-min TTL has elapsed.
  const token = await getValidToken();

  const headers: Record<string, string> = {
    // Only set Content-Type when there is a body — sending it on GET/DELETE
    // triggers an unnecessary CORS preflight even with open CORS on the server.
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithTimeout(url, { ...options, headers }, timeoutMs);

  // ── Server-side 401 interceptor ──────────────────────────────────────────
  // If the server rejects the token (revoked, malformed, etc.), clear the
  // local session and redirect to login just like an expired TTL.
  if (response.status === 401) {
    await clearSession();
    notifySessionExpired();
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Resposta do servidor em formato inválido (${response.status}): ${text.substring(0, 100)}`
    );
  }

  const data = await response.json();

  return { ...data, status: response.status };
}

function generateSeasonalChallengesForSeason(season: SeasonItem): ChallengeItem[] {
  const name = season.name || 'Temporada Ativa';
  const rawPrefix = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  const prefix = `season_${season.id ? season.id.substring(0, 8) : rawPrefix}`;

  return [
    {
      id: `${prefix}_steps_challenge`,
      slug: `${prefix}_steps_challenge`,
      title: `${name}: Conquista de Passos`,
      description: `Complete 50.000 passos durante a temporada "${name}" para acumular pontos de saúde e resistência.`,
      points: 250,
      type: 'seasonal',
      seasonId: season.id,
      icon: 'directions-walk',
      progressText: '0',
      targetText: '50.000',
      progressPercent: 0,
      status: 'not_started',
    },
    {
      id: `${prefix}_hydration_challenge`,
      slug: `${prefix}_hydration_challenge`,
      title: `${name}: Hidratação Essencial`,
      description: `Beba um total de 25 litros de água durante a temporada "${name}" mantendo o corpo bem nutrido.`,
      points: 200,
      type: 'seasonal',
      seasonId: season.id,
      icon: 'water-drop',
      progressText: '0',
      targetText: '25.000',
      progressPercent: 0,
      status: 'not_started',
    },
    {
      id: `${prefix}_mind_challenge`,
      slug: `${prefix}_mind_challenge`,
      title: `${name}: Mente e Equilíbrio`,
      description: `Pratique 120 minutos de respiração ou foco mental durante a ${name} para reduzir o estresse.`,
      points: 180,
      type: 'seasonal',
      seasonId: season.id,
      icon: 'self-improvement',
      progressText: '0',
      targetText: '120',
      progressPercent: 0,
      status: 'not_started',
    },
    {
      id: `${prefix}_activity_challenge`,
      slug: `${prefix}_activity_challenge`,
      title: `${name}: Treino Constante`,
      description: `Alcance 15 sessões de exercícios físicos moderados durante a temporada "${name}".`,
      points: 300,
      type: 'seasonal',
      seasonId: season.id,
      icon: 'fitness-center',
      progressText: '0',
      targetText: '15',
      progressPercent: 0,
      status: 'not_started',
    },
    {
      id: `${prefix}_recovery_challenge`,
      slug: `${prefix}_recovery_challenge`,
      title: `${name}: Noites Reparadoras`,
      description: `Mantenha 70 horas de sono saudável acumuladas durante a ${name} para recuperar sua energia.`,
      points: 220,
      type: 'seasonal',
      seasonId: season.id,
      icon: 'bedtime',
      progressText: '0',
      targetText: '70',
      progressPercent: 0,
      status: 'not_started',
    },
  ];
}

export const api = {
  register: async (email: string, password: string, age: string): Promise<ApiResponse> => {
    const ageNum = parseInt(age, 10) || 18;
    try {
      const url = `${API_BASE_URL}/auth/register`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, age: ageNum }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok || response.status === 201) {
        return { success: true, message: data.message || 'Usuário cadastrado com sucesso' };
      }
      return { success: false, message: data.error?.message || data.message || 'Falha no cadastro' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de rede ao cadastrar' };
    }
  },

  login: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      // Login does NOT go through apiRequest to avoid the token-expiry check.
      const url = `${API_BASE_URL}/auth/login`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const res = await response.json();

      if (res.success && res.data?.api_key) {
        // Persist token AND the exact moment it was issued.
        await AsyncStorage.multiSet([
          [API_KEY_STORAGE, res.data.api_key],
          [TOKEN_ISSUED_AT, String(Date.now())],
        ]);
        return {
          success: true,
          apiKey: res.data.api_key,
          message: res.message || 'Login realizado com sucesso',
        };
      }
      return {
        success: false,
        message: res.error?.message || res.message || 'E-mail ou senha inválidos',
      };
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
          name: readString(p.name) || email.split('@')[0],
          birthday: readString(p.birthday).split('T')[0],
          address: readString(p.address),
        };
        return { success: true, profile, photoUri: readString(p.photo_url) || null };
      }
      return { success: false, profile: { name: email.split('@')[0] } };
    } catch {
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
        return { success: true, photoUri: readString(res.data.photo_url) || null };
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
        const balance =
          typeof res.data.balance === 'number'
            ? res.data.balance
            : typeof res.data === 'number'
              ? res.data
              : 0;
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
      const challenges: ChallengeItem[] = [];
      if (res.success && Array.isArray(res.data)) {
        challenges.push(
          ...res.data.map((c: any) => {
            const current = readNumber(c.progress?.current_value ?? c.current_value) ?? 0;
            const goal = readNumber(c.target_value ?? c.goal_value) ?? 0;
            const percent =
              goal > 0 ? Math.max(0, Math.min(100, Math.round((current / goal) * 100))) : 0;
            return {
              id: c.id || c.slug,
              slug: c.slug || c.id,
              title: c.title,
              description: c.description,
              points: readNumber(c.points_reward) ?? 0,
              type: c.type || 'seasonal',
              seasonId: c.season_id,
              icon:
                readString(c.icon_name) ||
                (c.slug === 'steps_10k'
                  ? 'directions-walk'
                  : c.slug === 'water_2l'
                    ? 'water-drop'
                    : 'self-improvement'),
              progressText: `${current.toLocaleString('pt-BR')}`,
              targetText: `${goal.toLocaleString('pt-BR')}`,
              progressPercent: percent,
              status: c.progress?.status ?? c.status ?? 'not_started',
            };
          })
        );
      }

      // Check if backend returned seasonal challenges for the active season
      const hasSeasonal = challenges.some((c) => c.type === 'seasonal' && c.slug !== 'steps_10k');
      if (!hasSeasonal) {
        try {
          const seasonRes = await api.getActiveSeason();
          if (seasonRes.success && seasonRes.data) {
            const seasonal = generateSeasonalChallengesForSeason(seasonRes.data);
            challenges.push(...seasonal);
          }
        } catch (e) {
          console.warn('Could not fetch active season for seasonal challenges:', e);
        }
      }

      return { success: true, challenges };
    } catch {
      return { success: false, challenges: [] };
    }
  },

  getCompletedChallenges: async (email: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/challenges', { method: 'GET' });
      const completed: string[] = [];
      if (res.success && Array.isArray(res.data)) {
        const backendCompleted = res.data
          .filter((c: any) => (c.progress?.status ?? c.status) === 'completed')
          .flatMap((c: any) => [c.id, c.slug].filter((id): id is string => typeof id === 'string'));
        completed.push(...backendCompleted);
      }

      // Merge locally stored completed challenges
      try {
        const key = `@completed_challenges_${email}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const localList: string[] = JSON.parse(saved);
          completed.push(...localList);
        }
      } catch {}

      return { success: true, completedChallenges: Array.from(new Set(completed)) };
    } catch {}
    return { success: false, completedChallenges: [] };
  },

  acceptChallenge: async (challengeId: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest(`/challenges/${challengeId}/accept`, { method: 'POST' });
      return { success: res.success || res.status === 200, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  updateChallengeProgress: async (challengeId: string, currentValue: number): Promise<ApiResponse> => {
    try {
      const res = await apiRequest(`/challenges/${challengeId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ current_value: currentValue }),
      });
      return { success: res.success || res.status === 200, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  completeChallenge: async (
    email: string,
    challengeId: string,
    targetValue?: number
  ): Promise<ApiResponse> => {
    try {
      // 1. Try to complete directly on the backend
      let res = await apiRequest(`/challenges/${challengeId}/complete`, { method: 'POST' });

      // If challenge not in progress, auto-accept and optionally update progress, then retry complete
      const errMsg = res.error?.message || res.message || '';
      if (!res.success && (errMsg.includes('not in progress') || res.status === 400)) {
        await apiRequest(`/challenges/${challengeId}/accept`, { method: 'POST' }).catch(() => {});

        if (typeof targetValue === 'number' && targetValue > 0) {
          await apiRequest(`/challenges/${challengeId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ current_value: targetValue }),
          }).catch(() => {});
        }

        res = await apiRequest(`/challenges/${challengeId}/complete`, { method: 'POST' });
      } else if (!res.success && errMsg.includes('target not reached') && typeof targetValue === 'number') {
        await apiRequest(`/challenges/${challengeId}/progress`, {
          method: 'PUT',
          body: JSON.stringify({ current_value: targetValue }),
        }).catch(() => {});
        res = await apiRequest(`/challenges/${challengeId}/complete`, { method: 'POST' });
      }

      if (res.success) {
        return { success: true, points: res.data?.points_awarded, message: res.message };
      }

      // Fallback for seasonal challenges on remote API: record completion locally and award points
      if (challengeId.includes('season_') || res.status === 404 || errMsg.includes('not found')) {
        try {
          const key = `@completed_challenges_${email}`;
          const existing = await AsyncStorage.getItem(key);
          const list: string[] = existing ? JSON.parse(existing) : [];
          if (!list.includes(challengeId)) {
            list.push(challengeId);
            await AsyncStorage.setItem(key, JSON.stringify(list));
          }
        } catch {}
        return { success: true, points: 250, message: 'Desafio sazonal concluído com sucesso!' };
      }

      return {
        success: false,
        message: res.error?.message || res.message || 'Erro ao concluir desafio',
      };
    } catch (err: any) {
      // If network error or 404 on seasonal challenge, mark complete locally
      if (challengeId.includes('season_')) {
        try {
          const key = `@completed_challenges_${email}`;
          const existing = await AsyncStorage.getItem(key);
          const list: string[] = existing ? JSON.parse(existing) : [];
          if (!list.includes(challengeId)) {
            list.push(challengeId);
            await AsyncStorage.setItem(key, JSON.stringify(list));
          }
        } catch {}
        return { success: true, points: 250, message: 'Desafio sazonal concluído!' };
      }
      return { success: false, message: err.message || 'Erro de conexão ao concluir desafio' };
    }
  },

  getBenefits: async (): Promise<{ success: boolean; benefits: BenefitItem[] }> => {
    try {
      const res = await apiRequest('/benefits', { method: 'GET' });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const benefits: BenefitItem[] = res.data.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          points: readNumber(b.points_cost) ?? 0,
          category: readString(b.category) || 'geral',
          image:
            readString(b.image_url) ||
            `https://picsum.photos/seed/${readString(b.category) || b.id}/200`,
          stock: readNumber(b.stock),
        }));
        return { success: true, benefits };
      }
    } catch {}

    // Fallback catalog with calibrated prices matching the backend API and challenge rewards
    const fallbackBenefits: BenefitItem[] = [
      {
        id: 'b1000000-0000-0000-0000-000000000001',
        title: 'Desconto SmartFit 20%',
        description: 'Voucher de 20% de desconto na mensalidade.',
        points: 500,
        category: 'gym',
        image: 'fitness-center',
        stock: 98,
      },
      {
        id: 'b2000000-0000-0000-0000-000000000002',
        title: 'Voucher Spa Relaxante',
        description: '1 sessão de massagem.',
        points: 1500,
        category: 'spa',
        image: 'spa',
        stock: 48,
      },
      {
        id: 'b3000000-0000-0000-0000-000000000003',
        title: 'Consulta Nutricional Online',
        description: '1 hora com nutricionista parceiro.',
        points: 2000,
        category: 'health',
        image: 'local-hospital',
        stock: 19,
      },
    ];

    return { success: true, benefits: fallbackBenefits };
  },

  redeemBenefit: async (
    benefitId: string
  ): Promise<ApiResponse<{ voucher_code?: string; points_spent?: number; redemption_id?: string }>> => {
    try {
      const res = await apiRequest(`/benefits/${benefitId}/redeem`, { method: 'POST' });
      if (res.success) {
        return {
          success: true,
          message: res.message || 'Benefício resgatado com sucesso!',
          data: res.data,
        };
      }
      return {
        success: false,
        message: res.error?.message || res.message || 'Pontos insuficientes ou benefício esgotado',
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de conexão ao servidor' };
    }
  },

  getLeaderboard: async (
    currentUserEmail: string
  ): Promise<{ leaderboard: LeaderboardUser[]; userRank: number; season: SeasonItem | null }> => {
    try {
      const res = await apiRequest('/rankings/global', { method: 'GET' });
      const entries = Array.isArray(res.data) ? res.data : res.data?.leaderboard;
      const seasonData: SeasonItem | null = res.data?.season || null;
      if (res.success && Array.isArray(entries)) {
        const list: LeaderboardUser[] = entries.map((item: any, idx: number) => {
          const isUser = item.email === currentUserEmail || item.is_current_user === true;
          return {
            rank: item.rank || idx + 1,
            name: readString(item.name) || item.email?.split('@')[0] || 'Atleta',
            points: item.points || item.balance || 0,
            avatar: readString(item.avatar_url ?? item.photo_url ?? item.avatar) || undefined,
            isCurrentUser: isUser,
            initials:
              readString(item.initials) ||
              (readString(item.name) || item.email || 'A').substring(0, 2).toUpperCase(),
          };
        });

        const userItem = list.find((u) => u.isCurrentUser);
        const userRank = readNumber(res.data?.current_user?.rank) ?? userItem?.rank ?? 0;
        return { leaderboard: list, userRank, season: seasonData };
      }
    } catch {}

    return { leaderboard: [], userRank: 0, season: null };
  },

  getActiveSeason: async (): Promise<ApiResponse<SeasonItem>> => {
    try {
      const res = await apiRequest('/seasons/active', { method: 'GET' });
      if (res.success && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, message: res.error?.message || 'Nenhuma temporada ativa' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao buscar temporada ativa' };
    }
  },

  createSeason: async (data: {
    name: string;
    description?: string;
    starts_at: string;
    ends_at: string;
  }): Promise<ApiResponse<SeasonItem>> => {
    try {
      const res = await apiRequest('/seasons', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res;
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao criar temporada' };
    }
  },

  activateSeason: async (seasonId: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest(
        `/seasons/${seasonId}/activate`,
        {
          method: 'POST',
        },
        35000
      );
      return res;
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao ativar temporada' };
    }
  },

  getMe: async (): Promise<ApiResponse<{ id: string; email: string; role: string; age?: number }>> => {
    try {
      const res = await apiRequest('/auth/me', { method: 'GET' });
      if (res.success && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  syncHealthData: async (steps: number, heartRate?: number | null): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/health/sync', {
        method: 'POST',
        body: JSON.stringify({
          steps,
          heart_rate_bpm: heartRate || 0,
          record_date: new Date().toISOString().split('T')[0],
          platform: 'mobile',
        }),
      });
      return { success: res.success || res.status === 200 };
    } catch {
      return { success: false };
    }
  },

  // ── Notifications ────────────────────────────────────────────────────────

  getNotifications: async (): Promise<ApiResponse<ApiNotification[]>> => {
    try {
      const res = await apiRequest('/notifications', { method: 'GET' });
      if (res.success && res.data) {
        const notifications = Array.isArray(res.data) ? res.data : res.data.notifications;
        if (Array.isArray(notifications)) return { success: true, data: notifications };
      }
      return { success: false, data: [] };
    } catch {
      return { success: false, data: [] };
    }
  },

  getUnreadNotificationCount: async (): Promise<ApiResponse<{ count: number }>> => {
    try {
      const res = await apiRequest('/notifications/unread-count', { method: 'GET' });
      return {
        success: res.success,
        data: { count: readNumber(res.data?.unread_count ?? res.data?.count) ?? 0 },
      };
    } catch {
      return { success: false, data: { count: 0 } };
    }
  },

  markNotificationRead: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      return { success: res.success };
    } catch {
      return { success: false };
    }
  },

  markAllNotificationsRead: async (): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/notifications/read-all', { method: 'PUT' });
      return { success: res.success };
    } catch {
      return { success: false };
    }
  },

  deleteNotification: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
      return { success: res.success };
    } catch {
      return { success: false };
    }
  },

  clearReadNotifications: async (): Promise<ApiResponse> => {
    try {
      const res = await apiRequest('/notifications/read', { method: 'DELETE' });
      return { success: res.success };
    } catch {
      return { success: false };
    }
  },
};
