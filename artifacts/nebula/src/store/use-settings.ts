import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SearchEngine = 'duckduckgo' | 'google' | 'bing' | 'brave';

interface SettingsState {
  searchEngine: SearchEngine;
  setSearchEngine: (engine: SearchEngine) => void;
  
  tabCloakEnabled: boolean;
  setTabCloakEnabled: (enabled: boolean) => void;
  cloakTitle: string;
  setCloakTitle: (title: string) => void;
  cloakIcon: string;
  setCloakIcon: (icon: string) => void;
  
  tabSwitchCloak: boolean;
  setTabSwitchCloak: (enabled: boolean) => void;
  
  antiClose: boolean;
  setAntiClose: (enabled: boolean) => void;
  
  panicKey: string;
  setPanicKey: (key: string) => void;
  panicUrl: string;
  setPanicUrl: (url: string) => void;
  
  adBlocker: boolean;
  setAdBlocker: (enabled: boolean) => void;

  clearAllData: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      searchEngine: 'duckduckgo',
      setSearchEngine: (engine) => set({ searchEngine: engine }),
      
      tabCloakEnabled: false,
      setTabCloakEnabled: (enabled) => set({ tabCloakEnabled: enabled }),
      cloakTitle: 'Google',
      setCloakTitle: (title) => set({ cloakTitle: title }),
      cloakIcon: 'https://www.google.com/favicon.ico',
      setCloakIcon: (icon) => set({ cloakIcon: icon }),
      
      tabSwitchCloak: false,
      setTabSwitchCloak: (enabled) => set({ tabSwitchCloak: enabled }),
      
      antiClose: false,
      setAntiClose: (enabled) => set({ antiClose: enabled }),
      
      panicKey: '`',
      setPanicKey: (key) => set({ panicKey: key }),
      panicUrl: 'https://classroom.google.com',
      setPanicUrl: (url) => set({ panicUrl: url }),
      
      adBlocker: true,
      setAdBlocker: (enabled) => set({ adBlocker: enabled }),

      clearAllData: () => {
        localStorage.clear();
        window.location.reload();
      },
    }),
    {
      name: 'nebula-settings',
    }
  )
);
