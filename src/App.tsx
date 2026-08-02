import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, setDoc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { UserSettings, Conversation, stripMarkdown, Message } from './types';
import { Menu, Share2, Copy, Check } from 'lucide-react';

// Import components
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SearchChatsView from './components/SearchChatsView';
import TranslationModule from './components/TranslationModule';
import ExtraTools from './components/ExtraTools';
import SettingsPanel from './components/SettingsPanel';
import AuthModal from './components/AuthModal';
import SubscriptionModal from './components/SubscriptionModal';
import VeoVideoLab from './components/VeoVideoLab';

const DEFAULT_SETTINGS: UserSettings = {
  userId: 'guest',
  theme: 'dark',
  accessibility: {
    fontSize: 'md',
    screenReader: false,
    speechRate: 1.0,
  },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string>('chat');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'max'>('free');
  const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null);
  const [chatToShare, setChatToShare] = useState<{ id: string; title: string } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [chatToRename, setChatToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const handleUpgradePlan = async (plan: 'free' | 'pro' | 'max') => {
    setUserPlan(plan);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          plan,
          email: currentUser.email || '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to update user plan in Firestore:", err);
      }
    }
  };

  // App Settings State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Conversations History State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Monitor user login state & live sync plan from user's Firestore document
  useEffect(() => {
    let userDocUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (user) {
        setIsAuthOpen(false);

        // Listen to Firestore doc /users/{user.uid} for account-specific subscription tier
        const userRef = doc(db, 'users', user.uid);
        userDocUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.plan && ['free', 'pro', 'max'].includes(data.plan)) {
              setUserPlan(data.plan as 'free' | 'pro' | 'max');
            } else {
              setUserPlan('free');
            }
          } else {
            // New user account: default to free plan in Firestore
            setUserPlan('free');
            setDoc(userRef, {
              email: user.email || '',
              plan: 'free',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(e => console.error("Error initializing user doc:", e));
          }
        }, (err) => {
          console.error("Firestore user plan subscription error:", err);
          setUserPlan('free');
        });
      } else {
        // Logged out / guest user: always reset to free
        setUserPlan('free');
      }
    });

    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
  }, []);

  // Load Settings from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('vibranium_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local settings:", e);
      }
    }
  }, []);

  // Detect shared conversation links (/share/:id or ?share=:id) and load into conversations list
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const shareIndex = pathParts.indexOf('share');
    const shareIdFromPath = shareIndex !== -1 && pathParts[shareIndex + 1] ? pathParts[shareIndex + 1] : null;
    const shareIdFromQuery = new URLSearchParams(window.location.search).get('share');
    const targetShareId = shareIdFromPath || shareIdFromQuery;

    if (targetShareId) {
      const shareDocRef = doc(db, 'shared_conversations', targetShareId);
      getDoc(shareDocRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const sharedConv: Conversation = {
            id: targetShareId,
            title: `${data.title || 'Shared Conversation'}`,
            userId: data.ownerId || 'shared',
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            isPinned: false
          };

          setConversations((prev) => {
            if (prev.some(c => c.id === targetShareId)) return prev;
            return [sharedConv, ...prev];
          });

          if (data.messages && Array.isArray(data.messages)) {
            localStorage.setItem(`vibranium_msg_${targetShareId}`, JSON.stringify(data.messages));
          }

          setCurrentChatId(targetShareId);
        } else {
          console.warn("Shared conversation document not found:", targetShareId);
        }
      }).catch((err) => {
        console.error("Error fetching shared conversation:", err);
      });
    }
  }, [db]);

  // Update Settings handler
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('vibranium_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync / Subscribe to Conversations list
  const loadConversations = () => {
    if (currentUser) {
      const q = query(
        collection(db, 'users', currentUser.uid, 'conversations'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Conversation);
        });
        setConversations(list);
      }, (err) => {
        console.error("Firestore conversations subscription error:", err);
      });
      return unsubscribe;
    } else {
      // Guest state load
      const local = localStorage.getItem('vibranium_guest_conversations');
      if (local) {
        setConversations(JSON.parse(local));
      } else {
        setConversations([]);
      }
    }
  };

  const migrateGuestConversations = async (user: any) => {
    const local = localStorage.getItem('vibranium_guest_conversations');
    if (!local) return;
    
    try {
      const list = JSON.parse(local) as Conversation[];
      if (list.length === 0) return;
      
      let newActiveId: string | null = null;
      
      for (const guestConv of list) {
        // Create conversation in Firestore
        const convRef = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
          title: guestConv.title || 'Untitled Conversation',
          userId: user.uid,
          createdAt: guestConv.createdAt ? new Date(guestConv.createdAt) : serverTimestamp(),
          updatedAt: guestConv.updatedAt ? new Date(guestConv.updatedAt) : serverTimestamp(),
        });
        
        const newFirestoreId = convRef.id;
        if (currentChatId === guestConv.id) {
          newActiveId = newFirestoreId;
        }
        
        // Migrate messages of this conversation
        const localMsgKey = `vibranium_msg_${guestConv.id}`;
        const localMsg = localStorage.getItem(localMsgKey);
        if (localMsg) {
          const msgs = JSON.parse(localMsg);
          for (const msg of msgs) {
            const msgTimestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
            await addDoc(collection(db, 'users', user.uid, 'conversations', newFirestoreId, 'messages'), {
              role: msg.role,
              content: msg.content,
              timestamp: msgTimestamp,
              modelUsed: msg.modelUsed || '',
            });
          }
          localStorage.removeItem(localMsgKey);
        }
      }
      
      localStorage.removeItem('vibranium_guest_conversations');
      if (newActiveId) {
        setCurrentChatId(newActiveId);
      }
      loadConversations();
    } catch (e) {
      console.error("Failed to migrate guest conversations to Firestore:", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      migrateGuestConversations(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    const unsub = loadConversations();
    return () => {
      if (unsub) unsub();
    };
  }, [currentUser]);

  const handleSelectChat = (id: string) => {
    setActiveModule('chat');
    setCurrentChatId(id);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleDeleteChat = async (id: string) => {
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'conversations', id));
      } catch (err) {
        console.error("Failed to delete chat from Firestore:", err);
      }
    } else {
      const existing = localStorage.getItem('vibranium_guest_conversations');
      if (existing) {
        const list = JSON.parse(existing) as Conversation[];
        const updatedList = list.filter(c => c.id !== id);
        localStorage.setItem('vibranium_guest_conversations', JSON.stringify(updatedList));
      }
      localStorage.removeItem(`vibranium_msg_${id}`);
      loadConversations();
    }
  };

  const triggerDeleteConfirm = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    setChatToDelete({
      id,
      title: conv?.title || 'Untitled Conversation'
    });
  };

  const handlePinChat = async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    const nextPinned = !conv.isPinned;
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'conversations', id), {
          isPinned: nextPinned
        });
      } catch (err) {
        console.error("Failed to pin chat in Firestore:", err);
      }
    } else {
      const existing = localStorage.getItem('vibranium_guest_conversations');
      if (existing) {
        const list = JSON.parse(existing) as Conversation[];
        const updatedList = list.map(c => c.id === id ? { ...c, isPinned: nextPinned } : c);
        localStorage.setItem('vibranium_guest_conversations', JSON.stringify(updatedList));
        loadConversations();
      }
    }
  };

  const triggerRenameModal = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setChatToRename({ id, title: conv.title || 'Untitled Conversation' });
      setRenameInput(conv.title || 'Untitled Conversation');
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatToRename || !renameInput.trim()) return;
    const id = chatToRename.id;
    const newTitle = renameInput.trim();
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'conversations', id), {
          title: newTitle,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to rename chat in Firestore:", err);
      }
    } else {
      const existing = localStorage.getItem('vibranium_guest_conversations');
      if (existing) {
        const list = JSON.parse(existing) as Conversation[];
        const updatedList = list.map(c => c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c);
        localStorage.setItem('vibranium_guest_conversations', JSON.stringify(updatedList));
        loadConversations();
      }
    }
    setChatToRename(null);
  };

  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handlePublishShare = async (id: string, conv: Conversation) => {
    setShareLoading(true);
    setShareError(null);

    try {
      let msgs: Message[] = [];
      if (currentUser) {
        // Query messages from Firestore
        const msgQuery = query(
          collection(db, 'users', currentUser.uid, 'conversations', id, 'messages'),
          orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(msgQuery);
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let tsVal = data.timestamp;
          if (tsVal && typeof tsVal.toMillis === 'function') {
            tsVal = tsVal.toMillis();
          } else if (tsVal && typeof tsVal.seconds === 'number') {
            tsVal = tsVal.seconds * 1000;
          } else if (tsVal instanceof Date) {
            tsVal = tsVal.getTime();
          } else if (typeof tsVal === 'object' && tsVal !== null) {
            tsVal = Date.now();
          }
          msgs.push({
            id: docSnap.id,
            role: data.role,
            content: data.content,
            timestamp: tsVal || Date.now(),
            modelUsed: data.modelUsed || '',
            translatedContent: data.translatedContent || '',
            sources: data.sources || [],
            file: data.file || null,
            isImage: data.isImage || false,
            imageUrl: data.imageUrl || '',
          } as any);
        });
      } else {
        // Fetch from guest storage
        const localMsg = localStorage.getItem(`vibranium_msg_${id}`);
        if (localMsg) {
          msgs = JSON.parse(localMsg);
        }
      }

      // Format messages safely
      const serializableMsgs = msgs.map(m => {
        let ts = m.timestamp;
        if (ts && typeof ts.toMillis === 'function') {
          ts = ts.toMillis();
        } else if (ts && typeof ts.seconds === 'number') {
          ts = ts.seconds * 1000;
        } else if (ts instanceof Date) {
          ts = ts.getTime();
        } else if (typeof ts === 'object' && ts !== null) {
          ts = Date.now();
        }
        return {
          id: m.id || Math.random().toString(),
          role: m.role,
          content: m.content,
          timestamp: ts || Date.now(),
          modelUsed: m.modelUsed || '',
          translatedContent: m.translatedContent || '',
          sources: m.sources || [],
          file: m.file || null,
          isImage: m.isImage || false,
          imageUrl: m.imageUrl || '',
        };
      });

      // Write to Firestore shared_conversations
      const shareDocRef = doc(db, 'shared_conversations', id);
      await setDoc(shareDocRef, {
        title: conv.title || 'Shared Conversation',
        ownerId: currentUser?.uid || 'guest',
        createdAt: conv.createdAt ? (typeof conv.createdAt.toMillis === 'function' ? conv.createdAt.toMillis() : conv.createdAt) : Date.now(),
        updatedAt: Date.now(),
        messages: serializableMsgs
      }, { merge: true });

    } catch (err) {
      console.error("Failed to share conversation:", err);
      setShareError("Failed to generate a public share link. Please try again.");
    } finally {
      setShareLoading(false);
    }
  };

  const triggerShareModal = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setChatToShare({ id, title: conv.title || 'Untitled Conversation' });
      setShareCopied(false);
      handlePublishShare(id, conv);
    }
  };

  const copyShareLink = () => {
    if (!chatToShare) return;
    const url = `${window.location.origin}/share/${chatToShare.id}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  // Sync Theme attribute on document element
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  // Map font size parameter to viewport class
  const getFontSizeClass = () => {
    switch (settings.accessibility.fontSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case 'md':
      default:
        return 'text-base';
    }
  };

  // Map theme parameter to root class background
  const getThemeBackground = () => {
    if (settings.theme === 'light') {
      return 'bg-slate-100 text-slate-900 light-theme';
    }
    return settings.theme === 'amoled' ? 'bg-[#000000] text-gray-200' : 'bg-[#0a0a0a] text-gray-200';
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-xs font-mono tracking-widest uppercase">Initializing Vibranium AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden text-gray-200 ${getThemeBackground()} ${getFontSizeClass()}`}>
      
      {/* Mobile/Tablet Overlay Backdrop for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 animate-fadeIn cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        conversations={conversations}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onDeleteChat={triggerDeleteConfirm}
        onShareChat={triggerShareModal}
        onPinChat={handlePinChat}
        onRenameChat={triggerRenameModal}
        userPlan={userPlan}
        onOpenUpgrade={() => setIsSubscriptionModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Floating Sidebar Trigger for Mobile/Tablet */}
        {!isSidebarOpen && (
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-3 left-4 z-30 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-md transition-all cursor-pointer"
            title="Open Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        
        {/* Chat Assistant Area */}
        {activeModule === 'chat' && (
          <ChatArea
            settings={settings}
            currentUser={currentUser}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            onRefreshConversations={loadConversations}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            onUpdateSettings={handleUpdateSettings}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            userPlan={userPlan}
            onOpenUpgrade={() => setIsSubscriptionModalOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* Search Chats Module View */}
        {activeModule === 'search' && (
          <SearchChatsView
            conversations={conversations}
            onSelectChat={handleSelectChat}
            onDeleteChat={triggerDeleteConfirm}
            onShareChat={triggerShareModal}
            onPinChat={handlePinChat}
            onRenameChat={triggerRenameModal}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        )}

        {/* Language Translator Module */}
        {activeModule === 'translator' && (
          <TranslationModule 
            speechRate={settings.accessibility.speechRate}
          />
        )}

        {/* Quick Tools Modules */}
        {(activeModule === 'camera' || activeModule === 'screenshot' || activeModule === 'alarms' || activeModule === 'news') && (
          <ExtraTools
            toolType={activeModule as any}
            currentUser={currentUser}
          />
        )}

        {/* Veo Video Lab */}
        {activeModule === 'video' && (
          <VeoVideoLab
            currentUser={currentUser}
          />
        )}

        {/* System Settings & Engine Providers */}
        {activeModule === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </div>

      {/* Account Authentication modal */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Subscription / Plan Upgrade Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentPlan={userPlan}
        onUpgradePlan={handleUpgradePlan}
      />

      {/* Delete Chat Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with elegant blur */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fadeIn"
            onClick={() => setChatToDelete(null)}
          />
          
          {/* Modal Card with curved edges */}
          <div className="relative w-full max-w-sm bg-[#161617] border border-zinc-800/80 rounded-[28px] p-6 shadow-2xl z-50 transform scale-100 animate-fadeIn">
            <h3 className="text-xl font-bold text-zinc-100 mb-3 tracking-tight">
              Delete chat?
            </h3>
            
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              This will delete <span className="font-bold text-zinc-200">{stripMarkdown(chatToDelete.title)}</span>.
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChatToDelete(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-850 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => {
                  handleDeleteChat(chatToDelete.id);
                  setChatToDelete(null);
                }}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-950/20 hover:shadow-red-950/40 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Chat Modal */}
      {chatToRename && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fadeIn"
            onClick={() => setChatToRename(null)}
          />
          <form 
            onSubmit={handleRenameSubmit}
            className="relative w-full max-w-sm bg-[#161617] border border-zinc-800/80 rounded-[28px] p-6 shadow-2xl z-50 transform scale-100 animate-fadeIn"
          >
            <h3 className="text-xl font-bold text-zinc-100 mb-3 tracking-tight">
              Rename conversation
            </h3>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Enter a new title for this conversation.
            </p>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Conversation title"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 mb-6 transition-colors"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChatToRename(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-850 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-950/20 hover:shadow-indigo-950/40 cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share Conversation Modal */}
      {chatToShare && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fadeIn"
            onClick={() => setChatToShare(null)}
          />
          <div className="relative w-full max-w-sm bg-[#161617] border border-zinc-800/80 rounded-[28px] p-6 shadow-2xl z-50 transform scale-100 animate-fadeIn">
            <h3 className="text-xl font-bold text-zinc-100 mb-2 tracking-tight">
              Share conversation
            </h3>
            <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
              Anyone with this link can view <span className="font-semibold text-zinc-200">{stripMarkdown(chatToShare.title)}</span>.
            </p>

            {shareLoading ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 mb-4">
                <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <span className="text-xs text-zinc-400 font-mono tracking-wider">Generating public link...</span>
              </div>
            ) : shareError ? (
              <div className="text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl p-3.5 mb-6 text-center leading-relaxed">
                {shareError}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800 mb-6">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/share/${chatToShare.id}`}
                  className="w-full bg-transparent text-xs text-zinc-300 outline-none px-2 font-mono truncate select-all"
                />
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white shrink-0 transition-colors cursor-pointer"
                >
                  {shareCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setChatToShare(null)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
