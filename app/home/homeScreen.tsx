import React from 'react';
import { Link, useRouter } from 'expo-router';
import { Text, View, ImageBackground, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { usePoints } from '../../context/PointsContext';
import { useAuth } from '../../context/AuthContext';
import CarePlusDark from '../../assets/images/CarePlusDark.png';
import CarePlusLight from '../../assets/images/CarePlusLight.png';

export default function HomeScreen() {
  const { theme, colors } = useTheme();
  const { points } = usePoints();
  const { logout } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // Calculate responsive card size
  const cardSize = Math.min((width - 48) / 2, 160); // 48 = padding (24*2) + gaps
  const iconSize = cardSize * 0.25;
  const textSize = cardSize * 0.12;

  const backgroundImage = theme === 'dark'
    ? CarePlusDark
    : CarePlusLight;

  return (
    <ImageBackground
        source={backgroundImage}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
      <View className={`flex-1 items-center justify-center px-6`}>
        <TouchableOpacity
          className="absolute top-12 right-6 z-10"
          onPress={async () => {
            if (Platform.OS === 'web') {
              const confirmed = window.confirm('Deseja realmente sair da conta?');
              if (confirmed) {
                await logout();
                router.replace('/');
              }
            } else {
              Alert.alert('Sair', 'Deseja realmente sair da conta?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sair',
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    router.replace('/');
                  },
                },
              ]);
            }
          }}
        >
          <FontAwesome name="sign-out" size={26} color="#ef4444" />
        </TouchableOpacity>

        <View className="flex-1 flex items-center justify-center">
          <Text className={`text-2xl font-semibold mb-8 text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Bem-vindo ao CareGamesPlus</Text>
          
          <View style={{ width: '100%', maxWidth: cardSize * 2 + 24 }}>
            {/* First Row */}
            <View className="flex-row justify-center gap-3 mb-4">
              <Link href="/desafios" asChild>
                <TouchableOpacity 
                  style={{ width: cardSize, height: cardSize }}
                  className={`items-center justify-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <FontAwesome name="signal" size={iconSize} color={colors.primary} />
                  <Text style={{ fontSize: textSize }} className={`font-semibold mt-2 text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Desafios</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/rankings" asChild>
                <TouchableOpacity 
                  style={{ width: cardSize, height: cardSize }}
                  className={`items-center justify-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <FontAwesome name="trophy" size={iconSize} color={colors.primary} />
                  <Text style={{ fontSize: textSize }} className={`font-semibold mt-2 text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Ranking</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Second Row */}
            <View className="flex-row justify-center gap-3">
              <Link href="/wearables" asChild>
                <TouchableOpacity 
                  style={{ width: cardSize, height: cardSize }}
                  className={`items-center justify-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <FontAwesome name="code" size={iconSize} color={colors.primary} />
                  <Text style={{ fontSize: textSize }} className={`font-semibold mt-2 text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Wearables</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/beneficios" asChild>
                <TouchableOpacity 
                  style={{ width: cardSize, height: cardSize }}
                  className={`items-center justify-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <FontAwesome name="gift" size={iconSize} color={colors.primary} />
                  <Text style={{ fontSize: textSize }} className={`font-semibold mt-2 text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Benefícios</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>

        <View className={`mb-8 p-4 rounded-full ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-200/80'}`}>
          <View className="flex-row items-center">
            <FontAwesome5 name="star" size={24} color='yellow' solid />
            <Text className={`text-xl font-bold ml-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{points}</Text>
          </View>
        </View>
      </View>
      </ImageBackground>
  );
}