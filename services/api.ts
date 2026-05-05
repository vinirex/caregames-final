import AsyncStorage from '@react-native-async-storage/async-storage';

// Dummy database stored in AsyncStorage for demonstration
const DB_USERS_KEY = '@dummy_db_users';

export const api = {
  register: async (email: string, password: string, age: string) => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};
      
      if (users[email]) {
        throw new Error('Usuário já cadastrado');
      }

      users[email] = { password, age };
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      
      return { success: true, message: 'Usuário cadastrado com sucesso' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Falha no cadastro' };
    }
  },
  
  login: async (email: string, password: string) => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};

      // Dummy default user if DB is empty
      if (email === 'test@test.com' && password === 'Test1234') {
        return { success: true };
      }

      const user = users[email];
      if (!user || user.password !== password) {
        throw new Error('E-mail ou senha inválidos');
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Falha no login' };
    }
  },

  uploadProfilePhoto: async (email: string, photoUri: string) => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};

      if (!users[email]) {
        // Create entry for default test user if it doesn't exist
        users[email] = {};
      }

      users[email].profilePhoto = photoUri;
      await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

      return { success: true, message: 'Foto de perfil salva com sucesso' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Falha ao salvar foto' };
    }
  },

  getProfilePhoto: async (email: string) => {
    try {
      const usersStr = await AsyncStorage.getItem(DB_USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : {};

      const photoUri = users[email]?.profilePhoto || null;
      return { success: true, photoUri };
    } catch (e: any) {
      return { success: false, photoUri: null, message: e.message || 'Falha ao carregar foto' };
    }
  }
};
