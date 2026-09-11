import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Text, View, TextInput, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import '../global.css';
import { useTheme } from '../context/ThemeContext';
import { CustomButton } from '../components/CustomButton';
import { api } from '../services/api';
import { FormErrors } from '../types';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
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
        <View className="mb-6 items-center">
          <View style={{ width: 56, height: 56 }} className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center mb-3 shadow-lg">
            <Image 
              source={require('../assets/icon.png')} 
              style={{ width: 44, height: 44 }}
              resizeMode="contain" 
            />
          </View>
          <Text className="text-3xl font-extrabold text-center text-white font-display">Criar Conta</Text>
          <Text className="text-sm font-semibold text-center text-slate-400 mt-1 font-sans">Junte-se ao Care Games +</Text>
        </View>

        <Link href="/" className="mb-6">
          <Text className="text-center text-cyan-400 font-sans font-medium">Já tem uma conta? <Text className="underline font-bold">Entrar</Text></Text>
        </Link>

        <TextInput
          className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base mb-3"
          placeholder="E-mail"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text className="text-red-400 text-xs ml-1 mb-3 font-sans">{errors.email}</Text>}

        <TextInput
          className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base mb-3"
          placeholder="Senha (Ex: Minhasenha123)"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password && <Text className="text-red-400 text-xs ml-1 mb-3 font-sans">{errors.password}</Text>}

        <TextInput
          className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base mb-6"
          placeholder="Idade (Mínimo 18)"
          placeholderTextColor="#94A3B8"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />
        {errors.age && <Text className="text-red-400 text-xs ml-1 mb-6 font-sans">{errors.age}</Text>}

        <CustomButton title="Cadastrar" onPress={handleRegister} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
