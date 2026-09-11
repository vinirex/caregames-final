import React, { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import { Text, View, TextInput, ActivityIndicator, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import '../global.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CustomButton } from '../components/CustomButton';
import { api } from '../services/api';

import { FormErrors } from '../types';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, userEmail, isLoading } = useAuth();
  const { theme, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isLoading && userEmail) {
      router.replace('/home');
    }
  }, [userEmail, isLoading]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const validate = () => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Por favor, insira um endereço de e-mail válido.';
    }

    // Password validation (strong password)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      newErrors.password = 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validate()) {
      const response = await api.login(email, password);
      if (response.success) {
        await login(email);
        router.replace('/home');
      } else {
        setErrors(prev => ({ ...prev, api: response.message }));
      }
    }
  };

  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        keyboardShouldPersistTaps="handled"
        className="p-6 bg-slate-950"
      >
        <View className="mb-8 items-center">
          <View style={{ width: 56, height: 56 }} className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center mb-3 shadow-lg">
            <Image 
              source={require('../assets/icon.png')} 
              style={{ width: 44, height: 44 }}
              resizeMode="contain" 
            />
          </View>
          <Text className="text-4xl font-extrabold text-center text-white tracking-wide font-display">Care Games +</Text>
          <Text className="text-lg font-semibold text-center text-cyan-400 mt-1 font-sans">Portal de Saúde e Bem-estar</Text>
        </View>

        <Link href="/register" className="mb-6">
          <Text className="text-center text-cyan-400 font-sans font-medium">Não tem uma conta? <Text className="underline font-bold">Cadastre-se</Text></Text>
        </Link>

        {errors.api && (
          <Text className="text-red-400 font-bold text-center mb-4 bg-red-500/10 border border-red-500/30 p-3 rounded-xl font-sans">
            {errors.api}
          </Text>
        )}

        <View className="space-y-4 mb-2">
          <TextInput
            className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base"
            placeholder="E-mail"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text className="text-red-400 text-xs ml-1 font-sans">{errors.email}</Text>}

          <TextInput
            className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base mt-3"
            placeholder="Senha"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password && <Text className="text-red-400 text-xs ml-1 font-sans">{errors.password}</Text>}
        </View>

        <View className="mt-4">
          <CustomButton title="Entrar" onPress={handleLogin} />
        </View>

        <View className="mt-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <Text className="text-slate-400 text-center text-xs mb-1 font-sans">Para testar sem conexão ao banco, use:</Text>
          <Text className="text-cyan-400 text-center text-sm font-mono font-bold">test@test.com</Text>
          <Text className="text-slate-200 text-center text-xs font-mono">Senha: Test1234</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}