export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: any; // Firestore Timestamp or ISO string
  modelUsed?: string;
  translatedContent?: string;
  sources?: { uri: string; title: string }[];
  file?: {
    name: string;
    mimeType: string;
    base64?: string;
  };
  isImage?: boolean;
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
  lastMessageSnippet?: string;
  isPinned?: boolean;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'amoled';
  accessibility: {
    fontSize: 'sm' | 'md' | 'lg' | 'xl';
    screenReader: boolean;
    speechRate: number; // 0.5 to 2
  };
}

export interface AlarmItem {
  id: string;
  time: string;
  label: string;
  isActive: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  category: string;
  url?: string;
}

export function getInitials(name?: string, email?: string): string {
  if (name) {
    const trimmed = name.trim();
    if (trimmed) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return trimmed.substring(0, Math.min(2, trimmed.length)).toUpperCase();
    }
  }
  if (email) {
    const localPart = email.split('@')[0];
    const parts = localPart.trim().split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return localPart.substring(0, Math.min(2, localPart.length)).toUpperCase();
  }
  return '?';
}

export interface AvatarStyle {
  bg: string;
  hoverBg: string;
  shadow: string;
  glow: string;
}

export function getAvatarStyle(identifier?: string): AvatarStyle {
  const styles: AvatarStyle[] = [
    {
      bg: 'bg-gradient-to-tr from-indigo-600 to-violet-500',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-indigo-600/20',
      glow: 'shadow-[0_0_15px_rgba(79,70,229,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-rose-500 to-orange-400',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-rose-500/20',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-emerald-600/20',
      glow: 'shadow-[0_0_15px_rgba(5,150,105,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-amber-500 to-yellow-400',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-amber-500/20',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-violet-600 to-fuchsia-500',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-violet-600/20',
      glow: 'shadow-[0_0_15px_rgba(124,58,237,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-cyan-500 to-blue-600',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-cyan-600/20',
      glow: 'shadow-[0_0_15px_rgba(8,145,178,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-pink-500 to-rose-400',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-pink-500/20',
      glow: 'shadow-[0_0_15px_rgba(219,39,119,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-blue-600 to-indigo-500',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-blue-600/20',
      glow: 'shadow-[0_0_15px_rgba(37,99,235,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-orange-500 to-amber-400',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-orange-500/20',
      glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-teal-600 to-emerald-500',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-teal-600/20',
      glow: 'shadow-[0_0_15px_rgba(13,148,136,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-red-500 to-rose-400',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-red-500/20',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    },
    {
      bg: 'bg-gradient-to-tr from-fuchsia-600 to-pink-500',
      hoverBg: 'hover:brightness-110',
      shadow: 'shadow-fuchsia-600/20',
      glow: 'shadow-[0_0_15px_rgba(192,38,211,0.3)]',
    },
  ];

  if (!identifier) {
    return styles[0]; // Default to Indigo
  }

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % styles.length;
  return styles[index];
}

export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';
  let text = markdown;
  text = text.replace(/\[ATTACHED DOCUMENT \/ FILE:[\s\S]*?\n\n/gi, '');
  text = text.replace(/\[Attached File:[\s\S]*?\n\n/gi, '');
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/#/g, '');
  text = text.replace(/(\*\*|__|\*|_|~~)/g, '');
  text = text.replace(/^\s*>\s+/gm, '');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  text = text.replace(/\|/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

