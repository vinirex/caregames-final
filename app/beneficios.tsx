import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNav } from '../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Benefit {
  id: string;
  title: string;
  description: string;
  points: number;
  image: string;
}

const benefitsData: Benefit[] = [
  {
    id: '1',
    title: 'Dia de Spa',
    description: 'Relaxe com um dia completo de tratamentos de spa.',
    points: 5000,
    image: 'https://picsum.photos/seed/spa/200',
  },
  {
    id: '2',
    title: 'Sessão de Massagem',
    description: 'Uma massagem relaxante de 60 minutos para aliviar o estresse.',
    points: 3500,
    image: 'https://picsum.photos/seed/massage/200',
  },
  {
    id: '3',
    title: 'Kit com Garrafa de Água',
    description: 'Mantenha-se hidratado com nosso kit exclusivo.',
    points: 1500,
    image: 'https://picsum.photos/seed/bottle/200',
  },
  {
    id: '4',
    title: 'Consulta Nutricionista',
    description: 'Uma consulta online para montar seu plano alimentar.',
    points: 4000,
    image: 'https://picsum.photos/seed/nutrition/200',
  },
  {
    id: '5',
    title: 'Vale-Academia',
    description: 'Um mês de acesso a uma de nossas academias parceiras.',
    points: 6000,
    image: 'https://picsum.photos/seed/gym/200',
  },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';

export default function BenefitsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points, spendPoints } = usePoints();
  const { addNotification } = useNotifications();

  const handleRedeem = (benefit: Benefit) => {
    if (points >= benefit.points) {
      spendPoints(benefit.points);
      addNotification(
        'Benefício Resgatado! 🎁',
        `Você resgatou "${benefit.title}" por ${benefit.points} PTS com sucesso!`,
        'card-giftcard',
        '#10B981'
      );
    } else {
      Alert.alert('Pontos Insuficientes', `Você não tem pontos suficientes para resgatar "${benefit.title}".`);
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
          <View className="flex-col">
            <Text className={`font-sora text-3xl font-bold tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Benefícios
            </Text>
            <Text className={`font-hanken text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Resgate seus pontos por recompensas exclusivas.
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
          {benefitsData.map((benefit) => (
            <View key={benefit.id} className={`rounded-2xl p-5 border flex-col gap-4 ${
              theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <View className="flex-row items-center gap-4">
                <Image source={{ uri: benefit.image }} className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <View className="flex-1">
                  <Text className={`font-sora font-bold text-lg mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {benefit.title}
                  </Text>
                  <Text className={`font-hanken text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} numberOfLines={2}>
                    {benefit.description}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Text className={`font-jetbrains text-base uppercase font-bold ${
                  theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
                }`}>
                  {benefit.points} PTS
                </Text>
                
                <TouchableOpacity 
                  onPress={() => handleRedeem(benefit)}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  className={`${points >= benefit.points ? 'shadow-sm' : 'opacity-50'}`}
                  disabled={points < benefit.points}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={points >= benefit.points ? 
                      (theme === 'dark' ? ['#00E5FF', '#0284C7'] : ['#0284C7', '#0369A1']) : 
                      ['#64748B', '#475569']
                    }
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 40, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <MaterialIcons name="redeem" size={16} color="#ffffff" />
                    <Text 
                      numberOfLines={1}
                      style={{ includeFontPadding: false }}
                      className="font-jetbrains text-xs font-bold uppercase text-white tracking-wide"
                    >
                      Resgatar
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}