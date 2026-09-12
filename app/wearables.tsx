import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNav } from '../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthData } from '../hooks/useHealthData';

export default function WearablesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { steps: healthSteps, heartRate: healthBpm, isAvailable: isHealthAvailable, refreshHealthData } = useHealthData();
  const [syncEnabled, setSyncEnabled] = useState(isHealthAvailable);

  const isConnected = isHealthAvailable && syncEnabled;
  const displaySteps = isConnected ? healthSteps : 0;
  const displayBpm = isConnected && healthBpm ? healthBpm : 0;
  const stepGoal = 10000;
  const progressPercentage = isConnected && displaySteps > 0 ? Math.min(100, Math.round((displaySteps / stepGoal) * 100)) : 0;

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-background' : 'bg-slate-100'}`}>
      <TopAppBar showMenu={true} title="Care Games +" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom, paddingTop: 24 }}
        className="flex-1 px-5"
      >
        <View className="mb-6 flex-col">
          <Text className={`font-sora text-3xl font-bold tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Dispositivos
          </Text>
          <Text className={`font-hanken text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Gerencie seus relógios inteligentes e monitore a telemetria em tempo real.
          </Text>
        </View>

        <View className="flex-col gap-6">
          {/* Connection Card */}
          <View className={`rounded-2xl p-6 relative overflow-hidden flex-col gap-6 border ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <View className="flex-col gap-4 z-10">
              <View className="flex-row items-center gap-3">
                <View className={`w-12 h-12 rounded-xl items-center justify-center border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-cyan-50 border-cyan-100'
                }`}>
                  <MaterialIcons name="watch" size={28} color={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
                </View>
                <View className="flex-1">
                  <Text className={`font-sora font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {isConnected ? (Platform.OS === 'ios' ? 'Apple HealthKit' : 'Health Connect') : 'Nenhum Dispositivo Conectado'}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <Text className={`font-jetbrains text-[11px] uppercase font-bold ${
                      isConnected
                        ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700')
                        : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {isConnected ? 'SAÚDE SINCRONIZADA • AO VIVO' : 'DESCONECTADO'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text className={`font-hanken text-sm max-w-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {isConnected 
                  ? 'Integrado nativamente com seu sistema para sincronização de passos e dados cardíacos.'
                  : 'Conecte um relógio inteligente ou ative o HealthKit / Health Connect no seu aparelho para sincronizar sua telemetria em tempo real.'}
              </Text>
            </View>

            <View className="flex-col gap-4 z-10 w-full">
              <View className={`flex-row items-center justify-between w-full p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <Text className={`font-jetbrains text-xs font-bold uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  SINCRONIZAÇÃO EM TEMPO REAL
                </Text>
                <Switch 
                  value={syncEnabled} 
                  onValueChange={setSyncEnabled}
                  trackColor={{ false: theme === 'dark' ? '#334155' : '#CBD5E1', true: '#00E5FF' }}
                  thumbColor="#ffffff"
                />
              </View>

              <TouchableOpacity 
                onPress={refreshHealthData}
                style={{ borderRadius: 12, overflow: 'hidden' }}
                className="w-full shadow-sm" 
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={theme === 'dark' ? ['#00E5FF', '#0284C7'] : ['#0284C7', '#0369A1']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12 }}
                  className="w-full px-5 py-3.5 flex-row items-center justify-between rounded-xl"
                >
                  <Text 
                    numberOfLines={1}
                    style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                    className="font-sora text-sm font-bold text-white tracking-wide"
                  >
                    Forçar Sincronização
                  </Text>
                  <MaterialIcons name="sync" size={20} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View className={`rounded-2xl p-5 flex-col justify-center border ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Text className={`font-jetbrains text-xs uppercase font-bold mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              ÚLTIMA SINCRONIZAÇÃO
            </Text>
            <Text className={`font-sora text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isConnected ? 'Agora mesmo' : 'Desconectado'}
            </Text>
            <View className="flex-row items-center gap-2">
              <MaterialIcons 
                name={isConnected ? 'check-circle' : 'cancel'} 
                size={16} 
                color={isConnected ? (theme === 'dark' ? '#10B981' : '#047857') : (theme === 'dark' ? '#EF4444' : '#DC2626')} 
              />
              <Text className={`font-hanken text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {isConnected ? `${Math.min(displaySteps, 14)} pacotes recebidos` : 'Aguardando sincronização com dispositivo real'}
              </Text>
            </View>
          </View>

          {/* Real-time Data Grid */}
          <Text className={`font-sora font-bold text-xl mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Telemetria em Tempo Real
          </Text>

          <View className="flex-col gap-4">
            {/* Heart Rate Card */}
            <View className={`rounded-2xl p-6 relative overflow-hidden flex-col h-40 border ${
              theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <View className="absolute top-4 right-4 items-center justify-center">
                <View className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  theme === 'dark' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                }`}>
                  <MaterialIcons name="favorite" size={16} color="#EF4444" />
                </View>
              </View>
              
              <Text className={`font-jetbrains text-xs font-bold uppercase mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                FREQUÊNCIA CARDÍACA
              </Text>
              
              <View className="flex-row items-end gap-2 mb-4">
                <Text className={`font-sora text-5xl font-extrabold ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'}`}>
                  {displayBpm}
                </Text>
                <Text className={`font-jetbrains text-xs font-semibold uppercase pb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  BPM
                </Text>
              </View>
            </View>

            {/* Steps Card */}
            <View className={`rounded-2xl p-6 relative overflow-hidden flex-col border ${
              theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <View className="absolute top-4 right-4 items-center justify-center">
                <View className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
                }`}>
                  <MaterialIcons name="directions-run" size={16} color={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
                </View>
              </View>

              <Text className={`font-jetbrains text-xs font-bold uppercase mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                PASSOS HOJE
              </Text>
              
              <View className="flex-row items-end gap-2 mb-4">
                <Text className={`font-sora text-5xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {displaySteps.toLocaleString('pt-BR')}
                </Text>
              </View>

              <View className="mt-auto">
                <View className="flex-row justify-between mb-2">
                  <Text className={`font-jetbrains text-[10px] uppercase font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    PROGRESSO
                  </Text>
                  <Text className={`font-jetbrains text-[10px] uppercase font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {progressPercentage}% / 10K META
                  </Text>
                </View>
                <View className={`w-full h-2 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                }`}>
                  <LinearGradient
                    colors={theme === 'dark' ? ['#00E5FF', '#3B82F6'] : ['#0284C7', '#0D9488']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ width: `${progressPercentage}%`, height: '100%', borderRadius: 9999 }}
                  />
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