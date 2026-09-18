import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { theme } = useTheme();

  const tabs = [
    { name: 'home', label: 'Início', icon: 'home' as const },
    { name: 'desafios', label: 'Desafios', icon: 'emoji-events' as const },
    { name: 'rankings', label: 'Rankings', icon: 'leaderboard' as const },
    { name: 'wearables', label: 'Connect', icon: 'watch' as const },
    { name: 'beneficios', label: 'Recompensas', icon: 'card-giftcard' as const },
  ];

  return (
    <View 
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      className={`absolute bottom-0 left-0 w-full flex-row justify-around items-center px-2 pt-3 border-t shadow-lg z-50 ${
        theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}
    >
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.name) || (tab.name === 'home' && pathname === '/home');
        
        return (
          <TouchableOpacity 
            key={tab.name}
            onPress={() => router.push(`/${tab.name}`)}
            className={`flex-col items-center justify-center px-3 py-1 rounded-xl ${
              isActive 
                ? (theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50') 
                : ''
            }`}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={tab.icon} 
              size={22} 
              color={isActive 
                ? (theme === 'dark' ? '#00E5FF' : '#0284C7') 
                : (theme === 'dark' ? '#94A3B8' : '#64748B')
              } 
              style={{ marginBottom: 2 }}
            />
            <Text 
              style={{ includeFontPadding: false, textAlignVertical: 'center' }}
              className={`font-jetbrains text-[10px] uppercase ${
                isActive 
                  ? (theme === 'dark' ? 'text-cyan-400 font-bold' : 'text-cyan-700 font-bold') 
                  : (theme === 'dark' ? 'text-slate-400' : 'text-slate-600')
              }`}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyan-500" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
