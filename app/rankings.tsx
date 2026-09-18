import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import { useAuth } from '../context/AuthContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNav } from '../components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, LeaderboardUser } from '../services/api';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

export default function RankingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { points } = usePoints();
  const { userEmail } = useAuth();
  const activeEmail = userEmail || 'test@test.com';

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number>(4);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      const { leaderboard: list, userRank: rank } = await api.getLeaderboard(activeEmail);
      setLeaderboard(list);
      setUserRank(rank);

      try {
        const photoKey = `@profile_photo_${activeEmail}`;
        const savedPhoto = await AsyncStorage.getItem(photoKey);
        if (savedPhoto) setUserPhoto(savedPhoto);

        const photoRes = await api.getProfilePhoto(activeEmail);
        if (photoRes.success && photoRes.photoUri) {
          setUserPhoto(photoRes.photoUri);
        }
      } catch (e) {
        console.error('Error loading ranking user photo:', e);
      }
    };
    fetchRankings();
  }, [activeEmail, points]);

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-background' : 'bg-slate-100'}`}>
      <TopAppBar title="Care Games +" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom, paddingTop: 24 }}
        className="flex-1 px-5"
      >
        <View className="mb-6 flex-col">
          <Text className={`font-sora text-3xl font-bold tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Classificação Global
          </Text>
          <Text className={`font-hanken text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
            Os melhores colocados da temporada Cyber-Athletic.
          </Text>
          
          <View className="flex-row items-center gap-2 self-start">
            <Text className={`font-jetbrains text-xs uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              TEMPORADA 4 TERMINA EM:
            </Text>
            <View className={`px-3 py-1 rounded-lg border ${
              theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-100 border-amber-300'
            }`}>
              <Text className={`font-sora font-bold text-sm ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>
                12d 14h
              </Text>
            </View>
          </View>
        </View>

        <View className={`rounded-2xl overflow-hidden border ${
          theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {leaderboard.map((item) => {
            const isGold = item.rank === 1;
            const isSilver = item.rank === 2;
            const isBronze = item.rank === 3;

            if (item.isCurrentUser) {
              return (
                <View 
                  key={`user-${item.rank}`}
                  className={`flex-row items-center p-4 border-y ${
                    theme === 'dark' ? 'border-cyan-500/40 bg-cyan-950/40' : 'border-cyan-200 bg-cyan-50'
                  } relative z-10`}
                >
                  <View className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                  
                  <Text className={`font-hanken text-base font-bold w-10 text-center ${
                    theme === 'dark' ? 'text-cyan-400' : 'text-cyan-800'
                  }`}>
                    #{item.rank}
                  </Text>
                  
                  <View className="flex-1 flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400">
                      <Image 
                        source={{ uri: userPhoto || item.avatar || DEFAULT_AVATAR }} 
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View>
                      <Text className={`font-hanken text-base font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-cyan-950'
                      }`}>
                        {item.name}
                      </Text>
                      <Text className={`font-jetbrains text-xs uppercase font-semibold ${
                        theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
                      }`}>
                        {points} PTS
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }

            const rankColor = isGold ? '#D97706' : isSilver ? '#64748B' : isBronze ? '#B45309' : undefined;

            return (
              <View 
                key={`${item.name}-${item.rank}`}
                className={`flex-row items-center p-4 border-b relative overflow-hidden ${
                  theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                } ${
                  isGold 
                    ? (theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-50/60') 
                    : isSilver 
                    ? (theme === 'dark' ? 'bg-slate-500/5' : 'bg-slate-50/60') 
                    : isBronze 
                    ? (theme === 'dark' ? 'bg-orange-500/5' : 'bg-orange-50/60') 
                    : ''
                }`}
              >
                {rankColor && (
                  <View className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: rankColor }} />
                )}

                <Text className={`font-sora text-lg font-bold w-10 text-center ${
                  rankColor ? '' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')
                }`} style={rankColor ? { color: rankColor } : {}}>
                  {item.rank}
                </Text>
                
                <View className="flex-1 flex-row items-center gap-4">
                  {item.avatar ? (
                    <Image 
                      source={{ uri: item.avatar }} 
                      className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700"
                    />
                  ) : (
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${
                      theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                    }`}>
                      <Text className={`font-jetbrains text-xs font-semibold ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>{item.initials || 'U'}</Text>
                    </View>
                  )}
                  <View>
                    <Text className={`font-hanken font-bold text-base ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {item.name}
                    </Text>
                    <Text className={`font-jetbrains text-xs uppercase ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {item.points} PTS
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}