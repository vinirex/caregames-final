import React, { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import { Text, View, TextInput, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import '../global.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CustomButton } from '../components/CustomButton';
import { api } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, userEmail, isLoading } = useAuth();
  const { theme, colors } = useTheme();

  useEffect(() => {
    if (!isLoading && userEmail) {
      // Automatic redirection if the user is already logged in via AsyncStorage
      router.replace('/home');
    }
  }, [userEmail, isLoading]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; age?: string; api?: string }>({});

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const validate = () => {
    const newErrors: { email?: string; password?: string; age?: string; api?: string } = {};

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

    // Age validation
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 18) {
      newErrors.age = 'Você deve ter pelo menos 18 anos para entrar.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validate()) {
      const response = await api.login(email, password);
      if (response.success) {
        await login(email);
        router.push('/home');
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
    <ImageBackground source={require('../assets/images/CarePlusDark.png')} style={{ flex: 1 }} resizeMode="cover">
      <View className={`flex-1 justify-end p-6 pb-24`}>
        <View className="mb-8">
          <Text className="text-4xl font-extrabold text-center text-white tracking-wide">Care Games +</Text>
          <Text className="text-2xl font-medium text-center text-blue-400 mt-1">Login</Text>
        </View>
        <Link href="/register" className="mb-6">
          <Text className={`text-center ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Não tem uma conta? Cadastre-se</Text>
        </Link>

        {errors.api && (
          <Text className="text-red-500 font-bold text-center mb-4 bg-red-100/10 p-2 rounded">
            {errors.api}
          </Text>
        )}

        <TextInput
          className={`h-12 border rounded-lg px-4 mb-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
          placeholder="E-mail"
          placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text className="text-red-500 mb-4">{errors.email}</Text>}

        <TextInput
          className={`h-12 border rounded-lg px-4 mb-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
          placeholder="Senha"
          placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password && <Text className="text-red-500 mb-4">{errors.password}</Text>}

        <TextInput
          className={`h-12 border rounded-lg px-4 mb-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
          placeholder="Idade"
          placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />
        {errors.age && <Text className="text-red-500 mb-6">{errors.age}</Text>}

        <CustomButton title="Entrar" onPress={handleLogin} />
        
        <View className="mt-8 bg-gray-900/60 p-4 rounded-xl border border-gray-700/50">
          <Text className="text-gray-300 text-center text-xs mb-1">Para testar sem conexão ao banco, use:</Text>
          <Text className="text-white text-center text-sm font-bold">E-mail: test@test.com</Text>
          <Text className="text-white text-center text-sm font-bold">Senha: Test1234</Text>
        </View>
      </View>
    </ImageBackground>
  );
}