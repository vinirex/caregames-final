import React from 'react';
import { Link } from 'expo-router';
import { Text, View, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

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
    title: 'Consulta com Nutricionista',
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

export default function BenefitsScreen() {
  const { theme, colors } = useTheme();
  const { points, spendPoints } = usePoints();

  const handleRedeem = (benefit: Benefit) => {
    if (points >= benefit.points) {
      spendPoints(benefit.points);
      Alert.alert('Benefício Resgatado!', `Você resgatou "${benefit.title}" com sucesso.`);
    } else {
      Alert.alert('Pontos Insuficientes', `Você não tem pontos suficientes para resgatar "${benefit.title}".`);
    }
  };

  return (
    <ScrollView
      className={`flex-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      contentContainerStyle={{ padding: 24, paddingTop: 48 }}
    >
      <View className="justify-between mb-8 flex-row items-center">
        <Text className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Benefícios
        </Text>
        <Link href="/home">
          <FontAwesome6 name="house-chimney" size={32} color={colors.primary} />
        </Link>
      </View>

      {benefitsData.map((benefit) => (
        <View key={benefit.id} className={`flex-row items-center p-4 rounded-2xl shadow-lg shadow-black/40 mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Image source={{ uri: benefit.image }} className="w-20 h-20 rounded-lg mr-4" />
          <View className="flex-1">
            <Text className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{benefit.title}</Text>
            <Text className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{benefit.description}</Text>
            <Text className={`mt-2 font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{benefit.points} pts</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRedeem(benefit)}
            className="ml-4 bg-blue-600 p-3 rounded-lg"
          >
            <Text className="text-white font-bold">Resgatar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}