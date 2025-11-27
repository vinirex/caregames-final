import React from 'react';
import { Link } from 'expo-router';
import { Text, View, ImageBackground, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { usePoints } from '../../context/PointsContext';
import CarePlusDark from '../../assets/images/CarePlusDark.png';
import CarePlusLight from '../../assets/images/CarePlusLight.png';

export default function HomeScreen() {
  const { theme, colors } = useTheme();
  const { points } = usePoints();

  const backgroundImage = theme === 'dark'
    ? CarePlusDark
    : CarePlusLight;

  return (
    <View className="flex-1">
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      
      <View className={`absolute inset-0 flex-2 items-center justify-center p-6`}>
        <Text className={`text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Bem-vindo ao CareGamesPlus </Text>
        <View className="flex-col justify-around w-full max-w-md">
          <View className="flex-row justify-around w-full mb-4">
            <Link href="/desafios" asChild>
              <TouchableOpacity className={`items-center justify-center p-6 rounded-2xl w-40 h-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <FontAwesome name="signal" size={32} color={colors.primary} />
                <Text className={`text-lg font-semibold mt-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Desafios</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/rankings" asChild>
              <TouchableOpacity className={`items-center justify-center p-6 rounded-2xl w-40 h-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <FontAwesome name="trophy" size={32} color={colors.primary} />
                <Text className={`text-lg font-semibold mt-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Ranking</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View className="flex-row justify-around w-full">
            <Link href="/wearables" asChild>
              <TouchableOpacity className={`items-center justify-center p-6 rounded-2xl w-40 h-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <FontAwesome name="code" size={32} color={colors.primary} />
                <Text className={`text-lg font-semibold mt-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Wearables</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/beneficios" asChild>
              <TouchableOpacity className={`items-center justify-center p-6 rounded-2xl w-40 h-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <FontAwesome name="gift" size={32} color={colors.primary} />
                <Text className={`text-lg font-semibold mt-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Benefícios</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        <View className={`absolute bottom-20 p-4 rounded-full ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-200/80'}`}>
        <View className="flex-row items-center">
          <FontAwesome5 name="star" size={24} color='yellow' solid />
          <Text className={`text-xl font-bold ml-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{points}</Text>
        </View>
      </View>
      </View>
    </View >
  );
}