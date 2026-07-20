// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      language: 'en',
      plan: 'free',

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      setPlan: (plan) => set({ plan }),

      clearAuth: () => set({
        user: null,
        role: null,
        isAuthenticated: false,
        plan: 'free',
      }),

      registrationData: null,
      setRegistrationData: (data) => set({ registrationData: data }),
      clearRegistrationData: () => set({ registrationData: null }),
    }),
    {
      name: 'zaria-auth',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
        plan: state.plan,
      }),
    }
  )
);

export const useProviderStore = create((set) => ({
  selectedServices: [],
  cnicFront: null,
  cnicBack: null,
  certifications: [],

  setSelectedServices: (services) => {
    if (services.length > 1) services = [services[services.length - 1]];
    set({ selectedServices: services });
  },

  setCnicFront: (file) => set({ cnicFront: file }),
  setCnicBack: (file) => set({ cnicBack: file }),
  setCertifications: (certs) => set({ certifications: certs }),

  clearProviderData: () => set({
    selectedServices: [],
    cnicFront: null,
    cnicBack: null,
    certifications: [],
  }),
}));

export const useCustomerStore = create((set) => ({
  cnicFront: null,
  cnicBack: null,

  setCnicFront: (file) => set({ cnicFront: file }),
  setCnicBack: (file) => set({ cnicBack: file }),

  clearCustomerData: () => set({
    cnicFront: null,
    cnicBack: null,
  }),
}));