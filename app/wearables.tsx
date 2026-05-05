import React, { useState, useEffect } from 'react';
import { Link } from 'expo-router';
import { Text, View, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { FontAwesome5 } from '@expo/vector-icons';
import { ioTService, IoTData } from '../services/IoTService';

export default function WearablesScreen() {
  const { theme, colors } = useTheme();
  const { addPoints } = usePoints();

  const [isWearableConnected, setIsWearableConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [steps, setSteps] = useState(0);
  const [bpm, setBpm] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (isWearableConnected) {
      setIsConnecting(true);
      ioTService.connect();
      
      // Simulate connection delay for UI feedback
      setTimeout(() => {
        setIsConnecting(false);
        Alert.alert('Conectado!', 'Seu wearable foi conectado com sucesso via WebSocket.');
      }, 1000);

      unsubscribe = ioTService.subscribe((data: IoTData) => {
        setSteps(data.steps);
        setBpm(data.heartRate);
        
        // Example: Add points for steps received dynamically
        if (data.steps > 0 && data.steps % 10 === 0) {
          addPoints(1);
        }
      });
    } else {
      ioTService.disconnect();
      setSteps(0);
      setBpm(0);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      ioTService.disconnect();
    };
  }, [isWearableConnected]);

  const handleConnectWearable = (value: boolean) => {
    setIsWearableConnected(value);
    if (!value) {
      Alert.alert('Desconectado!', 'Seu wearable foi desconectado.');
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
            Conectar Wearable (IoT)
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
            ? 'Seu dispositivo está conectado via WebSocket recebendo dados em tempo real.'
            : 'Ative para conectar seu wearable simulado e receber dados IoT em tempo real.'}
        </Text>
      </View>

      {isConnecting && (
        <View className="items-center justify-center p-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className={`mt-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Conectando ao broker IoT...</Text>
        </View>
      )}

      {isWearableConnected && !isConnecting && (
        <View className={`p-6 rounded-2xl shadow-lg shadow-black/40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Dados em Tempo Real
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
          
          <View className="mt-6 flex-row items-center justify-center">
            <ActivityIndicator size="small" color="green" />
            <Text className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Aguardando transmissão MQTT/WS...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}