import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  serverUrl: string;
  setServerUrl: (url: string) => Promise<void>;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, _setServerUrl] = useState('http://10.42.0.1:4001');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted settings
    const loadSettings = async () => {
      try {
        const savedUrl = await AsyncStorage.getItem('@sangkara_server_url');
        if (savedUrl) {
          _setServerUrl(savedUrl);
        }
        const savedAuth = await AsyncStorage.getItem('@sangkara_is_auth');
        if (savedAuth === 'true') {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to load settings from storage:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const setServerUrl = async (url: string) => {
    try {
      const cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash
      await AsyncStorage.setItem('@sangkara_server_url', cleanUrl);
      _setServerUrl(cleanUrl);
    } catch (e) {
      console.error('Failed to save server URL:', e);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    if (username === 'sangkaraadmin' && password === 'sangkaraadmin123') {
      try {
        await AsyncStorage.setItem('@sangkara_is_auth', 'true');
        setIsAuthenticated(true);
        return true;
      } catch (e) {
        console.error('Failed to save auth state:', e);
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@sangkara_is_auth');
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Failed to clear auth state:', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ serverUrl, setServerUrl, isAuthenticated, login, logout, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
