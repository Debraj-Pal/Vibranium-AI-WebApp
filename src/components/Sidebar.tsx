import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Languages,
  User,
  LogOut,
  Info,
  MoreVertical,
  Trash2,
  Atom,
  Newspaper,
  Search,
  X,
  Zap,
  ArrowUpRight,
  Film,
  Share2,
  Pin,
  PinOff,
  Pencil
} from 'lucide-react';
import { Conversation, getInitials, getAvatarStyle, stripMarkdown } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  conversations: Conversation[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onOpenAuth: () => void;
  currentUser: any;
  onDeleteChat?: (id: string) => void;
  onShareChat?: (id: string) => void;
  onPinChat?: (id: string) => void;
  onRenameChat?: (id: string) => void;
  userPlan?: 'free' | 'pro' | 'max';
  onOpenUpgrade?: () => void;
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  activeModule,
  setActiveModule,
  conversations,
  currentChatId,
  onSelectChat,
  onNewChat,
  onOpenAuth,
  currentUser,
  onDeleteChat,
  onShareChat,
  onPinChat,
  onRenameChat,
  userPlan = 'free',
  onOpenUpgrade
}: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleDismiss = () => {
      if (activeMenu) setActiveMenu(null);
    };
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    return () => {
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, [activeMenu]);

  // Filter conversations by title or content snippet
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatches = (conv.title || '').toLowerCase().includes(q);
    const snippetMatches = (conv.lastMessageSnippet || '').toLowerCase().includes(q);

    let localMessageMatches = false;
    try {
      const localMsgs = localStorage.getItem(`vibranium_msg_${conv.id}`);
      if (localMsgs) {
        localMessageMatches = localMsgs.toLowerCase().includes(q);
      }
    } catch (e) {
      // Ignore parse error
    }

    return titleMatches || snippetMatches || localMessageMatches;
  });

  return (
    <div 
      className={`fixed md:relative left-0 top-0 bottom-0 z-50 h-full flex flex-col border-r border-zinc-800 bg-[#111111] text-zinc-300 transition-all duration-300 ${
        isOpen 
          ? 'w-64 translate-x-0 shadow-2xl md:shadow-none' 
          : 'w-64 md:w-16 -translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Brand Block */}
      <div className="flex h-16 items-center px-4">
        {!isOpen ? (
          <button
            id="sidebar-collapsed-logo-toggle"
            onClick={() => setIsOpen(true)}
            className="group mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold transition-all duration-300 hover:rotate-90 hover:from-indigo-600 hover:to-indigo-700 hover:scale-105 shadow-md relative overflow-hidden"
            title="Expand Sidebar"
          >
            {/* Default state: Shows Atom */}
            <span className="group-hover:opacity-0 transition-opacity duration-200">
              <Atom className="h-5 w-5 text-white animate-[spin_8s_linear_infinite] drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            </span>
            {/* Hover state: Shows ChevronRight */}
            <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 -rotate-90">
              <ChevronRight className="h-5 w-5 text-white" />
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25">
                <Atom className="h-4.5 w-4.5 text-white animate-[spin_12s_linear_infinite] drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">
                Vibranium AI
              </span>

            </div>
            <button 
              id="sidebar-toggle-btn"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 hover:bg-zinc-800 hover:text-white transition-colors text-zinc-400"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Top Action Buttons (New Chat & Search Chats) */}
      <div className="p-3 space-y-0.5">
        <button
          id="sidebar-new-chat-btn"
          onClick={() => {
            setActiveModule('chat');
            onNewChat();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all hover:bg-zinc-800/50 text-zinc-300 hover:text-white ${
            !isOpen && 'justify-center'
          }`}
          title="New chat"
        >
          <Plus className="h-4.5 w-4.5 shrink-0 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          {isOpen && <span>New chat</span>}
        </button>

        <button
          id="sidebar-search-chats-btn"
          onClick={() => {
            setActiveModule('search');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            activeModule === 'search'
              ? 'bg-zinc-800 text-white border-l-2 border-indigo-500'
              : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
          } ${!isOpen && 'justify-center'}`}
          title="Search chats"
        >
          <Search className="h-4.5 w-4.5 shrink-0 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          {isOpen && <span>Search chats</span>}
        </button>
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        
        {/* Core Modules List */}
        <div>
          {isOpen && <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">App Modules</p>}
          <div className="space-y-0.5">
            <button
              id="module-chat-btn"
              onClick={() => setActiveModule('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeModule === 'chat' 
                  ? 'bg-zinc-800 text-white border-l-2 border-indigo-500' 
                  : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
              } ${!isOpen && 'justify-center'}`}
              title="Vibranium Chat"
            >
              <MessageSquare className="h-4.5 w-4.5 shrink-0 text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              {isOpen && <span>AI Assistant</span>}
            </button>

            <button
              id="module-translate-btn"
              onClick={() => setActiveModule('translator')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeModule === 'translator' 
                  ? 'bg-zinc-800 text-white border-l-2 border-indigo-500' 
                  : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
              } ${!isOpen && 'justify-center'}`}
              title="Real-time Translator"
            >
              <Languages className="h-4.5 w-4.5 shrink-0 text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              {isOpen && <span>Live Translator</span>}
            </button>

            <button
              id="module-news-btn"
              onClick={() => setActiveModule('news')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeModule === 'news' 
                  ? 'bg-zinc-800 text-white border-l-2 border-indigo-500' 
                  : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
              } ${!isOpen && 'justify-center'}`}
              title="Vibranium Intelligence Bulletin"
            >
              <Newspaper className="h-4.5 w-4.5 shrink-0 text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              {isOpen && <span>Vibranium Bulletin</span>}
            </button>

            <button
              id="module-video-btn"
              onClick={() => setActiveModule('video')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeModule === 'video' 
                  ? 'bg-zinc-800 text-white border-l-2 border-indigo-500' 
                  : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
              } ${!isOpen && 'justify-center'}`}
              title="Veo Video Laboratory"
            >
              <Film className="h-4.5 w-4.5 shrink-0 text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              {isOpen && <span>Veo Video Lab</span>}
            </button>
          </div>
        </div>

        {/* Recent Chat History (Syncs live from Firestore) */}
        {isOpen && conversations.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recents</p>
            </div>

            <div className="space-y-0.5">
              {[...conversations]
                .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                .map((conv) => {
                const isMenuOpen = activeMenu?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    id={`chat-history-item-${conv.id}`}
                    onClick={() => onSelectChat(conv.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left transition-colors relative group cursor-pointer ${
                      currentChatId === conv.id 
                        ? 'bg-zinc-800 text-white font-medium' 
                        : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
                    } ${!isOpen && 'justify-center'} ${isMenuOpen ? 'z-30' : 'z-0'}`}
                    title={conv.title}
                  >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2.5">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        {isOpen && (
                          <span className="truncate flex-1 flex items-center gap-1.5">
                            {conv.isPinned && <Pin className="h-3 w-3 text-indigo-400 shrink-0" />}
                            <span className="truncate">{stripMarkdown(conv.title || 'Untitled Conversation')}</span>
                          </span>
                        )}
                      </div>

                      {isOpen && (
                        <div className="relative shrink-0 flex items-center pl-1.5">
                          <button
                            id={`chat-more-btn-${conv.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeMenu?.id === conv.id) {
                                setActiveMenu(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const isMobileOverflow = rect.right + 210 > window.innerWidth;
                                const left = isMobileOverflow ? Math.max(10, rect.right - 192) : rect.right + 10;
                                const top = window.innerHeight - rect.top < 230 ? Math.max(10, rect.bottom - 185) : rect.top - 6;
                                setActiveMenu({ id: conv.id, top, left });
                              }
                            }}
                            className={`p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-opacity shrink-0 ${
                              isMenuOpen ? 'opacity-100 bg-zinc-800 text-white' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="Chat Options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          </div>
        )}

      </div>

      {/* Bottom Profile, Settings, & Trademark Area */}
      <div className="p-3 border-t border-zinc-800 bg-[#111111] space-y-2">
        <div className={`flex items-center justify-between gap-1.5 px-1 py-1 rounded-md ${!isOpen && 'flex-col justify-center'}`}>
          <button
            id="sidebar-profile-btn"
            onClick={onOpenAuth}
            className={`flex items-center gap-2.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 py-1.5 px-2 transition-all min-w-0 ${
              isOpen ? 'flex-1 text-left' : 'justify-center w-full'
            }`}
            title={currentUser ? `Logged in as ${currentUser.email}` : 'Log In / Sign Up'}
          >
            {currentUser ? (
              (() => {
                const avatarStyle = getAvatarStyle(currentUser.uid || currentUser.email || currentUser.displayName);
                return (
                  <div className={`h-6 w-6 rounded-full ${avatarStyle.bg} ${avatarStyle.hoverBg} text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform active:scale-95`}>
                    {getInitials(currentUser.displayName, currentUser.email)}
                  </div>
                );
              })()
            ) : (
              <User className="h-4 w-4 shrink-0 text-zinc-400" />
            )}
            {isOpen && (
              <span className="truncate font-medium text-zinc-200">
                {currentUser ? (currentUser.displayName || currentUser.email) : 'Connect Account'}
              </span>
            )}
          </button>

          <button
            id="sidebar-settings-btn"
            onClick={() => setActiveModule('settings')}
            className={`p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all shrink-0 ${
              activeModule === 'settings' ? 'bg-zinc-800 text-white' : ''
            }`}
            title="Settings & Providers"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Required Trademark Line at the absolute bottom */}
        {isOpen && (
          <div className="mt-2 pt-2 border-t border-zinc-800/50 text-center">
            <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase block leading-relaxed">
              &copy; 2026 Debraj Pal. All Rights Reserved
            </span>
          </div>
        )}
      </div>

      {/* Portal for Conversation Options Menu beside the chat conversation name */}
      {activeMenu && (() => {
        const activeConv = conversations.find(c => c.id === activeMenu.id);
        if (!activeConv) return null;
        return createPortal(
          <>
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(null);
              }}
            />
            <div 
              style={{ top: `${activeMenu.top}px`, left: `${activeMenu.left}px` }}
              className="fixed w-52 rounded-2xl bg-[#1e1e20] border border-zinc-800/90 shadow-2xl p-1.5 space-y-0.5 z-[9999] text-left animate-fadeIn"
            >
              <button
                id={`chat-share-btn-${activeConv.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(null);
                  if (onShareChat) onShareChat(activeConv.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span>Share conversation</span>
              </button>

              <button
                id={`chat-pin-btn-${activeConv.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(null);
                  if (onPinChat) onPinChat(activeConv.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium cursor-pointer"
              >
                {activeConv.isPinned ? <PinOff className="h-3.5 w-3.5 shrink-0 text-zinc-400" /> : <Pin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                <span>{activeConv.isPinned ? 'Unpin' : 'Pin'}</span>
              </button>

              <button
                id={`chat-rename-btn-${activeConv.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(null);
                  if (onRenameChat) onRenameChat(activeConv.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span>Rename</span>
              </button>

              <button
                id={`chat-delete-btn-${activeConv.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(null);
                  if (onDeleteChat) onDeleteChat(activeConv.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-all text-xs font-medium cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-400" />
                <span>Delete</span>
              </button>
            </div>
          </>,
          document.body
        );
      })()}
    </div>
  );
}
