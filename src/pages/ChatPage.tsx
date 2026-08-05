import React from 'react';
import ChatArea from '../components/ChatArea';
import { UserSettings } from '../types';

interface ChatPageProps {
  settings: UserSettings;
  currentUser: any;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  onRefreshConversations: () => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  userPlan: 'free' | 'pro' | 'max';
  onOpenUpgrade: () => void;
  onOpenAuth: () => void;
}

export function ChatPage(props: ChatPageProps) {
  return <ChatArea {...props} />;
}

export default ChatPage;
