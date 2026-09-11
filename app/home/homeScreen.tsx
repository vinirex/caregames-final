import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { usePoints } from '../../context/PointsContext';
import { useAuth } from '../../context/AuthContext';
import { TopAppBar } from '../../components/TopAppBar';
import { BottomNav } from '../../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthData } from '../../hooks/useHealthData';

import { StepProgressRing } from '../../components/StepProgressRing';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points } = usePoints();
  const { userEmail } = useAuth();
  const { steps: healthSteps, isAvailable: isHealthAvailable } = useHealthData();

  const activeEmail = userEmail || 'test@test.com';
  const displaySteps = isHealthAvailable ? healthSteps : 0;

  const [userRank, setUserRank] = useState<number>(4);
  const userName = userEmail ? userEmail.split('@')[0] : 'Alex';

  useEffect(() => {
    const fetchRank = async () => {
      const { userRank: rank } = await api.getLeaderboard(activeEmail);
      setUserRank(rank);
    };
    fetchRank();
  }, [activeEmail, points]);

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-background' : 'bg-slate-100'}`}>
      <TopAppBar showMenu={true} onMenuPress={() => console.log('Menu pressed')} />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom, paddingTop: 24 }}
        className="flex-1 px-5"
      >
        <View className="mb-8 flex-row justify-between items-start">
          <View className="flex-1">
            <Text className={`font-sora text-3xl font-bold tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Bem-vindo de volta, {userName}.
            </Text>
            <Text className={`font-hanken text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Pronto para superar suas metas hoje?
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

        <View className="flex-col gap-6">
          {/* Hero Metric: Step Count Ring */}
          <View className={`rounded-2xl p-6 overflow-hidden items-center justify-center min-h-[300px] border ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Abstract Glow */}
            <View className="absolute w-[150%] h-[150%] rounded-full opacity-10 bg-cyan-500" />
            
            <View className="absolute top-6 left-6 flex-row items-center gap-2">
              <MaterialIcons name="directions-walk" size={18} color={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
              <Text className={`font-jetbrains text-xs uppercase tracking-widest font-semibold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                PASSOS DIÁRIOS {isHealthAvailable ? '(SAÚDE AO VIVO)' : ''}
              </Text>
            </View>

            <View className="mt-6 items-center justify-center">
              <StepProgressRing steps={displaySteps} goal={10000} size={210} strokeWidth={16} theme={theme} />
            </View>
          </View>

          {/* Rank Card */}
          <View className={`rounded-2xl p-5 flex-col justify-between border ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <View className="flex-row justify-between items-start mb-4">
              <Text className={`font-jetbrains text-xs uppercase font-semibold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                POSIÇÃO ATUAL
              </Text>
              <View className={`px-2 py-1 rounded-lg flex-row items-center gap-1 ${
                theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
              }`}>
                <MaterialIcons name="arrow-upward" size={14} color={theme === 'dark' ? '#10B981' : '#047857'} />
                <Text className={`font-jetbrains text-[10px] uppercase font-bold ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'
                }`}>
                  RANKING AO VIVO
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-end justify-between">
              <View>
                <Text className={`font-sora text-4xl font-extrabold leading-none ${
                  theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
                }`}>
                  #{userRank}
                </Text>
                <Text className={`font-hanken text-sm mt-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Classificação Global ({points} PTS)
                </Text>
              </View>
              <MaterialIcons name="leaderboard" size={36} color={theme === 'dark' ? '#334155' : '#CBD5E1'} />
            </View>
          </View>

          {/* Active Wearable */}
          <View className={`rounded-2xl p-5 flex-col justify-between border ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`font-jetbrains text-xs uppercase font-semibold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                DISPOSITIVO
              </Text>
              <View className={`w-2.5 h-2.5 rounded-full ${isHealthAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </View>
            
            <View className="flex-row items-center gap-4">
              <View className={`w-12 h-12 rounded-xl items-center justify-center border ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <MaterialIcons name="watch" size={24} color={isHealthAvailable ? (theme === 'dark' ? '#00E5FF' : '#0284C7') : '#94A3B8'} />
              </View>
              <View>
                <Text className={`font-sora font-bold text-md ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {isHealthAvailable ? (Platform.OS === 'ios' ? 'Apple HealthKit' : 'Health Connect') : 'Nenhum Dispositivo Conectado'}
                </Text>
                <Text className={`font-jetbrains text-[10px] uppercase font-bold mt-1 ${
                  isHealthAvailable
                    ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700')
                    : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                }`}>
                  {isHealthAvailable ? 'SAÚDE SINCRONIZADA • AO VIVO' : 'DESCONECTADO'}
                </Text>
              </View>
            </View>
          </View>

          {/* Current Challenge */}
          <View className={`rounded-2xl p-6 relative overflow-hidden border ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <View className="relative z-10 flex-col gap-4">
              <View className="flex-1">
                <Text className={`font-jetbrains text-xs uppercase font-bold mb-1 ${
                  theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
                }`}>
                  DESAFIO ATIVO
                </Text>
                <Text className={`font-sora font-semibold text-2xl mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Semana da Hidratação
                </Text>
                <Text className={`font-hanken mb-4 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Mantenha a meta de 3L de água por dia durante 7 dias para desbloquear uma conquista especial.
                </Text>
                
                {/* Progress Bar */}
                <View className="max-w-[300px]">
                  <View className="flex-row justify-between mb-1.5">
                    <Text className={`font-jetbrains text-[10px] uppercase font-bold ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      DIA 4/7
                    </Text>
                    <Text className={`font-jetbrains text-[10px] uppercase font-bold ${
                      theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
                    }`}>
                      57%
                    </Text>
                  </View>
                  <View className={`h-2 w-full rounded-full overflow-hidden ${
                    theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                  }`}>
                    <LinearGradient
                      colors={theme === 'dark' ? ['#00E5FF', '#3B82F6'] : ['#0284C7', '#0D9488']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: '57%', height: '100%', borderRadius: 9999 }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}