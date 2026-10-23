import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';

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
  const insets = useSafeAreaInsets();
  const { userEmail, isAdmin, logout } = useAuth();
  const { theme, colors } = useTheme();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Calculate responsive profile photo size (20% of screen width, max 120)
  const photoSize = Math.min(width * 0.2, 120);
  const borderRadius = photoSize / 2;
  
  const activeEmail = userEmail || 'test@test.com';
  const [name, setName] = useState(activeEmail.split('@')[0]);
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Admin Season Creation Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonDesc, setSeasonDesc] = useState('');
  const [seasonDuration, setSeasonDuration] = useState<number>(90);
  const [autoActivate, setAutoActivate] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState(false);

  // Load saved profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Load photo from local storage for instant display
        const key = userEmail ? `@profile_photo_${userEmail}` : '@profile_photo_default';
        const savedPhoto = await AsyncStorage.getItem(key);
        if (savedPhoto) setProfilePhoto(savedPhoto);

        if (userEmail) {
          // Fetch photo
          const photoResponse = await api.getProfilePhoto(userEmail);
          if (photoResponse.success && photoResponse.photoUri) {
            setProfilePhoto(photoResponse.photoUri);
          }

          // Fetch profile info
          const profileResponse = await api.getProfile(userEmail);
          if (profileResponse.success && profileResponse.profile) {
            if (profileResponse.profile.name) setName(profileResponse.profile.name);
            if (profileResponse.profile.birthday) setBirthday(profileResponse.profile.birthday);
            if (profileResponse.profile.address) setAddress(profileResponse.profile.address);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadProfileData();
  }, [userEmail]);

  // Auto-save profile data when it changes
  useEffect(() => {
    if (!isLoaded || !userEmail) return;

    const saveProfile = async () => {
      try {
        await api.updateProfile(userEmail, { name, birthday, address });
      } catch (error) {
        console.error('Erro ao salvar perfil:', error);
      }
    };

    saveProfile();
  }, [name, birthday, address, isLoaded, userEmail]);

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
            addNotification('Foto de Perfil Atualizada 📸', 'Sua foto de perfil foi alterada com sucesso!', 'photo-camera', '#00E5FF');
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

  const handleCreateSeason = async () => {
    if (!seasonName.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o nome da nova temporada.');
      return;
    }

    try {
      setIsCreating(true);
      const now = new Date();
      const endsAt = new Date();
      endsAt.setDate(now.getDate() + Number(seasonDuration || 90));

      const res = await api.createSeason({
        name: seasonName.trim(),
        description: seasonDesc.trim() || undefined,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      });

      if (!res.success) {
        Alert.alert('Erro', res.message || 'Falha ao criar temporada.');
        setIsCreating(false);
        return;
      }

      const createdId = res.data?.id;

      if (autoActivate && createdId) {
        const actRes = await api.activateSeason(createdId);
        if (actRes.success) {
          addNotification(
            'Nova Temporada Ativa! 🏆',
            `A ${seasonName.trim()} foi ativada com sucesso! 5 novos desafios de saúde foram gerados pela IA.`,
            'emoji-events',
            '#00E5FF'
          );
          Alert.alert(
            'Temporada Criada e Ativada! 🏆',
            `A "${seasonName.trim()}" foi criada e ativada com sucesso!\n\n5 novos desafios de saúde foram gerados pela IA.`
          );
        } else {
          addNotification(
            'Temporada Criada',
            `Temporada criada, mas houve uma falha ao ativar: ${actRes.message || 'Erro'}`,
            'info',
            '#F59E0B'
          );
          Alert.alert(
            'Aviso',
            `A temporada foi criada, mas não pôde ser ativada imediatamente: ${actRes.message || 'Erro'}`
          );
        }
      } else {
        addNotification(
          'Temporada Criada 🏆',
          `A ${seasonName.trim()} foi criada com sucesso!`,
          'emoji-events',
          '#10B981'
        );
        Alert.alert('Sucesso! 🏆', `A "${seasonName.trim()}" foi criada com sucesso!`);
      }

      setSeasonName('');
      setSeasonDesc('');
      setCreateModalVisible(false);
    } catch (err: any) {
      console.error('Erro ao criar temporada:', err);
      Alert.alert('Erro', err.message || 'Erro inesperado ao criar temporada.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <ScrollView 
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 40) }}
        className={`flex-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <View className="p-6">
          <View className="justify-between mb-8 flex-row items-center">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.push('/home')} activeOpacity={0.7} className="p-1">
                <FontAwesome name="arrow-left" size={24} color={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
              </TouchableOpacity>
              <Text className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Perfil
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Sair', 'Deseja realmente sair da conta?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await logout();
                      } catch (e) {
                        console.error('Logout error:', e);
                      }
                    },
                  },
                ]);
              }}
            >
              <FontAwesome name="sign-out" size={26} color="#ef4444" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mb-6 flex-wrap">
            <TouchableOpacity onPress={pickProfilePhoto} activeOpacity={0.7}>
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={{ width: photoSize, height: photoSize, borderRadius }}
                  className="mr-6"
                />
              ) : (
                <View
                  style={{ width: photoSize, height: photoSize, borderRadius }}
                  className={`mr-6 items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}
                >
                  <FontAwesome name="user" size={photoSize * 0.5} color={colors.primary} />
                </View>
              )}
              <View
                className="absolute bottom-0 right-4 rounded-full p-2"
                style={{ backgroundColor: colors.primary }}
              >
                <FontAwesome name="camera" size={photoSize * 0.3} color="white" />
              </View>
            </TouchableOpacity>
            <View className="flex-1 min-w-0">
              <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{name || activeEmail.split('@')[0]}</Text>
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

          {/* Admin Section (Only visible for Admin users) */}
          {isAdmin && (
            <View
              className={`mt-4 p-5 rounded-2xl border ${
                theme === 'dark'
                  ? 'bg-cyan-950/20 border-cyan-500/30'
                  : 'bg-cyan-50/70 border-cyan-200'
              }`}
            >
              <View className="flex-row items-center gap-3 mb-3">
                <View
                  className={`p-2.5 rounded-xl ${
                    theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-100'
                  }`}
                >
                  <MaterialIcons
                    name="admin-panel-settings"
                    size={24}
                    color={theme === 'dark' ? '#00E5FF' : '#0284C7'}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-sora text-base font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Painel do Administrador
                  </Text>
                  <Text
                    className={`font-hanken text-xs ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Gerenciamento de temporadas e desafios do sistema
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCreateModalVisible(true)}
                className="mt-2 overflow-hidden rounded-xl shadow-md"
              >
                <LinearGradient
                  colors={['#00E5FF', '#0072FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3.5 px-4 flex-row items-center justify-center gap-2"
                >
                  <FontAwesome name="plus-circle" size={18} color="white" />
                  <Text className="text-white font-bold text-base">
                    Criar Nova Temporada
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Admin Create Season Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isCreating && setCreateModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center px-5">
          <View
            className={`w-full max-w-md rounded-3xl p-6 border ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200 shadow-2xl'
            }`}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-3">
                <View
                  className={`p-2 rounded-xl ${
                    theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-100'
                  }`}
                >
                  <MaterialIcons
                    name="emoji-events"
                    size={22}
                    color={theme === 'dark' ? '#00E5FF' : '#0284C7'}
                  />
                </View>
                <Text
                  className={`font-sora text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Nova Temporada
                </Text>
              </View>

              {!isCreating && (
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(false)}
                  className="p-1 rounded-full"
                >
                  <MaterialIcons
                    name="close"
                    size={22}
                    color={theme === 'dark' ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Inputs */}
            <View className="mb-4">
              <Text
                className={`text-xs font-bold uppercase mb-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Nome da Temporada *
              </Text>
              <TextInput
                value={seasonName}
                onChangeText={setSeasonName}
                placeholder="Ex: Temporada 5: Primavera Saudável"
                placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
                className={`h-12 border rounded-xl px-4 font-sans ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                editable={!isCreating}
              />
            </View>

            <View className="mb-4">
              <Text
                className={`text-xs font-bold uppercase mb-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Descrição / Lema
              </Text>
              <TextInput
                value={seasonDesc}
                onChangeText={setSeasonDesc}
                placeholder="Ex: Supere limites e conquiste novos hábitos!"
                placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
                className={`h-12 border rounded-xl px-4 font-sans ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                editable={!isCreating}
              />
            </View>

            {/* Duration Selector */}
            <View className="mb-4">
              <Text
                className={`text-xs font-bold uppercase mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Duração da Temporada
              </Text>
              <View className="flex-row gap-2">
                {[30, 60, 90].map((days) => {
                  const isSelected = seasonDuration === days;
                  return (
                    <TouchableOpacity
                      key={days}
                      onPress={() => !isCreating && setSeasonDuration(days)}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        isSelected
                          ? theme === 'dark'
                            ? 'bg-cyan-500/20 border-cyan-400'
                            : 'bg-cyan-100 border-cyan-500'
                          : theme === 'dark'
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected
                            ? theme === 'dark'
                              ? 'text-cyan-400'
                              : 'text-cyan-700'
                            : theme === 'dark'
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        {days} Dias
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Auto-Activate with AI Generator */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !isCreating && setAutoActivate(!autoActivate)}
              className="flex-row items-center gap-3 mb-6 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
            >
              <MaterialIcons
                name={autoActivate ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color={theme === 'dark' ? '#00E5FF' : '#0284C7'}
              />
              <View className="flex-1">
                <Text
                  className={`text-xs font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Ativar Imediatamente
                </Text>
                <Text
                  className={`text-[11px] ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Gera automaticamente 5 novos desafios via IA e encerra a anterior.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                disabled={isCreating}
                onPress={() => setCreateModalVisible(false)}
                className={`flex-1 py-3.5 rounded-xl border items-center justify-center ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800'
                    : 'border-slate-300 bg-slate-100'
                }`}
              >
                <Text
                  className={`font-bold ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isCreating}
                onPress={handleCreateSeason}
                className="flex-1 rounded-xl overflow-hidden shadow-md"
              >
                <LinearGradient
                  colors={['#00E5FF', '#0072FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3.5 items-center justify-center flex-row gap-2"
                >
                  {isCreating ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text className="text-white font-bold text-sm">Criando...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="add" size={20} color="white" />
                      <Text className="text-white font-bold text-sm">Criar Temporada</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
