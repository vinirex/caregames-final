import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Text, View, TextInput, Alert } from 'react-native';
import '../global.css';
import { useTheme } from '../context/ThemeContext';
import { CustomButton } from '../components/CustomButton';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; age?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string; age?: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password validation (strong password)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      newErrors.password = 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.';
    }

    // Age validation
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 18) {
      newErrors.age = 'You must be at least 18 years old to log in.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (validate()) {
      // In a real app, you'd perform authentication here
      Alert.alert('Login Successful', 'Welcome!');
      router.push({ pathname: '/home', params: { userEmail: email } });
    }
  };

  return (
    <View className={`flex-1 justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <Text className={`text-3xl font-bold text-center mb-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Login</Text>
      <Link href="/home" className="mb-6">
        <Text className={`text-center ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Don't have an account? Register</Text>
      </Link>
      <TextInput
        className={`h-12 border rounded-lg px-4 mb-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
        placeholder="Email"
        placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text className="text-red-500 mb-4">{errors.email}</Text>}

      <TextInput
        className={`h-12 border rounded-lg px-4 mb-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
        placeholder="Password"
        placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {errors.password && <Text className="text-red-500 mb-4">{errors.password}</Text>}

      <TextInput
        className={`h-12 border rounded-lg px-4 mb-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
        placeholder="Age"
        placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
      />
      {errors.age && <Text className="text-red-500 mb-6">{errors.age}</Text>}

      <CustomButton title="Login" onPress={handleLogin} />
    </View>
  );
}