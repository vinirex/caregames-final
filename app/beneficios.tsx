import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNav } from '../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, BenefitItem } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';

interface InAppToast {
  id: string;
  title: string;
  message: string;
  icon: keyof typeof MaterialIcons.glyphMap | string;
  iconColor: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function BenefitsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points, refreshPoints } = usePoints();
  const { addNotification, refresh: refreshNotifications } = useNotifications();
  const [benefitsList, setBenefitsList] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

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

  const fetchBenefits = useCallback(async () => {
    setLoading(true);
    const res = await api.getBenefits();
    if (res.success && res.benefits) {
      setBenefitsList(res.benefits);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBenefits();
  }, [fetchBenefits]);

  const handleRedeem = async (benefit: BenefitItem) => {
    if (points < benefit.points) {
      const needed = benefit.points - points;
      showNotification(
        'Pontos Insuficientes ⚠️',
        `Você precisa de ${benefit.points.toLocaleString('pt-BR')} PTS para resgatar "${benefit.title}". Saldo atual: ${points.toLocaleString('pt-BR')} PTS (faltam ${needed.toLocaleString('pt-BR')} PTS).`,
        'stars',
        '#F59E0B',
        'warning'
      );
      return;
    }

    setRedeemingId(benefit.id);
    try {
      const res = await api.redeemBenefit(benefit.id);
      if (res.success) {
        await refreshPoints();
        await refreshNotifications().catch(() => {});
        const voucher = res.data?.voucher_code;
        const successMessage = voucher
          ? `Voucher "${voucher}" gerado! Você resgatou "${benefit.title}" por ${benefit.points} PTS.`
          : `Você resgatou "${benefit.title}" por ${benefit.points} PTS com sucesso!`;

        showNotification(
          'Benefício Resgatado! 🎁',
          successMessage,
          'card-giftcard',
          '#10B981',
          'success'
        );
        fetchBenefits();
      } else {
        showNotification(
          'Falha no Resgate ❌',
          res.message || 'Não foi possível resgatar este benefício.',
          'error-outline',
          '#EF4444',
          'error'
        );
      }
    } catch (err: any) {
      showNotification(
        'Erro de Conexão',
        err.message || 'Não foi possível se comunicar com o servidor.',
        'wifi-off',
        '#EF4444',
        'error'
      );
    } finally {
      setRedeemingId(null);
    }
  };

  const getBenefitIcon = (benefit: BenefitItem): keyof typeof MaterialIcons.glyphMap => {
    const img = benefit.image?.toLowerCase() || '';
    const cat = benefit.category?.toLowerCase() || '';

    if (img.includes('fitness') || cat.includes('gym') || cat.includes('academia')) {
      return 'fitness-center';
    }
    if (img.includes('spa') || cat.includes('spa') || cat.includes('massag')) {
      return 'spa';
    }
    if (img.includes('hospital') || cat.includes('health') || cat.includes('nutri') || cat.includes('saude')) {
      return 'local-hospital';
    }
    return 'card-giftcard';
  };

  const isHttpUrl = (url?: string) => {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
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
          <View className="flex-col flex-1 mr-3">
            <Text
              className={`font-sora text-3xl font-bold tracking-tight mb-1 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Benefícios
            </Text>
            <Text
              className={`font-hanken text-base ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Resgate seus pontos por recompensas exclusivas do backend.
            </Text>
          </View>
          <View
            className={`flex-shrink-0 flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
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

        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text className="text-slate-400 mt-3 font-sans">Carregando catálogo do backend...</Text>
          </View>
        ) : benefitsList.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <MaterialIcons name="card-giftcard" size={48} color="#64748B" />
            <Text
              className={`font-sora text-lg font-bold mt-3 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Nenhum benefício disponível
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-4">
            {benefitsList.map((benefit) => {
              const canAfford = points >= benefit.points;
              const isRedeeming = redeemingId === benefit.id;
              const hasHttpImage = isHttpUrl(benefit.image);
              const fallbackIcon = getBenefitIcon(benefit);

              return (
                <View
                  key={benefit.id}
                  className={`rounded-2xl p-5 border flex-col gap-4 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <View className="flex-row items-center gap-4">
                    {hasHttpImage ? (
                      <Image
                        source={{ uri: benefit.image }}
                        className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800"
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        className={`w-16 h-16 rounded-xl items-center justify-center border ${
                          theme === 'dark'
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-cyan-50 border-cyan-100'
                        }`}
                      >
                        <MaterialIcons
                          name={fallbackIcon}
                          size={32}
                          color={theme === 'dark' ? '#00E5FF' : '#0284C7'}
                        />
                      </View>
                    )}

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className={`font-sora font-bold text-lg flex-1 mr-2 ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {benefit.title}
                        </Text>
                      </View>
                      <Text
                        className={`font-hanken text-sm ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}
                        numberOfLines={2}
                      >
                        {benefit.description}
                      </Text>
                      {typeof benefit.stock === 'number' && (
                        <Text className="text-[11px] font-jetbrains text-slate-500 mt-1">
                          Estoque: {benefit.stock} {benefit.stock === 1 ? 'unidade' : 'unidades'}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <View className="flex-col">
                      <Text
                        className={`font-jetbrains text-base uppercase font-bold ${
                          theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
                        }`}
                      >
                        {benefit.points.toLocaleString('pt-BR')} PTS
                      </Text>
                      {!canAfford && (
                        <Text className="text-[10px] font-jetbrains text-amber-500 font-semibold">
                          Faltam {(benefit.points - points).toLocaleString('pt-BR')} pts
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRedeem(benefit)}
                      disabled={isRedeeming}
                      style={{ borderRadius: 12, overflow: 'hidden' }}
                      className={canAfford ? 'shadow-sm' : 'opacity-85'}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={
                          isRedeeming
                            ? ['#0284C7', '#0369A1']
                            : canAfford
                            ? theme === 'dark'
                              ? ['#00E5FF', '#0284C7']
                              : ['#0284C7', '#0369A1']
                            : ['#475569', '#334155']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          height: 40,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        {isRedeeming ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <MaterialIcons
                            name={canAfford ? 'redeem' : 'lock'}
                            size={16}
                            color="#ffffff"
                          />
                        )}
                        <Text
                          numberOfLines={1}
                          style={{ includeFontPadding: false }}
                          className="font-jetbrains text-xs font-bold uppercase text-white tracking-wide"
                        >
                          {isRedeeming ? 'Resgatando...' : canAfford ? 'Resgatar' : 'Bloqueado'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}