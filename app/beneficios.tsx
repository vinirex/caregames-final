import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNav } from '../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, BenefitItem } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';

export default function BenefitsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points, refreshPoints } = usePoints();
  const { addNotification } = useNotifications();
  const [benefitsList, setBenefitsList] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBenefits = async () => {
    setLoading(true);
    const res = await api.getBenefits();
    if (res.success && res.benefits) {
      setBenefitsList(res.benefits);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  const handleRedeem = async (benefit: BenefitItem) => {
    if (points >= benefit.points) {
      const res = await api.redeemBenefit(benefit.id);
      if (res.success) {
        await refreshPoints();
        addNotification(
          'Benefício Resgatado! 🎁',
          `Você resgatou "${benefit.title}" por ${benefit.points} PTS com sucesso!`,
          'card-giftcard',
          '#10B981'
        );
        Alert.alert('Sucesso 🎉', res.message || `Você resgatou "${benefit.title}".`);
        fetchBenefits();
      } else {
        Alert.alert('Falha no Resgate', res.message || 'Não foi possível resgatar este benefício.');
      }
    } else {
      Alert.alert('Pontos Insuficientes', `Você precisa de ${benefit.points} PTS para resgatar "${benefit.title}".`);
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
          <View className="flex-col flex-1 mr-3">
            <Text className={`font-sora text-3xl font-bold tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Benefícios
            </Text>
            <Text className={`font-hanken text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Resgate seus pontos por recompensas exclusivas do backend.
            </Text>
          </View>
          <View className={`flex-shrink-0 flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
            theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-100 border-amber-300'
          }`}>
            <MaterialIcons name="stars" size={18} color={theme === 'dark' ? '#FBBF24' : '#D97706'} />
            <Text className={`font-jetbrains text-sm uppercase font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>
              {points} PTS
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text className="text-slate-400 mt-3 font-sans">Carregando catálogo do backend...</Text>
          </View>
        ) : benefitsList.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <MaterialIcons name="card-giftcard" size={48} color="#64748B" />
            <Text className={`font-sora text-lg font-bold mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Nenhum benefício disponível
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-4">
            {benefitsList.map((benefit) => (
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
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}