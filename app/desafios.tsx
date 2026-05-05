import React, { useState, useEffect } from "react";
import { Link } from 'expo-router';
import { Text, View, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { usePoints } from "../context/PointsContext";
import { CustomButton } from '../components/CustomButton';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as ImagePicker from 'expo-image-picker';

interface Challenge {
  id: string;
  title: string;
  points: number;
  description: string;
  requiresPhoto?: boolean;
}

export default function ChallengesScreen() {
  const { theme, colors } = useTheme();
  const { addPoints } = usePoints();
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [challengePhotos, setChallengePhotos] = useState<{ [key: string]: string | null }>({});

  const allChallenges: Challenge[] = [
    { id: '1', title: '1000 passos por dia', points: 100, description: 'Caminhe pelo menos 1000 passos todos os dias para melhorar sua saúde cardiovascular.' },
    { id: '2', title: 'Beber 2L de água', points: 50, description: 'Mantenha-se hidratado bebendo pelo menos 2 litros de água diariamente.', requiresPhoto: true },
    { id: '3', title: '5 minutos de meditação', points: 75, description: 'Dedique 5 minutos do seu dia para meditar e reduzir o estresse.' },
    { id: '4', title: 'Comer uma fruta por dia', points: 30, description: 'Adicione uma porção de fruta à sua dieta diária para mais vitaminas.', requiresPhoto: true },
    { id: '5', title: 'Alongamento matinal', points: 40, description: 'Comece o dia com 10 minutos de alongamento para flexibilidade.' },
    { id: '6', title: 'Dormir 7-8 horas', points: 120, description: 'Garanta uma boa noite de sono, dormindo entre 7 e 8 horas.' },
    { id: '7', title: 'Evitar açúcar refinado', points: 90, description: 'Desafie-se a passar um dia sem consumir açúcar refinado.' },
    { id: '8', title: 'Subir escadas (5 andares)', points: 60, description: 'Troque o elevador pelas escadas e suba pelo menos 5 andares.' },
    { id: '9', title: 'Ler por 15 minutos', points: 20, description: 'Estimule sua mente lendo um livro ou artigo por 15 minutos.' },
    { id: '10', title: 'Preparar uma refeição saudável', points: 80, description: 'Cozinhe uma refeição nutritiva e balanceada em casa.', requiresPhoto: true },
  ];

  useEffect(() => {
    setActiveChallenges(allChallenges);
  }, []);

  const toggleDescription = (challengeId: string) => {
    setExpandedChallenge(expandedChallenge === challengeId ? null : challengeId);
  };

  const completeChallenge = (challenge: Challenge) => {
    if (challenge.requiresPhoto && !challengePhotos[challenge.id]) {
      Alert.alert('Foto Necessária', 'Este desafio requer uma foto como comprovação!');
      return;
    }

    addPoints(challenge.points);
    setActiveChallenges(prevChallenges => prevChallenges.filter(c => c.id !== challenge.id));
    setExpandedChallenge(null);
  };

  const pickImage = async (challengeId: string) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permissão negada', 'Precisamos de permissão para acessar a galeria de fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setChallengePhotos(prev => ({ ...prev, [challengeId]: result.assets[0].uri }));
    }
  };

  return (
    <ScrollView
      className={`${theme === "dark" ? "bg-gray-900" : "bg-white"}`}
      contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
    >
      <View className="justify-between mb-8 mt-6 flex-row items-center p-4">
        <Text
          className={` text-4xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          Desafios
        </Text>
        <Link href="/home">
          <FontAwesome6 name="house-chimney" size={32} color={colors.primary} />
        </Link>
      </View>

      {activeChallenges.map((challenge) => (
        <View key={challenge.id} className="mb-4">
          <TouchableOpacity
            className={`shadow-lg shadow-black/40 rounded-2xl p-4 w-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
            onPress={() => toggleDescription(challenge.id)}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text
                  className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  {challenge.title}
                </Text>
                <Text
                  className={`text-md font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                >
                  {challenge.points} pts
                </Text>
              </View>
              {challenge.requiresPhoto && (
                <FontAwesome6 name="camera" size={20} color={colors.primary} />
              )}
            </View>
            
            {expandedChallenge === challenge.id && (
              <View className="mt-4">
                <Text
                  className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}
                >
                  {challenge.description}
                </Text>

                {challenge.requiresPhoto && (
                  <View className="mb-4">
                    {challengePhotos[challenge.id] ? (
                      <View className="items-center mb-4">
                        <Image 
                          source={{ uri: challengePhotos[challenge.id] as string }} 
                          style={{ width: '100%', height: 150, borderRadius: 10 }} 
                        />
                        <TouchableOpacity onPress={() => pickImage(challenge.id)} className="mt-2">
                          <Text className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Trocar Foto</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => pickImage(challenge.id)}
                        className={`p-4 rounded-xl border border-dashed ${theme === 'dark' ? 'border-gray-500 bg-gray-700' : 'border-gray-400 bg-gray-200'} items-center`}
                      >
                        <FontAwesome6 name="camera" size={24} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                        <Text className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Enviar Foto Comprovação</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
          {expandedChallenge === challenge.id && (
            <CustomButton title="Completar Desafio" onPress={() => completeChallenge(challenge)} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}
