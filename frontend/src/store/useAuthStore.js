import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (user, token) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userProfile', JSON.stringify(user));
    set({ user, token });
  },

  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userProfile');
    set({ user: null, token: null });
  },

  updateUser: async (user) => {
    await AsyncStorage.setItem('userProfile', JSON.stringify(user));
    set({ user });
  },

  restoreToken: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (token && userProfile) {
        set({ user: JSON.parse(userProfile), token });
      }
    } catch (e) {
      console.error('Failed to restore token', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
