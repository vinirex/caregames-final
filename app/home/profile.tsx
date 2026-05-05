import React, { useState, useEffect } from 'react';
import { Text, View, Image, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

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
  const { userEmail, logout } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();
  // In a real app, this data would come from your auth context or API
  const [name, setName] = useState('Nome do Usuário');
  const [birthday, setBirthday] = useState('Aniversário');
  const [address, setAddress] = useState('Endereço');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Load saved profile photo on mount
  useEffect(() => {
    const loadProfilePhoto = async () => {
      try {
        // First try local AsyncStorage for instant display
        const key = userEmail ? `@profile_photo_${userEmail}` : '@profile_photo_default';
        const savedPhoto = await AsyncStorage.getItem(key);
        if (savedPhoto) {
          setProfilePhoto(savedPhoto);
        }

        // Also fetch from API (simulated DB)
        if (userEmail) {
          const response = await api.getProfilePhoto(userEmail);
          if (response.success && response.photoUri) {
            setProfilePhoto(response.photoUri);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar foto de perfil:', error);
      }
    };
    loadProfilePhoto();
  }, [userEmail]);

  const pickProfilePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar sua galeria de fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const photoUri = result.assets[0].uri;
      setProfilePhoto(photoUri);

      try {
        // Save locally in AsyncStorage
        const key = userEmail ? `@profile_photo_${userEmail}` : '@profile_photo_default';
        await AsyncStorage.setItem(key, photoUri);

        // Send to API (simulated DB)
        if (userEmail) {
          const response = await api.uploadProfilePhoto(userEmail, photoUri);
          if (response.success) {
            Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
          } else {
            Alert.alert('Aviso', 'Foto salva localmente, mas houve um erro ao enviar para o servidor.');
          }
        }
      } catch (error) {
        console.error('Erro ao salvar foto de perfil:', error);
        Alert.alert('Erro', 'Não foi possível salvar a foto de perfil.');
      }
    }
  };

  return (
    <ScrollView className={`flex-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="p-6">
        <View className="justify-between mb-8 flex-row items-center">
          <Text className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Perfil
          </Text>
          <TouchableOpacity
            onPress={() => {
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
            }}
          >
            <FontAwesome name="sign-out" size={28} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={pickProfilePhoto} activeOpacity={0.7}>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                className="mr-6"
              />
            ) : (
              <Image
                source={require('../../assets/images/profile-placeholder.png')}
                className="w-24 h-24 rounded-full mr-6"
              />
            )}
            <View
              className="absolute bottom-0 right-4 rounded-full p-1.5"
              style={{ backgroundColor: colors.primary }}
            >
              <FontAwesome name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
          <View>
            <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{name || 'Nome do Usuário'}</Text>
            <Text className={`text-md mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{userEmail || 'user@example.com'}</Text>
            <TouchableOpacity onPress={pickProfilePhoto}>
              <Text className={`text-sm mt-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Alterar foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Informações Pessoais
        </Text>

        <EditableField
          label="Nome Completo"
          value={name}
          onChangeText={setName}
          placeholder="Seu nome completo"
        />
        <EditableField
          label="Data de Nascimento"
          value={birthday}
          onChangeText={setBirthday}
          placeholder="DD/MM/AAAA"
        />
        <EditableField
          label="Endereço"
          value={address}
          onChangeText={setAddress}
          placeholder="Seu endereço"
        />
      </View>
    </ScrollView>
  );
}