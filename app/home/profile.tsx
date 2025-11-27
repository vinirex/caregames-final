import React, { useState } from 'react';
import { Text, View, Image, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
// Helper component for editable fields
const EditableField = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (text: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' | 'email-address' | 'ascii-capable' | 'numbers-and-punctuation' | 'url' | 'number-pad' | 'phone-pad' | 'name-phone-pad' | 'decimal-pad' | 'twitter' | 'web-search' | 'visible-password'; }) => {
  const { theme } = useTheme();
  return (
    <View className="w-full mb-6">
      <Text className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{label}</Text>
      <TextInput
        className={`h-12 border rounded-lg px-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
        keyboardType={keyboardType}
      />
    </View>
  );
};

export default function ProfileScreen() {    
  const { userEmail } = useAuth();
  const { theme, colors } = useTheme();
  // In a real app, this data would come from your auth context or API
  const [name, setName] = useState('Nome do Usuário');
  const [birthday, setBirthday] = useState('Aniversário');
  const [address, setAddress] = useState('Endereço');

  return (
    <ScrollView className={`flex-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="p-6">
        <View className="justify-between mb-8 flex-row items-center">
          <Text className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Profile
          </Text>
        </View>
        <View className="flex-row items-center mb-6">
          <Image
            source={require('../../assets/images/profile-placeholder.png')} // Placeholder image
            className="w-24 h-24 rounded-full mr-6"
          />
          <View>
            <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{name || 'User Name'}</Text>
            <Text className={`text-md mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{userEmail || 'user@example.com'}</Text>
          </View>
        </View>

        <Text className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Personal Information
        </Text>

        <EditableField
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
        />
        <EditableField
          label="Birthday"
          value={birthday}
          onChangeText={setBirthday}
          placeholder="MM/DD/YYYY"
        />
        <EditableField
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Your address"
        />
      </View>
    </ScrollView>
  );
}