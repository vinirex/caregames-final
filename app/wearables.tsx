import React, { useState } from 'react';
import { Link } from 'expo-router';
import { Text, View, TouchableOpacity, Alert, Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { FontAwesome5 } from '@expo/vector-icons';

export default function WearablesScreen() {
  const { theme, colors } = useTheme();
  const { addPoints } = usePoints();

  const [isWearableConnected, setIsWearableConnected] = useState(false);
  const [steps, setSteps] = useState(0);
  const [bpm, setBpm] = useState(0);

  const handleConnectWearable = () => {
    setIsWearableConnected(prev => !prev);
    if (!isWearableConnected) {
      Alert.alert('Conectado!', 'Seu wearable foi conectado com sucesso.');
      // Simulate data reception
      const randomSteps = Math.floor(Math.random() * 5000) + 5000; // 5000-10000 steps
      const randomBpm = Math.floor(Math.random() * 30) + 70; // 70-100 bpm
      setSteps(randomSteps);
      setBpm(randomBpm);
      addPoints(Math.floor(randomSteps / 100)); // 1 point per 100 steps
      Alert.alert('Pontos Ganhos!', `Você ganhou ${Math.floor(randomSteps / 100)} pontos por seus passos!`);
    } else {
      Alert.alert('Desconectado!', 'Seu wearable foi desconectado.');
      setSteps(0);
      setBpm(0);
    }
  };

  return (
    <View
      className={`flex-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      style={{ padding: 24, paddingTop: 48 }}
    >
      <View className="justify-between mb-8 flex-row items-center">
        <Text className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Wearables
        </Text>
        <Link href="/home">
          <FontAwesome6 name="house-chimney" size={32} color={colors.primary} />
        </Link>
      </View>

      <View className={`p-6 rounded-2xl shadow-lg shadow-black/40 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Conectar Wearable
          </Text>
          <Switch
            value={isWearableConnected}
            onValueChange={handleConnectWearable}
            thumbColor={isWearableConnected ? colors.primary : (theme === 'dark' ? '#ccc' : '#999')}
            trackColor={{ false: theme === 'dark' ? '#555' : '#ddd', true: colors.primary + '50' }}
          />
        </View>
        <Text className={`text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {isWearableConnected
            ? 'Seu dispositivo está conectado e sincronizando dados.'
            : 'Conecte seu wearable para sincronizar passos e batimentos cardíacos.'}
        </Text>
      </View>

      {isWearableConnected && (
        <View className={`p-6 rounded-2xl shadow-lg shadow-black/40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Dados do Wearable
          </Text>
          <View className="flex-row items-center mb-3">
            <FontAwesome5 name="shoe-prints" size={24} color={colors.primary} />
            <Text className={`text-lg ml-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Passos: {steps}
            </Text>
          </View>
          <View className="flex-row items-center">
            <FontAwesome5 name="heartbeat" size={24} color="red" />
            <Text className={`text-lg ml-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              BPM: {bpm}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              const newSteps = Math.floor(Math.random() * 2000) + 1000; // Simulate more steps
              const newBpm = Math.floor(Math.random() * 10) + 70;
              setSteps(prev => prev + newSteps);
              setBpm(newBpm);
              addPoints(Math.floor(newSteps / 100));
              Alert.alert('Dados Atualizados!', `Você ganhou ${Math.floor(newSteps / 100)} pontos por ${newSteps} passos adicionais!`);
            }}
            className={`mt-6 p-3 rounded-lg items-center ${theme === 'dark' ? 'bg-blue-700' : 'bg-blue-500'}`}
          >
            <Text className="text-white font-bold">Sincronizar Dados</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}