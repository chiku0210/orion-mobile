import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  isTtsEnabled: boolean;
  speechRate: number;
  theme: 'dark' | 'light' | 'auto';
  batteryThreshold: number;
  isBackgroundServiceEnabled: boolean;

  setTtsEnabled: (enabled: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setTheme: (theme: 'dark' | 'light' | 'auto') => void;
  setBatteryThreshold: (threshold: number) => void;
  setBackgroundServiceEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isTtsEnabled: true,
      speechRate: 0.5, // Native scale often 0.0 - 1.0, 0.5 is ~1.0x
      theme: 'auto',
      batteryThreshold: 20,
      isBackgroundServiceEnabled: true,

      setTtsEnabled: (enabled) => set({ isTtsEnabled: enabled }),
      setSpeechRate: (rate) => set({ speechRate: rate }),
      setTheme: (theme) => set({ theme }),
      setBatteryThreshold: (threshold) => set({ batteryThreshold: threshold }),
      setBackgroundServiceEnabled: (enabled) => set({ isBackgroundServiceEnabled: enabled }),
    }),
    {
      name: 'orion-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
