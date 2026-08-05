import React from 'react';
import SettingsPanel from '../components/SettingsPanel';
import { UserSettings } from '../types';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  currentUser: any;
  onOpenAuth: () => void;
}

export function SettingsPage(props: SettingsPageProps) {
  return <SettingsPanel {...props} />;
}

export default SettingsPage;
