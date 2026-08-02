import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, MessageSquare, Trash2, ArrowLeft, Menu, MoreVertical, Share2, Pin, PinOff, Pencil } from 'lucide-react';
import { Conversation, stripMarkdown } from '../types';

interface SearchChatsViewProps {
  conversations: Conversation[];
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onShareChat?: (id: string) => void;
  onPinChat?: (id: string) => void;
  onRenameChat?: (id: string) => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export function formatGeminiDate(timestamp: any): string {
  if (!timestamp) return 'Recently';
  let date: Date | null = null;

  if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    date = !isNaN(parsed) ? new Date(parsed) : null;
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp.toMillis === 'function') {
    date = new Date(timestamp.toMillis());
  } else if (typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000);
  }

  if (!date || isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  if (date >= startOfToday) {
    return 'Today';
  } else if (date >= startOfYesterday) {
    return 'Yesterday';
  } else {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const currentYear = now.getFullYear();
    const dateYear = date.getFullYear();

    if (dateYear === currentYear) {
      return `${day} ${month}`;
    } else {
      return `${day} ${month} ${dateYear}`;
    }
  }
}

export default function SearchChatsView({
  conversations,
  onSelectChat,
  onDeleteChat,
  onShareChat,
  onPinChat,
  onRenameChat,
  isSidebarOpen,
  setIsSidebarOpen
}: SearchChatsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<{ id: string; top: number; left: number } | null>(null);

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

  // Filter conversations by title, last message snippet or local messages
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
      // ignore
    }

    return titleMatches || snippetMatches || localMessageMatches;
  }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131314] text-zinc-200 overflow-y-auto px-4 md:px-12 py-8 relative">
      
      {/* Top Bar for Mobile Toggle if sidebar collapsed */}
      {!isSidebarOpen && setIsSidebarOpen && (
        <button
          id="search-page-mobile-sidebar-btn"
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 p-2 rounded-full bg-[#1e1f20] text-zinc-300 hover:text-white cursor-pointer"
          title="Open Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="max-w-3xl w-full mx-auto space-y-8 pt-4 md:pt-8">
        
        {/* Large Gemini-style Centered Search Input Bar */}
        <div className="relative w-full">
          <div className="relative flex items-center w-full bg-[#1e1f20] hover:bg-[#282a2c] focus-within:bg-[#1e1f20] border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.35)] focus-within:border-indigo-400 focus-within:shadow-[0_0_28px_rgba(129,140,248,0.6)] focus-within:ring-1 focus-within:ring-indigo-400/50 rounded-full px-5 py-3.5 transition-all">
            <Search className="h-5 w-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] shrink-0 mr-3.5" />
            <input
              id="search-chats-page-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="bg-transparent border-none text-white text-base placeholder-zinc-500 focus:outline-none w-full"
              autoFocus
            />
            {searchQuery && (
              <button
                id="search-chats-clear-btn"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors ml-2"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Chats Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-medium text-zinc-400">Recent</h2>
            {searchQuery && (
              <span className="text-xs text-zinc-500">
                {filteredConversations.length} {filteredConversations.length === 1 ? 'result' : 'results'}
              </span>
            )}
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#1e1f20]/40 rounded-2xl border border-zinc-800/50">
              <MessageSquare className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              {searchQuery ? (
                <div>
                  <p className="text-sm font-medium text-zinc-300">No chats found for "{searchQuery}"</p>
                  <p className="text-xs text-zinc-500 mt-1">Try searching for different keywords or titles.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-indigo-300 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No recent conversations found.</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => {
                const dateStr = formatGeminiDate(conv.updatedAt || conv.createdAt);
                const cleanTitle = stripMarkdown(conv.title || 'Untitled Conversation');
                const cleanSnippet = stripMarkdown(conv.lastMessageSnippet || '');

                return (
                  <div
                    key={conv.id}
                    id={`search-item-${conv.id}`}
                    onClick={() => onSelectChat(conv.id)}
                    className="group flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[#1e1f20] transition-all cursor-pointer border border-transparent hover:border-zinc-800/60"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                      <MessageSquare className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 shrink-0 transition-colors" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate flex items-center gap-1.5">
                          {conv.isPinned && <Pin className="h-3 w-3 text-indigo-400 shrink-0" />}
                          <span className="truncate">{cleanTitle}</span>
                        </span>
                        {cleanSnippet && (
                          <span className="text-xs text-zinc-500 group-hover:text-zinc-400 truncate block mt-0.5">
                            {cleanSnippet}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 relative">
                      <span className="text-xs text-zinc-500 group-hover:text-zinc-400 font-normal">
                        {dateStr}
                      </span>

                      <button
                        id={`search-more-btn-${conv.id}`}
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
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all ml-1.5"
                        title="Conversation Options"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
                id={`search-share-btn-${activeConv.id}`}
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
                id={`search-pin-btn-${activeConv.id}`}
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
                id={`search-rename-btn-${activeConv.id}`}
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
                id={`search-delete-btn-${activeConv.id}`}
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
