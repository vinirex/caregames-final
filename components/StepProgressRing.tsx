import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface StepProgressRingProps {
  steps: number;
  goal?: number;
  size?: number;
  strokeWidth?: number;
  theme: 'dark' | 'light';
}

export function StepProgressRing({
  steps,
  goal = 10000,
  size = 200,
  strokeWidth = 14,
  theme,
}: StepProgressRingProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const percentage = Math.min(100, Math.max(0, (steps / goal) * 100));
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  const gradientId = 'stepGradient';

  return (
    <View style={{ width: size, height: size }} className="relative items-center justify-center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
            <Stop offset="100%" stopColor={theme === 'dark' ? '#3B82F6' : '#0D9488'} />
          </LinearGradient>
        </Defs>

        {/* Background Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle Fill */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {/* Center Text displaying step count & goal */}
      <View className="absolute items-center justify-center">
        <Text
          className={`font-sora text-4xl font-extrabold tracking-tighter mb-0.5 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}
        >
          {steps.toLocaleString('pt-BR')}
        </Text>
        <Text
          className={`font-jetbrains text-[11px] uppercase font-bold tracking-wider ${
            theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
          }`}
        >
          {percentage.toFixed(0)}% / {goal.toLocaleString('pt-BR')} META
        </Text>
      </View>
    </View>
  );
}
