import { createContext } from 'react';
import { UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS } from '../config/constants';

export interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_USER_SETTINGS,
  updateSettings: () => {},
});
