import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Text,
  View,
  TextInput,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import '../global.css';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Por favor, informe seu e-mail.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Por favor, insira um endereço de e-mail válido.';
    }

    const parsedAge = parseInt(age, 10);
    if (!age.trim()) {
      newErrors.age = 'Por favor, informe sua idade.';
    } else if (isNaN(parsedAge) || parsedAge < 18) {
      newErrors.age = 'Você deve ter pelo menos 18 anos para participar do Care Games +.';
    } else if (parsedAge > 120) {
      newErrors.age = 'Por favor, insira uma idade válida.';
    }

    if (!password) {
      newErrors.password = 'Por favor, informe uma senha.';
    } else if (password.length < 8) {
      newErrors.password = 'A senha deve ter no mínimo 8 caracteres.';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'A senha deve conter ao menos 1 letra maiúscula.';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'A senha deve conter ao menos 1 letra minúscula.';
    } else if (!/\d/.test(password)) {
      newErrors.password = 'A senha deve conter ao menos 1 número.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Por favor, confirme sua senha.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setErrors({});
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const response = await api.register(email.trim(), password, age.trim());

      if (response.success) {
        Alert.alert(
          'Conta Criada com Sucesso! 🎉',
          'Seu cadastro no Care Games + foi concluído. Agora você já pode fazer login com suas credenciais.',
          [
            {
              text: 'Fazer Login',
              onPress: () => router.replace('/'),
            },
          ]
        );
      } else {
        const errorMsg = response.message || 'Falha ao realizar cadastro.';
        setErrors({ general: errorMsg });
        Alert.alert('Falha no Cadastro', errorMsg);
      }
    } catch (err: any) {
      const msg = err.message || 'Erro inesperado de conexão ao cadastrar.';
      setErrors({ general: msg });
      Alert.alert('Erro', msg);
    } finally {
      setIsSubmitting(false);
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
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace('/')}
          className="self-start mb-4 flex-row items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800"
        >
          <MaterialIcons name="arrow-back" size={20} color="#00E5FF" />
          <Text className="text-slate-300 font-sans text-sm font-semibold">
            Voltar para o Login
          </Text>
        </TouchableOpacity>

        {/* Logo and Titles */}
        <View className="mb-6 items-center">
          <View
            style={{ width: 56, height: 56 }}
            className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center mb-3 shadow-lg"
          >
            <Image
              source={require('../assets/icon.png')}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-extrabold text-center text-white tracking-wide font-display">
            Criar Conta
          </Text>
          <Text className="text-sm font-semibold text-center text-cyan-400 mt-1 font-sans">
            Junte-se ao Care Games +
          </Text>
        </View>

        {errors.general && (
          <View className="mb-4 bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex-row items-center gap-2">
            <MaterialIcons name="error-outline" size={20} color="#F87171" />
            <Text className="text-red-400 font-bold font-sans flex-1 text-sm">
              {errors.general}
            </Text>
          </View>
        )}

        {/* Inputs */}
        <View className="space-y-4 mb-4">
          {/* E-mail */}
          <View className="mb-3">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-1.5 font-sans">
              E-mail *
            </Text>
            <TextInput
              className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base"
              placeholder="seu.email@exemplo.com"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            {errors.email && (
              <Text className="text-red-400 text-xs ml-1 mt-1 font-sans">{errors.email}</Text>
            )}
          </View>

          {/* Idade */}
          <View className="mb-3">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-1.5 font-sans">
              Idade (Mínimo 18 anos) *
            </Text>
            <TextInput
              className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base"
              placeholder="Ex: 25"
              placeholderTextColor="#64748B"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
              editable={!isSubmitting}
            />
            {errors.age && (
              <Text className="text-red-400 text-xs ml-1 mt-1 font-sans">{errors.age}</Text>
            )}
          </View>

          {/* Senha */}
          <View className="mb-3">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-1.5 font-sans">
              Senha *
            </Text>
            <View className="relative justify-center">
              <TextInput
                className="h-14 border rounded-xl pl-4 pr-12 bg-slate-900 border-slate-800 text-white font-sans text-base"
                placeholder="Mínimo 8 caracteres (Maiúscula, minúscula e número)"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-1"
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="text-red-400 text-xs ml-1 mt-1 font-sans">{errors.password}</Text>
            )}
          </View>

          {/* Confirmar Senha */}
          <View className="mb-4">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-1.5 font-sans">
              Confirmar Senha *
            </Text>
            <TextInput
              className="h-14 border rounded-xl px-4 bg-slate-900 border-slate-800 text-white font-sans text-base"
              placeholder="Digite a senha novamente"
              placeholderTextColor="#64748B"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              editable={!isSubmitting}
            />
            {errors.confirmPassword && (
              <Text className="text-red-400 text-xs ml-1 mt-1 font-sans">
                {errors.confirmPassword}
              </Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSubmitting}
          onPress={handleRegister}
          className="rounded-xl overflow-hidden shadow-lg mt-2"
        >
          <LinearGradient
            colors={['#00E5FF', '#0072FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-14 items-center justify-center flex-row gap-2"
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white font-bold font-sans text-base">Cadastrando...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="person-add" size={20} color="white" />
                <Text className="text-white font-bold font-sans text-base">
                  Cadastrar no Care Games +
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Already have an account link */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace('/')}
          className="mt-6 py-3 items-center justify-center"
        >
          <Text className="text-slate-400 font-sans text-sm text-center">
            Já possui uma conta?{' '}
            <Text className="text-cyan-400 font-bold underline">Entrar no aplicativo</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
