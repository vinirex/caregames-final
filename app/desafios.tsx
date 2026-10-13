import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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

export default function DesafiosScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points, refreshPoints } = usePoints();
  const { userEmail } = useAuth();
  const { addNotification } = useNotifications();
  const { steps, isConnected } = useHealthData();
  const activeEmail = userEmail || '';

  const currentStepCount = isConnected ? steps : 0;
  const stepGoal = 10000;
  const stepProgressPercent = Math.min(100, Math.round((currentStepCount / stepGoal) * 100));
  const canCompleteSteps = currentStepCount >= stepGoal;

  const [challengesList, setChallengesList] = useState<ChallengeItem[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchChallengesData = useCallback(async () => {
    setLoading(true);
    const challengesRes = await api.getChallenges();
    if (challengesRes.success && challengesRes.challenges) {
      // Filter out steps_10k from general list since it is rendered as the primary Base/Daily challenge
      const otherChallenges = challengesRes.challenges.filter(c => c.slug !== 'steps_10k' && c.id !== 'steps_10k');
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

  const handleCompleteSteps = async () => {
    if (completedIds.includes('steps_10k')) {
      Alert.alert('Desafio já concluído', 'Você já recebeu os pontos do desafio de passos hoje.');
      return;
    }

    if (!canCompleteSteps) {
      Alert.alert(
        'Meta de passos não atingida 🏃‍♂️',
        `Você precisa atingir 10.000 passos no dia para concluir este desafio. Seu progresso atual é de ${currentStepCount.toLocaleString('pt-BR')} passos.`
      );
      return;
    }

    const res = await api.completeChallenge(activeEmail, 'steps_10k');
    if (res.success) {
      setCompletedIds(prev => [...prev, 'steps_10k']);
      await refreshPoints();
      addNotification(
        'Desafio de Passos Concluído! 🎉',
        `Parabéns! Você atingiu 10.000 passos e ganhou +100 PTS!`,
        'directions-walk',
        '#00E5FF'
      );
      Alert.alert('Parabéns! 🎉', `Você ganhou +${res.points || 100} PTS pelo desafio de passos.`);
      fetchChallengesData();
    } else {
      Alert.alert('Erro ao Concluir', res.message || 'Não foi possível concluir o desafio de passos.');
    }
  };

  const handleCompleteOther = async (challenge: ChallengeItem) => {
    if (completedIds.includes(challenge.id) || challenge.status === 'completed') {
      Alert.alert('Desafio já concluído', 'Você já recebeu os pontos deste desafio.');
      return;
    }

    const res = await api.completeChallenge(activeEmail, challenge.id);
    if (res.success) {
      setCompletedIds(prev => [...prev, challenge.id]);
      await refreshPoints();
      addNotification(
        'Desafio Concluído! 🎉',
        `Parabéns! Você ganhou +${challenge.points} PTS por concluir "${challenge.title}".`,
        'emoji-events',
        '#FBBF24'
      );
      Alert.alert('Parabéns! 🎉', `Você ganhou +${res.points || challenge.points} PTS por concluir "${challenge.title}".`);
      fetchChallengesData();
    } else {
      Alert.alert('Erro ao Concluir', res.message || 'Não foi possível concluir o desafio.');
    }
  };

  const isStepsDone = completedIds.includes('steps_10k');

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-background' : 'bg-slate-100'}`}>
      <TopAppBar title="Care Games +" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom, paddingTop: 24 }}
        className="flex-1 px-5"
      >
        {/* Header */}
        <View className="mb-6 flex-row justify-between items-start">
          <View className="flex-col flex-1">
            <Text className={`font-sora text-3xl font-bold tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Desafios Ativos
            </Text>
            <Text className={`font-hanken text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Conclua tarefas diárias para ganhar pontos e subir no ranking.
            </Text>
          </View>
          
          <View className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
            theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-100 border-amber-300'
          }`}>
            <MaterialIcons name="stars" size={18} color={theme === 'dark' ? '#FBBF24' : '#D97706'} />
            <Text className={`font-jetbrains text-sm uppercase font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>
              {points} PTS
            </Text>
          </View>
        </View>

        {/* 1. BASE / DAILY STEPS CHALLENGE */}
        <View className="mb-6">
          <Text className={`font-jetbrains text-xs uppercase font-bold tracking-wider mb-3 ${
            theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
          }`}>
            DESAFIO DIÁRIO BASE
          </Text>

          <View className={`rounded-2xl p-5 border flex-col gap-4 ${
            isStepsDone 
              ? (theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60')
              : (theme === 'dark' ? 'bg-slate-900/90 border-cyan-500/30 shadow-lg' : 'bg-white border-cyan-200 shadow-sm')
          }`}>
            <View>
              <View className="flex-row justify-between items-start mb-3">
                <View className={`w-12 h-12 rounded-xl items-center justify-center border ${
                  theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-100'
                }`}>
                  <MaterialIcons 
                    name="directions-walk" 
                    size={28} 
                    color={isStepsDone ? '#94A3B8' : (theme === 'dark' ? '#00E5FF' : '#0284C7')} 
                  />
                </View>
                
                <View className={`px-2.5 py-1.5 rounded-lg flex-row items-center gap-1 border ${
                  isStepsDone 
                    ? (theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200')
                    : (theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200')
                }`}>
                  <MaterialIcons 
                    name={isStepsDone ? "check" : "stars"} 
                    size={14} 
                    color={isStepsDone ? "#94A3B8" : (theme === 'dark' ? '#FBBF24' : '#D97706')} 
                  />
                  <Text className={`font-jetbrains text-[11px] uppercase font-bold ${
                    isStepsDone 
                      ? 'text-slate-500' 
                      : (theme === 'dark' ? 'text-amber-400' : 'text-amber-800')
                  }`}>
                    {isStepsDone ? 'Concluído' : '+100 pts'}
                  </Text>
                </View>
              </View>

              <Text className={`font-sora font-bold text-xl mb-1 ${
                isStepsDone ? 'text-slate-400 line-through' : (theme === 'dark' ? 'text-white' : 'text-slate-900')
              }`}>
                10.000 Passos por Dia
              </Text>
              <Text className={`font-hanken text-sm mb-4 leading-5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Mantenha-se em movimento! Alcance sua meta diária de passos para manter sua sequência e melhorar a saúde cardiovascular.
              </Text>

              {/* Step Progress Bar */}
              <View className={`w-full h-2 rounded-full overflow-hidden mb-2 ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
              }`}>
                <LinearGradient
                  colors={isStepsDone 
                    ? ['#94A3B8', '#64748B'] 
                    : (theme === 'dark' ? ['#00E5FF', '#3B82F6'] : ['#0284C7', '#0D9488'])
                  }
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: `${isStepsDone ? 100 : stepProgressPercent}%`, height: '100%', borderRadius: 9999 }}
                />
              </View>

              <View className="flex-row justify-between">
                <Text className={`font-jetbrains text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isStepsDone ? '10.000' : currentStepCount.toLocaleString('pt-BR')} passos
                </Text>
                <Text className={`font-jetbrains text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
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
                style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
                className={`w-full shadow-sm ${!canCompleteSteps ? 'opacity-70' : ''}`}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canCompleteSteps
                    ? (theme === 'dark' ? ['#00E5FF', '#0284C7'] : ['#0284C7', '#0369A1'])
                    : ['#64748B', '#475569']
                  }
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: '100%', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <MaterialIcons name={canCompleteSteps ? "check-circle" : "lock"} size={18} color="#ffffff" />
                  <Text 
                    numberOfLines={1}
                    style={{ includeFontPadding: false }}
                    className="font-jetbrains text-xs font-bold uppercase text-white tracking-wide"
                  >
                    {canCompleteSteps ? 'Concluir Desafio de Passos' : `Atingir 10K (${currentStepCount.toLocaleString('pt-BR')})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. BACKEND CHALLENGES SECTION */}
        <View className="mt-2">
          <Text className={`font-jetbrains text-xs uppercase font-bold tracking-wider mb-3 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            OUTROS DESAFIOS DO BACKEND
          </Text>

          {loading ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#00E5FF" />
              <Text className="text-slate-400 mt-2 font-sans text-xs">Carregando desafios adicionais do backend...</Text>
            </View>
          ) : challengesList.length === 0 ? (
            <View className="py-8 items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
              <MaterialIcons name="emoji-events" size={36} color="#64748B" />
              <Text className={`font-sora text-sm font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Nenhum desafio adicional no backend
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-4">
              {challengesList.map((challenge) => {
                const isDone = completedIds.includes(challenge.id) || challenge.status === 'completed';

                return (
                  <View 
                    key={challenge.id} 
                    className={`rounded-2xl p-5 border flex-col gap-4 ${
                      isDone 
                        ? (theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60')
                        : (theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm')
                    }`}
                  >
                    <View>
                      <View className="flex-row justify-between items-start mb-3">
                        <View className={`w-12 h-12 rounded-xl items-center justify-center border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-cyan-50 border-cyan-100'
                        }`}>
                          <MaterialIcons 
                            name={challenge.icon as any || 'emoji-events'} 
                            size={28} 
                            color={isDone ? '#94A3B8' : (theme === 'dark' ? '#00E5FF' : '#0284C7')} 
                          />
                        </View>
                        <View className={`px-2.5 py-1.5 rounded-lg flex-row items-center gap-1 border ${
                          isDone 
                            ? (theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200')
                            : (theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200')
                        }`}>
                          <MaterialIcons 
                            name={isDone ? "check" : "stars"} 
                            size={14} 
                            color={isDone ? "#94A3B8" : (theme === 'dark' ? '#FBBF24' : '#D97706')} 
                          />
                          <Text className={`font-jetbrains text-[11px] uppercase font-bold ${
                            isDone 
                              ? 'text-slate-500' 
                              : (theme === 'dark' ? 'text-amber-400' : 'text-amber-800')
                          }`}>
                            {isDone ? 'Concluído' : `+${challenge.points} pts`}
                          </Text>
                        </View>
                      </View>
                      
                      <Text className={`font-sora font-bold text-xl mb-1 ${
                        isDone ? 'text-slate-400 line-through' : (theme === 'dark' ? 'text-white' : 'text-slate-900')
                      }`}>
                        {challenge.title}
                      </Text>
                      <Text className={`font-hanken text-sm mb-4 leading-5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`} numberOfLines={2}>
                        {challenge.description}
                      </Text>

                      <View className={`w-full h-2 rounded-full overflow-hidden mb-2 ${
                        theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
                        <LinearGradient
                          colors={isDone 
                            ? ['#94A3B8', '#64748B'] 
                            : (theme === 'dark' ? ['#00E5FF', '#3B82F6'] : ['#0284C7', '#0D9488'])
                          }
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ width: `${isDone ? 100 : challenge.progressPercent}%`, height: '100%', borderRadius: 9999 }}
                        />
                      </View>
                      <View className="flex-row justify-between">
                        <Text className={`font-jetbrains text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {isDone ? challenge.targetText : challenge.progressText}
                        </Text>
                        <Text className={`font-jetbrains text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {challenge.targetText}
                        </Text>
                      </View>
                    </View>

                    {isDone ? (
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
                        onPress={() => handleCompleteOther(challenge)}
                        style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
                        className="w-full shadow-sm"
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={theme === 'dark' ? ['#00E5FF', '#0284C7'] : ['#0284C7', '#0369A1']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ width: '100%', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <MaterialIcons name="check-circle" size={18} color="#ffffff" />
                          <Text 
                            numberOfLines={1}
                            style={{ includeFontPadding: false }}
                            className="font-jetbrains text-xs font-bold uppercase text-white tracking-wide"
                          >
                            Concluir Desafio
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
