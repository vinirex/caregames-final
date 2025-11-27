import React from 'react';
import { Link } from 'expo-router';
import { Text, View, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePoints } from '../context/PointsContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function RankingsScreen() {
  const { theme, colors } = useTheme();
  const { points } = usePoints();

  const rankings = [
    { id: '1', name: 'Alice Smith', points: 1250 },
    { id: '2', name: 'Bob Johnson', points: 1180 },
    { id: '3', name: 'Charlie Brown', points: 1020 },
    { id: '4', name: 'Diana Prince', points: 980 },
    { id: '5', name: 'Ethan Hunt', points: 910 },
    { id: '6', name: 'Fiona Glenanne', points: 870 },
    { id: '7', name: 'George Costanza', points: 820 },
    { id: '8', name: 'Hannah Montana', points: 790 },
    { id: '9', name: 'Ian Malcolm', points: 750 },
    { id: '10', name: 'Jessica Day', points: 700 },
    { id: '11', name: 'Kyle Broflovski', points: 680 },
    { id: '12', name: 'Laura Croft', points: 650 },
    { id: '13', name: 'Michael Scott', points: 620 },
    { id: '14', name: 'Nancy Drew', points: 590 },
    { id: '15', name: 'Oliver Queen', points: 560 },
    { id: '16', name: 'Pam Beesly', points: 530 },
    { id: '17', name: 'Quinn Fabray', points: 500 },
    { id: '18', name: 'Rachel Green', points: 470 },
    { id: '19', name: 'Steve Rogers', points: 440 },
    { id: '20', name: 'Tina Belcher', points: 410 },
    { id: '21', name: 'You', points: points },
  ].sort((a, b) => b.points - a.points);

  return (
    <ScrollView
      className={`flex-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      contentContainerStyle={{ padding: 24 }}
    >
      <View className="justify-between mb-8 flex-row items-center p-4">
        <Text
          className={`text-4xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          Rankings
        </Text>
        <Link href="/home">
          <FontAwesome6 name="house-chimney" size={32} color={colors.primary} />
        </Link>
      </View>

      <View className="mb-4 flex-row justify-between p-4 rounded-lg bg-blue-500">
        <Text className="text-white font-bold text-lg w-1/6 text-center">Pos.</Text>
        <Text className="text-white font-bold text-lg w-3/6">Name</Text>
        <Text className="text-white font-bold text-lg w-2/6 text-right">Points</Text>
      </View>

      {rankings.map((user, index) => {
        const position = index + 1;
        const isUser = user.name === 'You';

        return (
          <View
            key={user.id}
            className={`flex-row justify-between items-center p-4 rounded-lg mb-2 ${
              isUser ? 'bg-green-500' :
              position === 1 ? 'bg-yellow-400' :
              position === 2 ? 'bg-gray-400' :
              position === 3 ? 'bg-amber-700' :
              (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100')
            }`}
          >
            <Text className={`text-lg font-semibold w-1/6 text-center ${position <= 3 || isUser ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-black')}`}>{position}</Text>
            <Text className={`text-lg font-semibold w-3/6 ${position <= 3 || isUser ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-black')}`}>{user.name}</Text>
            <Text className={`text-lg font-semibold w-2/6 text-right ${position <= 3 || isUser ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-black')}`}>{user.points}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}