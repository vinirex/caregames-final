import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import { useAuth } from '../context/AuthContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNav } from '../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  progressText: string;
  targetText: string;
  progressPercent: number;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'steps_10k',
    title: '10.000 passos por dia',
    description: 'Mantenha-se em movimento! Alcance sua meta diária de passos para manter sua sequência e melhorar a saúde cardiovascular.',
    points: 100,
    icon: 'directions-walk',
    progressText: '6.500',
    targetText: '10.000',
    progressPercent: 65,
  },
  {
    id: 'water_2l',
    title: 'Beber 2L de Água',
    description: 'Mantenha-se hidratado ao longo do dia. Registre seu consumo diário para atingir sua meta.',
    points: 50,
    icon: 'water-drop',
    progressText: '1,5L',
    targetText: '2,0L',
    progressPercent: 75,
  },
  {
    id: 'meditation_15m',
    title: '15 min de Meditação',
    description: 'Concentre sua mente e reduza o estresse com uma sessão diária de meditação guiada.',
    points: 75,
    icon: 'self-improvement',
    progressText: '10 min',
    targetText: '15 min',
    progressPercent: 66,
  },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';

export default function DesafiosScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points, addPoints } = usePoints();
  const { userEmail } = useAuth();
  const { addNotification } = useNotifications();
  const activeEmail = userEmail || 'test@test.com';

  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCompleted = async () => {
      const res = await api.getCompletedChallenges(activeEmail);
      if (res.success && res.completedChallenges) {
        setCompletedIds(res.completedChallenges);
      }
    };
    fetchCompleted();
  }, [activeEmail]);

  const handleComplete = async (challenge: Challenge) => {
    if (completedIds.includes(challenge.id)) {
      Alert.alert('Desafio já concluído', 'Você já recebeu os pontos deste desafio.');
      return;
    }

    const res = await api.completeChallenge(activeEmail, challenge.id);
    if (res.success) {
      setCompletedIds(prev => [...prev, challenge.id]);
      await addPoints(challenge.points);
      addNotification(
        'Desafio Concluído! 🎉',
        `Parabéns! Você ganhou +${challenge.points} PTS por concluir "${challenge.title}".`,
        'emoji-events',
        '#FBBF24'
      );
    }
  };

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-background' : 'bg-slate-100'}`}>
      <TopAppBar title="Care Games +" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom, paddingTop: 24 }}
        className="flex-1 px-5"
      >
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

        <View className="flex-col gap-4">
          {CHALLENGES.map((challenge) => {
            const isDone = completedIds.includes(challenge.id);

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
                        name={challenge.icon} 
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
                  <View className={`w-full py-3.5 rounded-xl border items-center justify-center flex-row gap-2 ${
                    theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <MaterialIcons name="check-circle" size={18} color="#94A3B8" />
                    <Text 
                      style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                      className="font-jetbrains text-xs font-bold uppercase text-slate-500"
                    >
                      Desafio Concluído
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={() => handleComplete(challenge)}
                    style={{ borderRadius: 12, overflow: 'hidden' }}
                    className="w-full shadow-sm flex-row items-center justify-center"
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={theme === 'dark' ? ['#00E5FF', '#0284C7'] : ['#0284C7', '#0369A1']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 12 }}
                      className="w-full py-3.5 flex-row items-center justify-center gap-2 rounded-xl"
                    >
                      <MaterialIcons name="check-circle" size={18} color="#ffffff" />
                      <Text 
                        numberOfLines={1}
                        style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                        className="font-jetbrains text-xs font-bold uppercase text-white tracking-wide"
                      >
                        Concluir e Ganhar +{challenge.points} PTS
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}
