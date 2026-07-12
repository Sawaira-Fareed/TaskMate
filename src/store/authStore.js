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

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      
      clearAuth: () => set({ 
        user: null, 
        role: null, 
        isAuthenticated: false 
      }),

      // Registration data - cleared on sign out
      registrationData: null,
      setRegistrationData: (data) => set({ registrationData: data }),
      clearRegistrationData: () => set({ registrationData: null }),
    }),
    {
      name: 'zaria-auth',
      partialize: (state) => ({ 
        language: state.language,
        // Don't persist sensitive auth data
      }),
    }
  )
);

// Separate store for provider-specific data
export const useProviderStore = create((set) => ({
  selectedServices: [], // Limited to 1 service
  cnicFront: null,
  cnicBack: null,
  certifications: [],
  
  setSelectedServices: (services) => {
    // Enforce single service selection
    if (services.length > 1) {
      services = [services[services.length - 1]];
    }
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

// Separate store for customer-specific data
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