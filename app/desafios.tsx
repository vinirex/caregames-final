import React, { useState, useEffect } from "react";
import { Link } from 'expo-router';
import { Text, View, TouchableOpacity, ScrollView} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { usePoints } from "../context/PointsContext";
import { CustomButton } from '../components/CustomButton';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

interface Challenge {
  id: string;
  title: string;
  points: number;
  description: string;
}

export default function ChallengesScreen() {
  const { theme, colors } = useTheme();
  const { addPoints } = usePoints();
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);

  const allChallenges: Challenge[] = [
    { id: '1', title: '1000 passos por dia', points: 100, description: 'Caminhe pelo menos 1000 passos todos os dias para melhorar sua saúde cardiovascular.' },
    { id: '2', title: 'Beber 2L de água', points: 50, description: 'Mantenha-se hidratado bebendo pelo menos 2 litros de água diariamente.' },
    { id: '3', title: '5 minutos de meditação', points: 75, description: 'Dedique 5 minutos do seu dia para meditar e reduzir o estresse.' },
    { id: '4', title: 'Comer uma fruta por dia', points: 30, description: 'Adicione uma porção de fruta à sua dieta diária para mais vitaminas.' },
    { id: '5', title: 'Alongamento matinal', points: 40, description: 'Comece o dia com 10 minutos de alongamento para flexibilidade.' },
    { id: '6', title: 'Dormir 7-8 horas', points: 120, description: 'Garanta uma boa noite de sono, dormindo entre 7 e 8 horas.' },
    { id: '7', title: 'Evitar açúcar refinado', points: 90, description: 'Desafie-se a passar um dia sem consumir açúcar refinado.' },
    { id: '8', title: 'Subir escadas (5 andares)', points: 60, description: 'Troque o elevador pelas escadas e suba pelo menos 5 andares.' },
    { id: '9', title: 'Ler por 15 minutos', points: 20, description: 'Estimule sua mente lendo um livro ou artigo por 15 minutos.' },
    { id: '10', title: 'Preparar uma refeição saudável', points: 80, description: 'Cozinhe uma refeição nutritiva e balanceada em casa.' },
  ];

  useEffect(() => {
    // Initialize active challenges with all challenges
    setActiveChallenges(allChallenges);
  }, []);

  const toggleDescription = (challengeId: string) => {
    setExpandedChallenge(expandedChallenge === challengeId ? null : challengeId);
  };

  const completeChallenge = (challengeId: string, points: number) => {
    addPoints(points);
    setActiveChallenges(prevChallenges => prevChallenges.filter(challenge => challenge.id !== challengeId));
    setExpandedChallenge(null); // Collapse the completed challenge
  };
  
  return (
    <ScrollView
      className={`${theme === "dark" ? "bg-gray-900" : "bg-white"}`}
      contentContainerStyle={{ padding: 24 }}
    >
 <View className="justify-between mb-8 flex-row items-center p-4">

      <Text
        className={` text-4xl font-bold ${theme === "dark" ? "text-white" : "text-black"
          }`}
      >
        Challenges
      </Text>
      <Link href="/home">
      <FontAwesome6 name="house-chimney" size={32} color={colors.primary} />
      </Link>
      </View>

 {activeChallenges.map((challenge) => (
 <View key={challenge.id} className="mb-4">
 <TouchableOpacity
 className={`shadow-lg shadow-black/40 rounded-2xl p-4 w-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"
 }`}
 onPress={() => toggleDescription(challenge.id)}
 >
 <View className="flex-row justify-between items-center">
 <View>
 <Text
 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"
 }`}
 >
 {challenge.title}
 </Text>
 <Text
 className={`text-md font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"
 }`}
 >
 {challenge.points} pts
 </Text>
 </View>
 </View>
 {expandedChallenge === challenge.id && (
 <Text
 className={`mt-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
 }`}
 >
 {challenge.description}
 </Text>
 )}
 </TouchableOpacity>
 {expandedChallenge === challenge.id && (
 <CustomButton title="Complete Challenge" onPress={() => {
      completeChallenge(challenge.id, challenge.points);
      alert(`Desafio "${challenge.title}" completado! Você ganhou ${challenge.points} pontos.`);
    }} />
 )}
 </View>
 ))}
    </ScrollView>
  );
}
