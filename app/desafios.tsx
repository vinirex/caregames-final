import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import { useAuth } from '../context/AuthContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNav } from '../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, ChallengeItem } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { useHealthData } from '../hooks/useHealthData';

interface InAppToast {
  id: string;
  title: string;
  message: string;
  icon: keyof typeof MaterialIcons.glyphMap | string;
  iconColor: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function DesafiosScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points, refreshPoints } = usePoints();
  const { userEmail } = useAuth();
  const { addNotification, refresh: refreshNotifications } = useNotifications();
  const { steps, isConnected } = useHealthData();
  const activeEmail = userEmail || '';

  const currentStepCount = isConnected ? steps : 0;
  const stepGoal = 10000;
  const stepProgressPercent = Math.min(100, Math.round((currentStepCount / stepGoal) * 100));
  const canCompleteSteps = currentStepCount >= stepGoal;

  const [stepsChallenge, setStepsChallenge] = useState<ChallengeItem | null>(null);
  const [challengesList, setChallengesList] = useState<ChallengeItem[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // In-App Toast state & animation
  const [toast, setToast] = useState<InAppToast | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback(
    (
      title: string,
      message: string,
      icon: keyof typeof MaterialIcons.glyphMap | string = 'notifications',
      iconColor: string = '#00E5FF',
      type: 'success' | 'error' | 'warning' | 'info' = 'success'
    ) => {
      // 1. Add to global notifications context (for TopAppBar bell & history)
      addNotification(title, message, icon, iconColor);

      // 2. Clear any active toast timer
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      // 3. Set toast state and animate in
      setToast({
        id: Date.now().toString(),
        title,
        message,
        icon,
        iconColor,
        type,
      });

      Animated.spring(toastAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      // 4. Auto dismiss after 4 seconds
      toastTimeoutRef.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setToast(null);
        });
      }, 4000);
    },
    [addNotification, toastAnim]
  );

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [toastAnim]);

  const fetchChallengesData = useCallback(async () => {
    setLoading(true);
    const challengesRes = await api.getChallenges();
    if (challengesRes.success && challengesRes.challenges) {
      // Find the base daily steps challenge
      const foundSteps = challengesRes.challenges.find(
        (c) => c.slug === 'steps_10k' || c.id === 'steps_10k' || c.icon === 'directions-walk'
      );
      if (foundSteps) {
        setStepsChallenge(foundSteps);
      }

      // Filter out steps_10k from general list since it is rendered as the primary Base/Daily challenge
      const otherChallenges = challengesRes.challenges.filter(
        (c) => c.slug !== 'steps_10k' && c.id !== 'steps_10k' && c !== foundSteps
      );
      setChallengesList(otherChallenges);
    }

    if (activeEmail) {
      const res = await api.getCompletedChallenges(activeEmail);
      if (res.success && res.completedChallenges) {
        setCompletedIds(res.completedChallenges);
      }
    }
    setLoading(false);
  }, [activeEmail]);

  useEffect(() => {
    fetchChallengesData();
  }, [fetchChallengesData]);

  const isStepsDone =
    completedIds.includes('steps_10k') ||
    (stepsChallenge
      ? completedIds.includes(stepsChallenge.id) || stepsChallenge.status === 'completed'
      : false);

  const handleCompleteSteps = async () => {
    if (isStepsDone) {
      showNotification(
        'Desafio já concluído',
        'Você já recebeu os pontos do desafio de passos hoje.',
        'check-circle',
        '#94A3B8',
        'info'
      );
      return;
    }

    if (!canCompleteSteps) {
      showNotification(
        'Meta de passos não atingida 🏃‍♂️',
        `Você precisa atingir 10.000 passos no dia para concluir este desafio. Seu progresso atual é de ${currentStepCount.toLocaleString('pt-BR')} passos.`,
        'directions-walk',
        '#F59E0B',
        'warning'
      );
      return;
    }

    const targetChallengeId = stepsChallenge?.id || 'steps_10k';
    setCompletingId('steps_10k');

    try {
      // 1. Sync health data to record steps on the backend
      try {
        await api.syncHealthData(currentStepCount);
      } catch (e) {
        console.warn('Could not sync health data before completion:', e);
      }

      // 2. Call backend complete challenge API with target value
      const res = await api.completeChallenge(activeEmail, targetChallengeId, currentStepCount);
      if (res.success) {
        setCompletedIds((prev) => Array.from(new Set([...prev, 'steps_10k', targetChallengeId])));
        await refreshPoints();
        await refreshNotifications().catch(() => {});
        showNotification(
          'Desafio de Passos Concluído! 🎉',
          `Parabéns! Você atingiu 10.000 passos e ganhou +${res.points || stepsChallenge?.points || 100} PTS!`,
          'directions-walk',
          '#00E5FF',
          'success'
        );
        fetchChallengesData();
      } else {
        showNotification(
          'Erro ao Concluir',
          res.message || 'Não foi possível concluir o desafio de passos.',
          'error-outline',
          '#EF4444',
          'error'
        );
      }
    } catch (err: any) {
      showNotification(
        'Erro de Conexão',
        err.message || 'Erro inesperado ao conectar ao servidor.',
        'wifi-off',
        '#EF4444',
        'error'
      );
    } finally {
      setCompletingId(null);
    }
  };

  const handleCompleteOther = async (challenge: ChallengeItem) => {
    const isDone =
      completedIds.includes(challenge.id) ||
      completedIds.includes(challenge.slug) ||
      challenge.status === 'completed';

    if (isDone) {
      showNotification(
        'Desafio já concluído',
        `Você já recebeu os pontos do desafio "${challenge.title}".`,
        'check-circle',
        '#94A3B8',
        'info'
      );
      return;
    }

    setCompletingId(challenge.id);
    try {
      // Parse numerical target from targetText or default to 100
      const parsedTarget = parseFloat(challenge.targetText.replace(/\D/g, '')) || 100;
      const res = await api.completeChallenge(activeEmail, challenge.id, parsedTarget);

      if (res.success) {
        setCompletedIds((prev) => Array.from(new Set([...prev, challenge.id, challenge.slug])));
        await refreshPoints();
        await refreshNotifications().catch(() => {});
        showNotification(
          'Desafio Concluído! 🎉',
          `Parabéns! Você ganhou +${res.points || challenge.points} PTS por concluir "${challenge.title}".`,
          (challenge.icon as any) || 'emoji-events',
          '#FBBF24',
          'success'
        );
        fetchChallengesData();
      } else {
        showNotification(
          'Erro ao Concluir',
          res.message || 'Não foi possível concluir o desafio.',
          'error-outline',
          '#EF4444',
          'error'
        );
      }
    } catch (err: any) {
      showNotification(
        'Erro de Conexão',
        err.message || 'Erro inesperado ao conectar ao servidor.',
        'wifi-off',
        '#EF4444',
        'error'
      );
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-background' : 'bg-slate-100'}`}>
      <TopAppBar title="Care Games +" />

      {/* FLOATING IN-APP NOTIFICATION TOAST */}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + 68,
            left: 16,
            right: 16,
            zIndex: 9999,
            elevation: 10,
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
              {
                scale: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={dismissToast}
            className={`p-4 rounded-2xl flex-row items-center border shadow-xl ${
              theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'
            } ${
              toast.type === 'success'
                ? 'border-emerald-500/60 shadow-emerald-500/20'
                : toast.type === 'warning'
                ? 'border-amber-500/60 shadow-amber-500/20'
                : toast.type === 'error'
                ? 'border-rose-500/60 shadow-rose-500/20'
                : 'border-cyan-500/60 shadow-cyan-500/20'
            }`}
          >
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3 border"
              style={{
                backgroundColor: `${toast.iconColor}1A`,
                borderColor: `${toast.iconColor}40`,
              }}
            >
              <MaterialIcons
                name={toast.icon as any}
                size={24}
                color={toast.iconColor}
              />
            </View>

            <View className="flex-1 pr-2">
              <Text
                className={`font-sora font-bold text-sm mb-0.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
                numberOfLines={1}
              >
                {toast.title}
              </Text>
              <Text
                className={`font-hanken text-xs leading-4 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}
                numberOfLines={3}
              >
                {toast.message}
              </Text>
            </View>

            <TouchableOpacity
              onPress={dismissToast}
              className="p-1 rounded-full active:opacity-60"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="close"
                size={18}
                color={theme === 'dark' ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom, paddingTop: 24 }}
        className="flex-1 px-5"
      >
        {/* Header */}
        <View className="mb-6 flex-row justify-between items-start">
          <View className="flex-col flex-1">
            <Text
              className={`font-sora text-3xl font-bold tracking-tight mb-1 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Desafios Ativos
            </Text>
            <Text
              className={`font-hanken text-base ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Conclua tarefas diárias para ganhar pontos e subir no ranking.
            </Text>
          </View>

          <View
            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
              theme === 'dark'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-amber-100 border-amber-300'
            }`}
          >
            <MaterialIcons
              name="stars"
              size={18}
              color={theme === 'dark' ? '#FBBF24' : '#D97706'}
            />
            <Text
              className={`font-jetbrains text-sm uppercase font-bold ${
                theme === 'dark' ? 'text-amber-400' : 'text-amber-800'
              }`}
            >
              {points} PTS
            </Text>
          </View>
        </View>

        {/* 1. BASE / DAILY STEPS CHALLENGE */}
        <View className="mb-6">
          <Text
            className={`font-jetbrains text-xs uppercase font-bold tracking-wider mb-3 ${
              theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
            }`}
          >
            DESAFIO DIÁRIO BASE
          </Text>

          <View
            className={`rounded-2xl p-5 border flex-col gap-4 ${
              isStepsDone
                ? theme === 'dark'
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-50 border-slate-200 opacity-60'
                : theme === 'dark'
                ? 'bg-slate-900/90 border-cyan-500/30 shadow-lg'
                : 'bg-white border-cyan-200 shadow-sm'
            }`}
          >
            <View>
              <View className="flex-row justify-between items-start mb-3">
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center border ${
                    theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-100'
                  }`}
                >
                  <MaterialIcons
                    name="directions-walk"
                    size={28}
                    color={isStepsDone ? '#94A3B8' : theme === 'dark' ? '#00E5FF' : '#0284C7'}
                  />
                </View>

                <View
                  className={`px-2.5 py-1.5 rounded-lg flex-row items-center gap-1 border ${
                    isStepsDone
                      ? theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-slate-100 border-slate-200'
                      : theme === 'dark'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <MaterialIcons
                    name={isStepsDone ? 'check' : 'stars'}
                    size={14}
                    color={isStepsDone ? '#94A3B8' : theme === 'dark' ? '#FBBF24' : '#D97706'}
                  />
                  <Text
                    className={`font-jetbrains text-[11px] uppercase font-bold ${
                      isStepsDone
                        ? 'text-slate-500'
                        : theme === 'dark'
                        ? 'text-amber-400'
                        : 'text-amber-800'
                    }`}
                  >
                    {isStepsDone ? 'Concluído' : `+${stepsChallenge?.points || 100} pts`}
                  </Text>
                </View>
              </View>

              <Text
                className={`font-sora font-bold text-xl mb-1 ${
                  isStepsDone
                    ? 'text-slate-400 line-through'
                    : theme === 'dark'
                    ? 'text-white'
                    : 'text-slate-900'
                }`}
              >
                {stepsChallenge?.title || '10.000 Passos por Dia'}
              </Text>
              <Text
                className={`font-hanken text-sm mb-4 leading-5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {stepsChallenge?.description ||
                  'Mantenha-se em movimento! Alcance sua meta diária de passos para manter sua sequência e melhorar a saúde cardiovascular.'}
              </Text>

              {/* Step Progress Bar */}
              <View
                className={`w-full h-2 rounded-full overflow-hidden mb-2 ${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              >
                <LinearGradient
                  colors={
                    isStepsDone
                      ? ['#94A3B8', '#64748B']
                      : theme === 'dark'
                      ? ['#00E5FF', '#3B82F6']
                      : ['#0284C7', '#0D9488']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: `${isStepsDone ? 100 : stepProgressPercent}%`,
                    height: '100%',
                    borderRadius: 9999,
                  }}
                />
              </View>

              <View className="flex-row justify-between">
                <Text
                  className={`font-jetbrains text-[11px] font-semibold ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {isStepsDone ? '10.000' : currentStepCount.toLocaleString('pt-BR')} passos
                </Text>
                <Text
                  className={`font-jetbrains text-[11px] font-semibold ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  10.000 meta
                </Text>
              </View>
            </View>

            {isStepsDone ? (
              <View
                style={{ width: '100%', height: 48, borderRadius: 12 }}
                className={`border items-center justify-center flex-row gap-2 ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <MaterialIcons name="check-circle" size={18} color="#94A3B8" />
                <Text
                  numberOfLines={1}
                  style={{ includeFontPadding: false }}
                  className="font-jetbrains text-xs font-bold uppercase text-slate-500"
                >
                  Desafio Concluído
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleCompleteSteps}
                disabled={completingId === 'steps_10k'}
                style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
                className={`w-full shadow-sm ${!canCompleteSteps ? 'opacity-70' : ''}`}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    canCompleteSteps
                      ? theme === 'dark'
                        ? ['#00E5FF', '#0284C7']
                        : ['#0284C7', '#0369A1']
                      : ['#64748B', '#475569']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {completingId === 'steps_10k' ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <MaterialIcons
                      name={canCompleteSteps ? 'check-circle' : 'lock'}
                      size={18}
                      color="#ffffff"
                    />
                  )}
                  <Text
                    numberOfLines={1}
                    style={{ includeFontPadding: false }}
                    className="font-jetbrains text-xs font-bold uppercase text-white tracking-wide"
                  >
                    {completingId === 'steps_10k'
                      ? 'Processando...'
                      : canCompleteSteps
                      ? 'Concluir Desafio de Passos'
                      : `Atingir 10K (${currentStepCount.toLocaleString('pt-BR')})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. BACKEND CHALLENGES SECTION */}
        <View className="mt-2">
          <Text
            className={`font-jetbrains text-xs uppercase font-bold tracking-wider mb-3 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            OUTROS DESAFIOS DO BACKEND
          </Text>

          {loading ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#00E5FF" />
              <Text className="text-slate-400 mt-2 font-sans text-xs">
                Carregando desafios adicionais do backend...
              </Text>
            </View>
          ) : challengesList.length === 0 ? (
            <View className="py-8 items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
              <MaterialIcons name="emoji-events" size={36} color="#64748B" />
              <Text
                className={`font-sora text-sm font-bold mt-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Nenhum desafio adicional no backend
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-4">
              {challengesList.map((challenge) => {
                const isDone =
                  completedIds.includes(challenge.id) ||
                  completedIds.includes(challenge.slug) ||
                  challenge.status === 'completed';
                const isProcessing = completingId === challenge.id;

                return (
                  <View
                    key={challenge.id}
                    className={`rounded-2xl p-5 border flex-col gap-4 ${
                      isDone
                        ? theme === 'dark'
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                        : theme === 'dark'
                        ? 'bg-slate-900/80 border-slate-800'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <View>
                      <View className="flex-row justify-between items-start mb-3">
                        <View
                          className={`w-12 h-12 rounded-xl items-center justify-center border ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-cyan-50 border-cyan-100'
                          }`}
                        >
                          <MaterialIcons
                            name={(challenge.icon as any) || 'emoji-events'}
                            size={28}
                            color={isDone ? '#94A3B8' : theme === 'dark' ? '#00E5FF' : '#0284C7'}
                          />
                        </View>
                        <View
                          className={`px-2.5 py-1.5 rounded-lg flex-row items-center gap-1 border ${
                            isDone
                              ? theme === 'dark'
                                ? 'bg-slate-800/50 border-slate-700'
                                : 'bg-slate-100 border-slate-200'
                              : theme === 'dark'
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <MaterialIcons
                            name={isDone ? 'check' : 'stars'}
                            size={14}
                            color={isDone ? '#94A3B8' : theme === 'dark' ? '#FBBF24' : '#D97706'}
                          />
                          <Text
                            className={`font-jetbrains text-[11px] uppercase font-bold ${
                              isDone
                                ? 'text-slate-500'
                                : theme === 'dark'
                                ? 'text-amber-400'
                                : 'text-amber-800'
                            }`}
                          >
                            {isDone ? 'Concluído' : `+${challenge.points} pts`}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className={`font-sora font-bold text-xl mb-1 ${
                          isDone
                            ? 'text-slate-400 line-through'
                            : theme === 'dark'
                            ? 'text-white'
                            : 'text-slate-900'
                        }`}
                      >
                        {challenge.title}
                      </Text>
                      <Text
                        className={`font-hanken text-sm mb-4 leading-5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}
                        numberOfLines={2}
                      >
                        {challenge.description}
                      </Text>

                      <View
                        className={`w-full h-2 rounded-full overflow-hidden mb-2 ${
                          theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <LinearGradient
                          colors={
                            isDone
                              ? ['#94A3B8', '#64748B']
                              : theme === 'dark'
                              ? ['#00E5FF', '#3B82F6']
                              : ['#0284C7', '#0D9488']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            width: `${isDone ? 100 : challenge.progressPercent}%`,
                            height: '100%',
                            borderRadius: 9999,
                          }}
                        />
                      </View>
                      <View className="flex-row justify-between">
                        <Text
                          className={`font-jetbrains text-[11px] font-semibold ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {isDone ? challenge.targetText : challenge.progressText}
                        </Text>
                        <Text
                          className={`font-jetbrains text-[11px] font-semibold ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {challenge.targetText}
                        </Text>
                      </View>
                    </View>

                    {isDone ? (
                      <View
                        style={{ width: '100%', height: 48, borderRadius: 12 }}
                        className={`border items-center justify-center flex-row gap-2 ${
                          theme === 'dark'
                            ? 'bg-slate-800/40 border-slate-800'
                            : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <MaterialIcons name="check-circle" size={18} color="#94A3B8" />
                        <Text
                          numberOfLines={1}
                          style={{ includeFontPadding: false }}
                          className="font-jetbrains text-xs font-bold uppercase text-slate-500"
                        >
                          Desafio Concluído
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleCompleteOther(challenge)}
                        disabled={isProcessing}
                        style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
                        className="w-full shadow-sm"
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={
                            theme === 'dark' ? ['#00E5FF', '#0284C7'] : ['#0284C7', '#0369A1']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            width: '100%',
                            height: 48,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <MaterialIcons name="check-circle" size={18} color="#ffffff" />
                          )}
                          <Text
                            numberOfLines={1}
                            style={{ includeFontPadding: false }}
                            className="font-jetbrains text-xs font-bold uppercase text-white tracking-wide"
                          >
                            {isProcessing ? 'Processando...' : 'Concluir Desafio'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}
