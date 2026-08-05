import React from 'react';
import SearchChatsView from '../components/SearchChatsView';
import { Conversation } from '../types';

interface SearchPageProps {
  conversations: Conversation[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onShareChat: (id: string) => void;
  onPinChat: (id: string) => void;
  onRenameChat: (id: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function SearchPage(props: SearchPageProps) {
  return <SearchChatsView {...props} />;
}

export default SearchPage;
