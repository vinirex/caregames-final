import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Text, View, TextInput, Alert, ImageBackground } from 'react-native';
import '../global.css';
import { useTheme } from '../context/ThemeContext';
import { CustomButton } from '../components/CustomButton';
import { api } from '../services/api';
import { FormErrors } from '../types';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const newErrors: FormErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Por favor, insira um endereço de e-mail válido.';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      newErrors.password = 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.';
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 18) {
      newErrors.age = 'Você deve ter pelo menos 18 anos para se cadastrar.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validate()) {
      const response = await api.register(email, password, age);
      if (response.success) {
        Alert.alert('Cadastro Realizado!', 'Agora você pode fazer login.');
        router.push('/');
      } else {
        Alert.alert('Falha no Cadastro', response.message);
      }
    }
  };

  return (
    <ImageBackground source={require('../assets/images/CarePlusDark.png')} style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center' }} resizeMode="cover">
      <View className={`flex-1 justify-center p-6`}>
        <Text className={`text-3xl font-bold text-center mb-8 text-white`}>Criar Conta</Text>
        <Link href="/" className="mb-6">
          <Text className={`text-center ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Já tem uma conta? Entrar</Text>
        </Link>
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

        <CustomButton title="Cadastrar" onPress={handleRegister} />
      </View>
    </ImageBackground>
  );
}
