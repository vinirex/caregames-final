import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Share, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface TopAppBarProps {
  title?: string;
  onMenuPress?: () => void;
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

export function TopAppBar({ title = "Care Games +", onMenuPress }: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme } = useTheme();
  const { userEmail, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications();

  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const activeEmail = userEmail || 'test@test.com';
  const [userName, setUserName] = useState<string>(activeEmail.split('@')[0]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const photoKey = `@profile_photo_${activeEmail}`;
        const savedPhoto = await AsyncStorage.getItem(photoKey);
        if (savedPhoto) setUserPhoto(savedPhoto);

        const photoRes = await api.getProfilePhoto(activeEmail);
        if (photoRes.success && photoRes.photoUri) {
          setUserPhoto(photoRes.photoUri);
        }

        const profileRes = await api.getProfile(activeEmail);
        if (profileRes.success && profileRes.profile?.name) {
          setUserName(profileRes.profile.name);
        } else if (activeEmail) {
          setUserName(activeEmail.split('@')[0]);
        }
      } catch (e) {
        console.error('Error loading top bar profile data:', e);
      }
    };

    loadUserData();
  }, [activeEmail, menuVisible, userEmail]);

  const handleChangePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar sua galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const photoUri = result.assets[0].uri;
        setUserPhoto(photoUri);

        const photoKey = `@profile_photo_${activeEmail}`;
        await AsyncStorage.setItem(photoKey, photoUri);
        await api.uploadProfilePhoto(activeEmail, photoUri);
        addNotification('Foto de Perfil Atualizada 📸', 'Sua foto de perfil foi alterada com sucesso!', 'photo-camera', '#00E5FF');
      }
    } catch (e) {
      console.error('Error picking photo:', e);
    }
  };

  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: `🏆 Junte-se a mim no Care Games + ! Complete desafios de saúde, ganhe pontos e suba no ranking global. Baixe agora!`,
        title: 'Convite - Care Games +',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenMenu = () => {
    if (onMenuPress) {
      onMenuPress();
    }
    setMenuVisible(true);
  };

  const hasReadNotifications = notifications.some(n => n.read);

  return (
    <>
      <View 
        style={{ paddingTop: insets.top, height: 64 + insets.top }}
        className={`w-full flex-row justify-between items-center px-5 border-b z-50 ${
          theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={handleOpenMenu} activeOpacity={0.7} className="flex-row items-center gap-3">
            <View className={`w-9 h-9 rounded-full overflow-hidden border-2 ${theme === 'dark' ? 'border-cyan-400' : 'border-cyan-600'} shadow-md`}>
              <Image 
                source={{ uri: userPhoto || DEFAULT_AVATAR }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
          <Text className={`font-sora font-bold text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={toggleTheme} className="relative active:scale-95 p-1">
            <MaterialIcons name={theme === 'dark' ? 'light-mode' : 'dark-mode'} size={24} color={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setNotificationsVisible(true)} className="relative active:scale-95 p-1">
            <MaterialIcons name="notifications" size={24} color={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
            {unreadCount > 0 && (
              <View className="absolute top-0 right-0 w-3 h-3 rounded-full bg-cyan-500 border border-white dark:border-slate-900 items-center justify-center">
                <View className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View className={`absolute top-16 left-4 right-4 max-w-sm mx-auto rounded-2xl p-5 border shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900/95 border-cyan-500/30' : 'bg-white border-slate-200'
          }`}>
            {/* Header: User Image with Change Photo overlay */}
            <View className="flex-row items-center gap-4 pb-4 border-b border-slate-700/40 mb-4">
              <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8} className="relative">
                <View className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-400">
                  <Image 
                    source={{ uri: userPhoto || DEFAULT_AVATAR }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1 border border-slate-900">
                  <MaterialIcons name="photo-camera" size={12} color="#ffffff" />
                </View>
              </TouchableOpacity>

              <View className="flex-1">
                <Text className={`font-sora font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} numberOfLines={1}>
                  {userName}
                </Text>
                <Text className="font-sans text-xs text-slate-400" numberOfLines={1}>
                  {activeEmail}
                </Text>
                <TouchableOpacity onPress={handleChangePhoto} className="mt-1">
                  <Text className="font-sans text-xs font-semibold text-cyan-400 underline">
                    Alterar foto
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setMenuVisible(false)} className="p-1">
                <MaterialIcons name="close" size={20} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Menu Option 1: Invite Friend with Share Icon */}
            <TouchableOpacity 
              onPress={() => {
                setMenuVisible(false);
                handleInviteFriend();
              }}
              className={`flex-row items-center justify-between p-3 rounded-xl mb-2 ${
                theme === 'dark' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-lg bg-cyan-500/20 items-center justify-center">
                  <MaterialIcons name="person-add" size={20} color="#00E5FF" />
                </View>
                <Text 
                  style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                  className={`font-sora font-semibold text-sm ${theme === 'dark' ? 'text-cyan-300' : 'text-cyan-800'}`}
                >
                  Convidar Amigo
                </Text>
              </View>
              <MaterialIcons name="share" size={20} color={theme === 'dark' ? '#00E5FF' : '#0284C7'} />
            </TouchableOpacity>

            {/* Menu Option 2: Go to Profile */}
            <TouchableOpacity 
              onPress={() => {
                setMenuVisible(false);
                router.push('/home/profile');
              }}
              className={`flex-row items-center justify-between p-3 rounded-xl mb-2 ${
                theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-lg bg-slate-700/30 items-center justify-center">
                  <MaterialIcons name="account-circle" size={20} color={theme === 'dark' ? '#adc6ff' : '#455e90'} />
                </View>
                <Text 
                  style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                  className={`font-sora font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                >
                  Meu Perfil
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Menu Option 3: Toggle Theme */}
            <TouchableOpacity 
              onPress={() => {
                toggleTheme();
              }}
              className={`flex-row items-center justify-between p-3 rounded-xl mb-3 ${
                theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-lg bg-slate-700/30 items-center justify-center">
                  <MaterialIcons name={theme === 'dark' ? 'light-mode' : 'dark-mode'} size={20} color={theme === 'dark' ? '#adc6ff' : '#455e90'} />
                </View>
                <Text 
                  style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                  className={`font-sora font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                >
                  Modo {theme === 'dark' ? 'Claro' : 'Escuro'}
                </Text>
              </View>
              <MaterialIcons name="swap-horiz" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Menu Option 4: Logout */}
            <TouchableOpacity 
              onPress={async () => {
                setMenuVisible(false);      
                try {
                  await logout();
                } catch (e) {
                  console.error('Logout error:', e);
                }
              }}
              className="flex-row items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <MaterialIcons name="logout" size={18} color="#ef4444" />
              <Text 
                style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                className="font-sora font-bold text-sm text-red-500"
              >
                Sair da Conta
              </Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notifications Popup Modal */}
      <Modal
        visible={notificationsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} 
          activeOpacity={1} 
          onPress={() => setNotificationsVisible(false)}
        >
          <View className={`absolute top-16 right-4 left-4 max-w-sm ml-auto rounded-2xl p-5 border shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900/95 border-cyan-500/30' : 'bg-white border-slate-200'
          }`}>
            {/* Notification Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-700/40 mb-3">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="notifications-active" size={20} color="#00E5FF" />
                <Text className={`font-sora font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Notificações
                </Text>
                {unreadCount > 0 && (
                  <View className="bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    <Text className="font-sora font-semibold text-xs text-cyan-400">
                      {unreadCount} novas
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => setNotificationsVisible(false)} className="p-1">
                <MaterialIcons name="close" size={20} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Notification List */}
            {notifications.length === 0 ? (
              <View className="py-6 items-center">
                <MaterialIcons name="notifications-off" size={32} color="#64748B" />
                <Text className="font-sora text-sm text-slate-400 mt-2">
                  Nenhuma notificação no momento.
                </Text>
              </View>
            ) : (
              <ScrollView 
                className="max-h-80" 
                contentContainerStyle={{ gap: 10 }}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {notifications.map((item) => (
                  <View 
                    key={item.id}
                    className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                      !item.read 
                        ? (theme === 'dark' ? 'bg-cyan-950/40 border-cyan-500/40' : 'bg-cyan-50 border-cyan-200')
                        : (theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100')
                    }`}
                  >
                    <TouchableOpacity 
                      onPress={() => markAsRead(item.id)}
                      className="flex-1 flex-row items-start gap-3"
                      activeOpacity={0.8}
                    >
                      <View 
                        className="w-8 h-8 rounded-lg items-center justify-center mt-0.5"
                        style={{ backgroundColor: `${item.iconColor}20` }}
                      >
                        <MaterialIcons name={item.icon as any} size={18} color={item.iconColor} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className={`font-sora font-semibold text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {item.title}
                          </Text>
                          {!item.read && (
                            <View className="w-2 h-2 rounded-full bg-cyan-400" />
                          )}
                        </View>
                        <Text className="font-sans text-xs text-slate-400 mt-0.5 leading-4">
                          {item.message}
                        </Text>
                        <Text className="font-sans text-[10px] text-slate-500 mt-1">
                          {item.time}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Delete Notification Button */}
                    <TouchableOpacity
                      onPress={() => deleteNotification(item.id)}
                      className="p-1.5 rounded-lg active:bg-red-500/20 ml-1"
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Notification Actions */}
            <View className="mt-4 pt-3 border-t border-slate-700/30 flex-row items-center justify-between">
              {unreadCount > 0 ? (
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text className="font-sora font-semibold text-xs text-cyan-400">
                    Marcar lidas
                  </Text>
                </TouchableOpacity>
              ) : <View />}

              {hasReadNotifications && (
                <TouchableOpacity onPress={clearReadNotifications}>
                  <Text className="font-sora font-semibold text-xs text-red-400">
                    Excluir lidas
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
