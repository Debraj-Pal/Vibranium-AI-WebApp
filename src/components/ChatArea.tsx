import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import Markdown from 'react-markdown';
import { getApiUrl, safeApiFetch } from '../lib/api';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Clock, 
  Languages, 
  Volume2, 
  Copy, 
  Check, 
  AlertCircle,
  HelpCircle,
  Loader2,
  Lock,
  Globe,
  CloudSun,
  Smile,
  ChevronDown,
  Plus,
  Search,
  Compass,
  Paperclip,
  X,
  Menu,
  Play,
  Pause,
  Brain,
  Image,
  Download,
  Cpu,
  Zap,
  Square,
  Map
} from 'lucide-react';
import { Message, UserSettings, Conversation, stripMarkdown } from '../types';
import VoiceVisualizer from './VoiceVisualizer';

interface ChatAreaProps {
  settings: UserSettings;
  currentUser: any;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  onRefreshConversations: () => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
  userPlan?: 'free' | 'pro' | 'max';
  onOpenUpgrade?: () => void;
  onOpenAuth?: () => void;
}

function generateSmartOfflineFallback(promptText: string): string {
  const lower = promptText.toLowerCase().trim();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Greetings! I am Vibranium AI. How may I assist you with your project, coding, or queries today?";
  }

  if (lower.includes('joke')) {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs!",
      "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
      "There are 10 types of people in the world: those who understand binary, and those who don't.",
      "How many programmers does it take to change a light bulb? None, that's a hardware problem."
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  if (lower.includes('code') || lower.includes('python') || lower.includes('javascript') || lower.includes('react') || lower.includes('function') || lower.includes('bug')) {
    return `Here is a structured template for your query regarding **"${promptText.substring(0, 40)}"**:

\`\`\`typescript
// Vibranium AI Offline Helper
function executeTask(input: string): { status: string; result: string } {
  console.log("Processing task:", input);
  return {
    status: "success",
    result: "Task processed successfully."
  };
}
\`\`\`

If you have specific code snippet requirements, please specify the language or framework!`;
  }

  return `I have processed your query: **"${promptText}"**

### Key Takeaways & Analysis:
- **Core Intent**: Addressing your request regarding "${promptText.substring(0, 60)}...".
- **Status**: Standby mode.
- **Action Step**: Please ensure your network connection is active for live Google Gemini Cloud generation.`;
}

const TOP_AI_MODELS = [
  { id: 'gemini-3-6-flash', name: 'Gemini 3.6 Flash', isFree: true, tag: 'Free' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', isFree: true, tag: 'Free' },
  { id: 'gemini-3-5-flash-lite', name: 'Gemini 3.5 Flash Lite', isFree: true, tag: 'Free' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', isFree: true, tag: 'Free' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Vision)', isFree: false, tag: 'Pro' },
  { id: 'sonar-2', name: 'Sonar 2', isFree: false, tag: 'Pro' },
  { id: 'gpt-5-6-terra', name: 'GPT-5.6 Terra', isFree: false, tag: 'Pro' },
  { id: 'gpt-oss', name: 'GPT-OSS (OpenAI)', isFree: false, tag: 'Pro' },
  { id: 'gpt-5-6-sol', name: 'GPT-5.6 Sol', isFree: false, tag: 'Max' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', isFree: false, tag: 'Pro' },
  { id: 'claude-opus-5', name: 'Claude Opus 5', isFree: false, tag: 'Max' },
  { id: 'glm-5-2', name: 'GLM 5.2', isFree: false, tag: 'Pro' },
  { id: 'kimi-k3', name: 'Kimi K3', isFree: false, tag: 'Pro' },
  { id: 'grok-4-5', name: 'Grok 4.5', isFree: false, tag: 'Pro' },
  { id: 'nemotron-3-ultra', name: 'Nemotron 3 Ultra', isFree: false, tag: 'Max' },
  { id: 'gemma-4', name: 'Google Gemma 4', isFree: false, tag: 'Max' },
];

export default function ChatArea({
  settings,
  currentUser,
  currentChatId,
  setCurrentChatId,
  onRefreshConversations,
  activeModule,
  setActiveModule,
  onUpdateSettings,
  isSidebarOpen = false,
  setIsSidebarOpen,
  userPlan = 'free',
  onOpenUpgrade,
  onOpenAuth
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Model selection states
  const [selectedModelId, setSelectedModelId] = useState('gemini-3-6-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [showProPopover, setShowProPopover] = useState(false);
  const [popoverTop, setPopoverTop] = useState<number>(28);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoadingResponse(false);
    showToast("Generation stopped");
  };

  // Auto fallback to free model if current user's plan is free or restricted
  useEffect(() => {
    const selectedModelObj = TOP_AI_MODELS.find(m => m.id === selectedModelId);
    if (selectedModelObj && !selectedModelObj.isFree) {
      const isLocked = (userPlan === 'free') || (userPlan === 'pro' && selectedModelObj.tag === 'Max');
      if (isLocked) {
        setSelectedModelId('gemini-3-6-flash');
      }
    }
  }, [userPlan, selectedModelId]);

  const updatePopoverPosition = useCallback((modelId: string) => {
    const itemEl = document.getElementById(`model-item-${modelId}`);
    const dropdownEl = document.getElementById('model-dropdown-container');
    const popoverEl = document.getElementById('model-hover-upgrade-popover');

    if (itemEl && dropdownEl) {
      const itemRect = itemEl.getBoundingClientRect();
      const dropdownRect = dropdownEl.getBoundingClientRect();
      const relativeTop = itemRect.top - dropdownRect.top;

      const popoverHeight = popoverEl ? popoverEl.getBoundingClientRect().height : 135;
      const dropdownHeight = dropdownRect.height;

      const maxTop = Math.max(0, dropdownHeight - popoverHeight);
      const clampedTop = Math.max(0, Math.min(relativeTop, maxTop));

      setPopoverTop(clampedTop);
    }
  }, []);

  useLayoutEffect(() => {
    if (hoveredModelId) {
      updatePopoverPosition(hoveredModelId);
      const id = requestAnimationFrame(() => updatePopoverPosition(hoveredModelId));
      return () => cancelAnimationFrame(id);
    }
  }, [hoveredModelId, updatePopoverPosition]);

  const handleModelMouseEnter = (modelId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredModelId(modelId);
    updatePopoverPosition(modelId);
  };

  const handleModelMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredModelId(null);
    }, 300);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredModelId(null);
    }, 200);
  };

  const isListeningRef = useRef(false);
  const isVoicePausedRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isVoicePausedRef.current = isVoicePaused;
  }, [isVoicePaused]);

  // Web Search, Deep Research and File Attachment states
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [thinkingModeEnabled, setThinkingModeEnabled] = useState(false);
  const [imageModeEnabled, setImageModeEnabled] = useState(false);
  const [mapsGroundingEnabled, setMapsGroundingEnabled] = useState(false);
  const [isPlusDropdownOpen, setIsPlusDropdownOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content?: string; type?: string; base64?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full screen expanded image viewer lightbox state and listener
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // Geolocation & Weather States
  const [locationContext, setLocationContext] = useState<{
    lat: number;
    lon: number;
    city: string;
    region: string;
    country: string;
    weather: string;
    temperature: string;
    apparentTemperature: string;
    humidity: string;
    windSpeed: string;
    rawWeatherData?: any;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Auto-detect IP location and weather context silently on mount, prioritizing high-accuracy browser Geolocation
  useEffect(() => {
    const autoDetectLocationObj = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            let weatherDesc = "Clear/Overcast";
            let temperature = "N/A";
            let apparentTemperature = "N/A";
            let humidity = "N/A";
            let windSpeed = "N/A";
            let weatherData: any = null;
            try {
              const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
              );
              if (weatherRes.ok) {
                weatherData = await weatherRes.json();
                const current = weatherData.current || {};
                weatherDesc = getWeatherDescriptionFromCode(current.weather_code || 0);
                temperature = `${current.temperature_2m ?? 'N/A'}°C`;
                apparentTemperature = `${current.apparent_temperature ?? 'N/A'}°C`;
                humidity = `${current.relative_humidity_2m ?? 'N/A'}%`;
                windSpeed = `${current.wind_speed_10m ?? 'N/A'} km/h`;
              }
            } catch (err) {
              console.warn("Silent weather lookup failed:", err);
            }

            setLocationContext({
              lat: data.latitude,
              lon: data.longitude,
              city: data.city || "your area",
              region: data.region || "",
              country: data.country_name || "",
              weather: weatherDesc,
              temperature,
              apparentTemperature,
              humidity,
              windSpeed,
              rawWeatherData: weatherData
            });
          }
        }
      } catch (err) {
        console.warn("Auto IP location detection failed:", err);
      }
    };

    const initLocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
              const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
              );
              const weatherData = await weatherRes.json();
              let city = "your local area";
              let region = "";
              let country = "";
              try {
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                  { headers: { "Accept-Language": "en" } }
                );
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  const addr = geoData.address || {};
                  city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "your area";
                  region = addr.state || addr.region || "";
                  country = addr.country || "";
                }
              } catch (geoErr) {
                console.warn("OSM reverse geocoding failed:", geoErr);
              }
              const current = weatherData.current || {};
              const weatherDesc = getWeatherDescriptionFromCode(current.weather_code || 0);
              setLocationContext({
                lat,
                lon,
                city,
                region,
                country,
                weather: weatherDesc,
                temperature: `${current.temperature_2m ?? 'N/A'}°C`,
                apparentTemperature: `${current.apparent_temperature ?? 'N/A'}°C`,
                humidity: `${current.relative_humidity_2m ?? 'N/A'}%`,
                windSpeed: `${current.wind_speed_10m ?? 'N/A'} km/h`,
                rawWeatherData: weatherData
              });
            } catch (err) {
              console.warn("Weather fetch from GPS failed, falling back to IP:", err);
              autoDetectLocationObj();
            }
          },
          (err) => {
            console.log("Geolocation permission denied/timeout, falling back to IP:", err);
            autoDetectLocationObj();
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 600000 }
        );
      } else {
        autoDetectLocationObj();
      }
    };

    initLocation();
  }, []);

  // Weather code helper
  const getWeatherDescriptionFromCode = (code: number): string => {
    if (code === 0) return "Clear Sky";
    if (code === 1 || code === 2 || code === 3) return "Mainly Clear, Partly Cloudy, or Overcast";
    if (code === 45 || code === 48) return "Foggy";
    if (code === 51 || code === 53 || code === 55) return "Drizzle";
    if (code === 61 || code === 63 || code === 65) return "Rainy";
    if (code === 71 || code === 73 || code === 75) return "Snowy";
    if (code === 80 || code === 81 || code === 82) return "Rain Showers";
    if (code === 95 || code === 96 || code === 99) return "Thunderstorm";
    return "Cloudy/Varying";
  };

  const fetchLocationAndWeather = async (): Promise<any> => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return null;
    }
    setIsLocating(true);
    showToast("Requesting location access for accurate weather report...");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`
            );
            const weatherData = await weatherRes.json();
            
            let city = "your local area";
            let region = "";
            let country = "";
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                {
                  headers: { "Accept-Language": "en" }
                }
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const addr = geoData.address || {};
                city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "your area";
                region = addr.state || addr.region || "";
                country = addr.country || "";
              }
            } catch (geoErr) {
              console.warn("Reverse geocoding failed:", geoErr);
            }

            const current = weatherData.current || {};
            const weatherDesc = getWeatherDescriptionFromCode(current.weather_code || 0);

            const context = {
              lat,
              lon,
              city,
              region,
              country,
              weather: weatherDesc,
              temperature: `${current.temperature_2m ?? 'N/A'}°C`,
              apparentTemperature: `${current.apparent_temperature ?? 'N/A'}°C`,
              humidity: `${current.relative_humidity_2m ?? 'N/A'}%`,
              windSpeed: `${current.wind_speed_10m ?? 'N/A'} km/h`,
              rawWeatherData: weatherData
            };
            setLocationContext(context);
            setIsLocating(false);
            showToast(`Location detected: ${city}`);
            resolve(context);
          } catch (err) {
            console.error("Failed to fetch weather or reverse geocode:", err);
            setIsLocating(false);
            resolve(null);
          }
        },
        (error) => {
          console.warn("Geolocation permission denied/failed:", error);
          setIsLocating(false);
          showToast("Location access denied or unavailable.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  // Custom Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Translation dropdown states for message bubbles
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [messageTargetLang, setMessageTargetLang] = useState('es');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const initialInputRef = useRef<string>('');

  const getConversationsKey = (id?: string) => {
    if (currentUser) {
      if (id && !id.startsWith('local_')) {
        return null;
      }
      return `vibranium_user_${currentUser.uid}_conversations`;
    }
    return 'vibranium_guest_conversations';
  };

  // Helper to extract numeric timestamp in ms for sorting
  const getMessageTime = (m: Message): number => {
    if (!m || !m.timestamp) return 0;
    if (typeof m.timestamp === 'number') return m.timestamp;
    if (typeof m.timestamp === 'string') {
      const parsed = new Date(m.timestamp).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    if (m.timestamp instanceof Date) return m.timestamp.getTime();
    if (typeof (m.timestamp as any).toMillis === 'function') return (m.timestamp as any).toMillis();
    if (typeof (m.timestamp as any).seconds === 'number') return (m.timestamp as any).seconds * 1000;
    return 0;
  };

  // Load chat messages from Firestore (live subscription) or LocalStorage
  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const loadChatMessages = async () => {
      try {
        const sharedRef = doc(db, 'shared_conversations', currentChatId);
        const sharedSnap = await getDoc(sharedRef);
        if (isMounted && sharedSnap.exists()) {
          const data = sharedSnap.data();
          if (data.ownerId !== currentUser?.uid && data.messages && Array.isArray(data.messages)) {
            const list = [...data.messages];
            list.sort((a, b) => getMessageTime(a) - getMessageTime(b));
            setMessages(list);
            return;
          }
        }
      } catch (err) {
        console.warn("Shared chat check skipped:", err);
      }

      if (!isMounted) return;

      if (currentUser && !currentChatId.startsWith('local_')) {
        try {
          // Subscribing to messages of this conversation in Firestore
          const msgQuery = query(
            collection(db, 'users', currentUser.uid, 'conversations', currentChatId, 'messages'),
            orderBy('timestamp', 'asc')
          );

          unsubscribe = onSnapshot(msgQuery, (snapshot) => {
            const list: Message[] = [];
            snapshot.forEach((docSnap) => {
              // Use serverTimestamps: 'estimate' so pending writes don't evaluate to null
              const data = docSnap.data({ serverTimestamps: 'estimate' });
              list.push({ id: docSnap.id, ...data } as Message);
            });

            // Explicitly sort list chronologically so user prompt comes before assistant answer
            list.sort((a, b) => {
              const tA = getMessageTime(a);
              const tB = getMessageTime(b);
              if (tA !== tB && tA > 0 && tB > 0) return tA - tB;
              if (tA > 0 && tB === 0) return -1;
              if (tA === 0 && tB > 0) return 1;
              // If timestamps are equal or missing, ensure user prompt comes before assistant response
              if (a.role === 'user' && b.role === 'assistant') return -1;
              if (a.role === 'assistant' && b.role === 'user') return 1;
              return 0;
            });

            setMessages(list);
          }, (err) => {
            console.error("Firestore message subscription failed:", err);
            // Fallback guest storage
            const localMsg = localStorage.getItem(`vibranium_msg_${currentChatId}`);
            if (localMsg) {
              try {
                const list: Message[] = JSON.parse(localMsg);
                list.sort((a, b) => getMessageTime(a) - getMessageTime(b));
                setMessages(list);
              } catch (e) {
                setMessages([]);
              }
            } else {
              setMessages([]);
            }
          });
        } catch (e) {
          console.error("Failed to construct Firestore message subscription query:", e);
          // Fallback guest storage
          const localMsg = localStorage.getItem(`vibranium_msg_${currentChatId}`);
          if (localMsg) {
            try {
              const list: Message[] = JSON.parse(localMsg);
              list.sort((a, b) => getMessageTime(a) - getMessageTime(b));
              setMessages(list);
            } catch (e) {
              setMessages([]);
            }
          } else {
            setMessages([]);
          }
        }
      } else {
        // Fallback guest storage
        const localMsg = localStorage.getItem(`vibranium_msg_${currentChatId}`);
        if (localMsg) {
          try {
            const list: Message[] = JSON.parse(localMsg);
            list.sort((a, b) => getMessageTime(a) - getMessageTime(b));
            setMessages(list);
          } catch (e) {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }
    };

    loadChatMessages();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [currentChatId, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingResponse]);

  // Speech Recognition Hook
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      // Do not hardcode lang to en-US. Leaving it unset/empty allows Web Speech API to automatically use browser, system locale, and capture multilingual spoken languages natively.
      rec.lang = '';

      rec.onresult = (event: any) => {
        let spokenText = '';
        for (let i = 0; i < event.results.length; ++i) {
          spokenText += event.results[i][0].transcript + ' ';
        }
        
        spokenText = spokenText.trim();
        const prefix = initialInputRef.current ? initialInputRef.current.trim() + ' ' : '';
        setInput(prefix + spokenText);
      };

      rec.onend = () => {
        if (!isVoicePausedRef.current) {
          setIsListening(false);
          setIsVoicePaused(false);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech dictation error:", err);
        let errorMsg = "Speech dictation error occurred.";
        
        if (err.error === 'not-allowed') {
          errorMsg = "Microphone access blocked. Click the address bar icon to allow mic permissions, or open the app in a new tab if running in an iframe!";
        } else if (err.error === 'no-speech') {
          errorMsg = "No speech detected. Please speak clearly into your microphone.";
        } else if (err.error === 'audio-capture') {
          errorMsg = "No microphone was found. Please plug in a microphone and try again.";
        } else if (err.error === 'network') {
          errorMsg = "Network connection error during speech recognition.";
        } else if (err.error) {
          errorMsg = `Speech dictation error: ${err.error}. Ensure microphone permissions are active.`;
        }
        
        showToast(errorMsg);
        
        if (!isVoicePausedRef.current) {
          setIsListening(false);
          setIsVoicePaused(false);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported on this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      setIsVoicePaused(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    } else {
      initialInputRef.current = input;
      setIsListening(true);
      setIsVoicePaused(false);
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const toggleVoicePause = () => {
    if (!recognitionRef.current) return;

    if (isVoicePaused) {
      initialInputRef.current = input;
      setIsVoicePaused(false);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition failed to resume:", err);
      }
    } else {
      setIsVoicePaused(true);
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Speech recognition failed to pause:", err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const reader = new FileReader();
    
    // Check if the file is a plain text/code file
    const isTextFile = 
      (file.type && (file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml')) ||
      ['txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'md', 'csv', 'html', 'css', 'xml', 'py', 'java', 'c', 'cpp', 'sh', 'log', 'yaml', 'yml'].includes(fileExtension);

    reader.onload = (event) => {
      const resultStr = event.target?.result as string;
      if (isTextFile) {
        setAttachedFile({
          name: file.name,
          content: resultStr,
          type: file.type || 'text/plain'
        });
      } else {
        // It's a binary file (Image, PDF, Word, Excel, PPT, Audio, Video, etc.)
        const base64 = resultStr.split(',')[1];
        setAttachedFile({
          name: file.name,
          content: resultStr, // base64 Data URL
          type: file.type || 'application/octet-stream',
          base64: base64
        });
      }
      showToast(`Attached file: ${file.name}`);
    };

    if (isTextFile) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Smart Title Synthesizer for instant clean titles
  const generateSmartTitle = (rawText: string): string => {
    if (!rawText || !rawText.trim()) return 'New Conversation';
    
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
    const lower = cleaned.toLowerCase();
    
    const prefixes = [
      'generate an image of', 'generate an image', 'create an image of', 'create an image',
      'draw an image of', 'draw a', 'picture of', 'make an image of',
      'can you help me with', 'can you help me', 'can you write a', 'can you write', 'can you explain',
      'can you', 'could you please', 'could you', 'please help me to', 'please help me',
      'please write a', 'please write', 'please generate', 'please',
      'how to fix', 'how to create', 'how to make', 'how to build', 'how to', 'how do i', 'how can i',
      'i want to create', 'i want to build', 'i want to', 'i need to', 'i need a',
      'tell me about', 'what is the', 'what is', 'what are the', 'what are', 'explain the', 'explain',
      'give me a list of', 'give me a', 'give me', 'write a python script for', 'write a python script to',
      'write a script for', 'write code for', 'write code to', 'write a'
    ];

    for (const p of prefixes) {
      if (lower.startsWith(p + ' ')) {
        cleaned = cleaned.substring(p.length).trim();
        break;
      }
    }

    cleaned = cleaned.replace(/^[^\w]+/, '');
    if (!cleaned) cleaned = rawText.trim();

    const words = cleaned.split(/\s+/).slice(0, 6);
    const capitalized = words.map((word) => {
      if (word.length <= 2 && ['a', 'an', 'in', 'on', 'at', 'to', 'of', 'for', 'or', 'and', 'is'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    let finalTitle = capitalized.substring(0, 36).trim();
    if (capitalized.length > 36) finalTitle += '...';
    if (finalTitle.length > 0) {
      finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);
    }

    return finalTitle || 'New Conversation';
  };

  // AI-powered title generator (ChatGPT style)
  const generateAiTitleAsync = async (convId: string, userPrompt: string) => {
    try {
      const res = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Create a unique, highly concise 2 to 5 word topic title (like ChatGPT) for a chat conversation that begins with this user message:\n"${userPrompt.substring(0, 200)}"\n\nRules:\n- Respond with ONLY the raw title text.\n- Do NOT use quotation marks, punctuation, or any introductory text.\n- Keep it under 35 characters in Title Case.`
            }
          ],
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          clientLocalDateString: new Date().toLocaleString(),
          clientFormattedDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          clientFormattedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })
        })
      });

      if (res.ok) {
        const data = await res.json();
        let aiTitle = (data.reply || '').trim();
        aiTitle = aiTitle.replace(/^["'«]+|["'»]+$/g, '').replace(/\.$/, '').trim();
        if (aiTitle && aiTitle.length >= 3 && aiTitle.length <= 40) {
          if (currentUser && !convId.startsWith('local_')) {
            try {
              await updateDoc(doc(db, 'users', currentUser.uid, 'conversations', convId), {
                title: aiTitle,
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.warn("Failed to update AI title in Firestore, falling back to local:", err);
              const existingKey = getConversationsKey(convId);
              const existing = existingKey ? localStorage.getItem(existingKey) : null;
              if (existing) {
                try {
                  const list = JSON.parse(existing) as Conversation[];
                  const updated = list.map(c => c.id === convId ? { ...c, title: aiTitle } : c);
                  localStorage.setItem(existingKey, JSON.stringify(updated));
                } catch (e) {}
              }
            }
          } else {
            const existingKey = getConversationsKey(convId);
            const existing = existingKey ? localStorage.getItem(existingKey) : null;
            if (existing) {
              try {
                const list = JSON.parse(existing) as Conversation[];
                const updated = list.map(c => c.id === convId ? { ...c, title: aiTitle } : c);
                localStorage.setItem(existingKey, JSON.stringify(updated));
              } catch (e) {}
            }
          }
          onRefreshConversations();
        }
      }
    } catch (e) {
      console.warn("AI title generation fallback to smart title:", e);
    }
  };

  // Create conversation document if needed
  const createNewConversation = async (firstMessageText: string): Promise<string> => {
    const smartTitle = stripMarkdown(generateSmartTitle(firstMessageText));
    const initialSnippet = stripMarkdown(firstMessageText).substring(0, 200);

    let convId = '';
    if (currentUser) {
      try {
        const convRef = await addDoc(collection(db, 'users', currentUser.uid, 'conversations'), {
          title: smartTitle,
          userId: currentUser.uid,
          lastMessageSnippet: initialSnippet,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        convId = convRef.id;
      } catch (firestoreErr: any) {
        console.error("Firestore createNewConversation error, falling back to local storage:", firestoreErr);
        // Fallback to local storage (Guest/Fallback mode)
        convId = 'local_' + Date.now().toString();
        const newConv: Conversation = {
          id: convId,
          title: smartTitle,
          userId: currentUser.uid,
          lastMessageSnippet: initialSnippet,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const existingKey = getConversationsKey(convId);
        const existing = existingKey ? localStorage.getItem(existingKey) : null;
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(newConv);
        if (existingKey) {
          localStorage.setItem(existingKey, JSON.stringify(list));
        }
        convId = newConv.id;
      }
    } else {
      convId = 'conv_' + Date.now().toString();
      const newConv: Conversation = {
        id: convId,
        title: smartTitle,
        userId: 'guest',
        lastMessageSnippet: initialSnippet,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const existingKey = getConversationsKey(convId);
      const existing = existingKey ? localStorage.getItem(existingKey) : null;
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newConv);
      if (existingKey) {
        localStorage.setItem(existingKey, JSON.stringify(list));
      }
      convId = newConv.id;
    }

    onRefreshConversations();

    // Trigger AI background title synthesis for ChatGPT-like unique title
    generateAiTitleAsync(convId, firstMessageText);

    return convId;
  };

  const sanitizeFirestoreData = (data: any): any => {
    if (data === undefined) return null;
    if (data === null) return null;
    if (data instanceof Date) return data;
    if (typeof data === 'object') {
      // Preserve Firestore FieldValue (e.g. serverTimestamp), Timestamp objects, and objects with toMillis/isEqual
      if (
        data.constructor?.name === 'FieldValue' || 
        data.constructor?.name === 'Timestamp' ||
        typeof data.toMillis === 'function' ||
        typeof data.isEqual === 'function' ||
        (data._methodName && typeof data._methodName === 'string')
      ) {
        return data;
      }
      if (Array.isArray(data)) {
        return data.map(sanitizeFirestoreData);
      }
      const clean: any = {};
      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
          clean[key] = sanitizeFirestoreData(val);
        }
      }
      return clean;
    }
    return data;
  };

  // Add message helper
  const addMessageToDatabase = async (
    convId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    modelUsed?: string, 
    sources?: { uri: string; title: string }[],
    file?: { name: string; mimeType: string; base64?: string },
    isImage?: boolean,
    imageUrl?: string
  ) => {
    const rawMsgData = {
      role,
      content,
      timestamp: currentUser ? serverTimestamp() : new Date().toISOString(),
      modelUsed: modelUsed || '',
      ...(sources ? { sources } : {}),
      ...(file ? { file } : {}),
      ...(isImage !== undefined ? { isImage } : {}),
      ...(imageUrl ? { imageUrl } : {})
    };

    const msgData = sanitizeFirestoreData(rawMsgData);
    if (currentUser) {
      msgData.timestamp = serverTimestamp();
    }

    const snippetText = stripMarkdown(content).substring(0, 300);

    if (currentUser && !convId.startsWith('local_')) {
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'conversations', convId, 'messages'), msgData);
        try {
          await updateDoc(doc(db, 'users', currentUser.uid, 'conversations', convId), {
            lastMessageSnippet: snippetText,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          // ignore update snippet error
        }
      } catch (firestoreErr: any) {
        console.error("Firestore addMessageToDatabase error, falling back to localStorage:", firestoreErr);
        // Fallback: save to localStorage
        const localMsgKey = `vibranium_msg_${convId}`;
        const existing = localStorage.getItem(localMsgKey);
        const list = existing ? JSON.parse(existing) : [];
        const localMsgData = { ...msgData, timestamp: new Date().toISOString() };
        list.push({ id: 'msg_' + Date.now().toString(), ...localMsgData });
        list.sort((a: Message, b: Message) => getMessageTime(a) - getMessageTime(b));

        // Update guest conversation snippet
        const existingKey = getConversationsKey(convId);
        const existingConvs = existingKey ? localStorage.getItem(existingKey) : null;
        if (existingConvs) {
          try {
            const convList = JSON.parse(existingConvs) as Conversation[];
            const updated = convList.map(c => c.id === convId ? { ...c, lastMessageSnippet: snippetText, updatedAt: new Date().toISOString() } : c);
            if (existingKey) {
              localStorage.setItem(existingKey, JSON.stringify(updated));
            }
          } catch (e) {
            // ignore
          }
        }

        try {
          localStorage.setItem(localMsgKey, JSON.stringify(list));
          setMessages(list);
        } catch (e: any) {
          console.warn("localStorage quota exceeded:", e);
        }
      }
    } else {
      const localMsgKey = `vibranium_msg_${convId}`;
      const existing = localStorage.getItem(localMsgKey);
      const list = existing ? JSON.parse(existing) : [];
      list.push({ id: 'msg_' + Date.now().toString(), ...msgData });
      list.sort((a: Message, b: Message) => getMessageTime(a) - getMessageTime(b));

      // Update guest conversation snippet
      const existingKey = getConversationsKey(convId);
      const existingConvs = existingKey ? localStorage.getItem(existingKey) : null;
      if (existingConvs) {
        try {
          const convList = JSON.parse(existingConvs) as Conversation[];
          const updated = convList.map(c => c.id === convId ? { ...c, lastMessageSnippet: snippetText, updatedAt: new Date().toISOString() } : c);
          if (existingKey) {
            localStorage.setItem(existingKey, JSON.stringify(updated));
          }
        } catch (e) {
          // ignore
        }
      }
      
      try {
        localStorage.setItem(localMsgKey, JSON.stringify(list));
        setMessages(list);
      } catch (e: any) {
        console.warn("localStorage quota exceeded, sanitizing base64 data to fit:", e);
        
        // Let's strip base64 content from all messages in this conversation to save space
        const cleanedList = list.map((msg: any) => {
          if (msg.file && msg.file.base64) {
            const { base64, ...restFile } = msg.file;
            return {
              ...msg,
              file: {
                ...restFile,
                isPlaceholder: true,
                message: "Image/file content removed from history to free up local storage space."
              }
            };
          }
          return msg;
        });

        try {
          localStorage.setItem(localMsgKey, JSON.stringify(cleanedList));
          setMessages(cleanedList);
        } catch (innerErr) {
          console.warn("Still failing to save, dropping oldest messages:", innerErr);
          let truncatedList = [...cleanedList];
          let success = false;
          while (truncatedList.length > 2 && !success) {
            truncatedList.shift();
            try {
              localStorage.setItem(localMsgKey, JSON.stringify(truncatedList));
              setMessages(truncatedList);
              success = true;
            } catch (deepErr) {
              // continue trying
            }
          }
          if (!success) {
            console.error("Could not save any messages to localStorage:", innerErr);
            setMessages(list);
          }
        }
      }
    }
  };

  // Submit Text Query
  const handleSendMessage = async (textToSend = input) => {
    if (!textToSend.trim()) return;
    setError('');

    // Reset voice states on message submission
    setIsListening(false);
    setIsVoicePaused(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    let activeLocation = locationContext;
    const isWeatherQuery = textToSend.toLowerCase().includes("weather") || 
                           textToSend.toLowerCase().includes("temperature") || 
                           textToSend.toLowerCase().includes("climate");
    if (isWeatherQuery && !activeLocation) {
      activeLocation = await fetchLocationAndWeather();
    }

    const fileToUpload = attachedFile;
    setAttachedFile(null);

    let chatId = currentChatId;
    if (!chatId) {
      chatId = await createNewConversation(textToSend);
      setCurrentChatId(chatId);
    }

    const userFilePayload = fileToUpload 
      ? { 
          name: fileToUpload.name, 
          mimeType: fileToUpload.type || 'text/plain',
          ...(fileToUpload.base64 ? { base64: fileToUpload.base64 } : {})
        }
      : undefined;

    // Append user message
    setInput('');
    await addMessageToDatabase(chatId, 'user', textToSend, undefined, undefined, userFilePayload);

    setLoadingResponse(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Query server proxy Gemini endpoint
      let finalGeminiPrompt = textToSend;
      // Only append text content if the file is a text file (no base64)
      if (fileToUpload && !fileToUpload.base64) {
        finalGeminiPrompt = `[Attached File: ${fileToUpload.name}]\nFile Contents:\n${fileToUpload.content}\n\nUser Prompt: ${textToSend}`;
      }

      const currentMessages = [...messages, { 
        id: 'temp', 
        role: 'user' as const, 
        content: finalGeminiPrompt, 
        timestamp: new Date(),
        file: userFilePayload
      }];
      
      let response;
      let fetchErrorMsg = '';

      try {
        response = await safeApiFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: currentMessages.map(m => ({ role: m.role, content: m.content, file: m.file })),
            systemInstruction: "You are Vibranium AI, a premium and helpful AI chatbot created by Debraj Pal. Your tone is highly professional, intelligent, concise, and sleek. You can reply in both paragraphs and detailed bullet points or numbered lists, choosing whichever format is most natural and effective for the user's prompt (just like standard Gemini or Claude). Use markdown formatting (such as double asterisks ** for bolding key headings, bullet lists, etc.) to structure your response beautifully.",
            modelId: selectedModelId,
            webSearchEnabled,
            deepResearchEnabled,
            thinkingModeEnabled,
            imageModeEnabled,
            mapsGroundingEnabled,
            locationContext: activeLocation,
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            clientLocalDateString: new Date().toLocaleString(),
            clientFormattedDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            clientFormattedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })
          })
        });
        
        if (!response.ok) {
          try {
            const errData = await response.json();
            fetchErrorMsg = errData.error || `Server returned error status ${response.status}`;
          } catch {
            fetchErrorMsg = `Server returned status ${response.status}`;
          }
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError' || (fetchErr.message && fetchErr.message.toLowerCase().includes('aborted'))) {
          // User deliberately clicked Stop button
          return;
        }
        console.error("Gemini fetch failed:", fetchErr);
        fetchErrorMsg = fetchErr.message || "Failed to connect to backend service.";
      }

      if (fetchErrorMsg) {
        console.warn(`Gemini API failed: ${fetchErrorMsg}`);
        
        const lowerErr = fetchErrorMsg.toLowerCase();
        const isQuotaError = 
          lowerErr.includes('quota') || 
          lowerErr.includes('429') || 
          lowerErr.includes('exhausted') || 
          lowerErr.includes('rate') || 
          lowerErr.includes('limit') ||
          lowerErr.includes('resource_exhausted');

        if (isQuotaError) {
          const quotaMessage = `⚡ **Google Gemini Quota Limit Reached**

The Google Gemini API rate limit or quota has temporarily been reached (\`RESOURCE_EXHAUSTED\`).

---

🤖 *Vibranium AI Offline Assistant Response:*

${generateSmartOfflineFallback(textToSend)}`;

          await addMessageToDatabase(chatId, 'assistant', quotaMessage, 'vibranium-standby-fallback');
          triggerTTSIfNeeded(quotaMessage);
          setError('');
        } else {
          setError(`Gemini API Error: ${fetchErrorMsg}`);
          showToast("Gemini API Error occurred");
        }
      } else if (response) {
        const data = await response.json();
        const responseText = data.content || 'An error occurred during response parsing.';
        await addMessageToDatabase(
          chatId, 
          'assistant', 
          responseText, 
          data.modelUsed || 'gemini-3.5-flash', 
          data.sources || [],
          undefined,
          data.isImage,
          data.imageUrl
        );
        triggerTTSIfNeeded(responseText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('aborted'))) {
        return;
      }
      console.error(err);
      const errText = err.message || 'An error occurred during communication.';
      setError(errText);
    } finally {
      abortControllerRef.current = null;
      setLoadingResponse(false);
    }
  };

  // Markdown Stripper for Text-To-Speech (removes #, *, _, `, ~, links, etc.)
  const stripMarkdownForTTS = (markdown: string): string => {
    if (!markdown) return '';
    let text = markdown;
    text = text.replace(/```[\s\S]*?```/g, ' Code snippet omitted. ');
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
  };

  // Text to Speech Synthesizer
  const triggerTTSIfNeeded = (text: string, isManualClick = false, msgId?: string) => {
    if (!('speechSynthesis' in window)) {
      if (isManualClick) showToast("Speech synthesis is not supported on your browser.");
      return;
    }

    // Toggle off if currently speaking this exact message
    if (msgId && speakingMessageId === msgId && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    if (settings.accessibility.screenReader || isManualClick) {
      window.speechSynthesis.cancel();
      const cleanText = stripMarkdownForTTS(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = settings.accessibility.speechRate || 1;

      if (msgId) {
        setSpeakingMessageId(msgId);
      }

      utterance.onend = () => {
        setSpeakingMessageId(null);
      };
      utterance.onerror = () => {
        setSpeakingMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // In-line translation for chat bubble
  const handleTranslateBubble = async (messageId: string, content: string) => {
    try {
      const response = await fetch(getApiUrl('/api/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          targetLanguage: messageTargetLang
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, translatedContent: data.translatedText } : m));
        setTranslatingMessageId(null);
      }
    } catch (err) {
      console.error("Bubble translation failed:", err);
    }
  };

  // Custom helper to format assistant's message content dynamically using react-markdown
  const renderFormattedMessageContent = (content: string) => {
    return (
      <div className="text-zinc-300 text-sm space-y-2 leading-relaxed">
        <Markdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-zinc-300">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-zinc-300">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-zinc-300">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
            em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
            h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-3 mb-1">{children}</h1>,
            h2: ({ children }) => <h2 className="text-md font-semibold text-white mt-3 mb-1">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold text-white mt-2 mb-1">{children}</h3>,
            code: ({ children }) => <code className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-300 border border-zinc-850">{children}</code>,
            pre: ({ children }) => <pre className="bg-zinc-950 p-3 rounded-lg overflow-x-auto font-mono text-xs my-2 border border-zinc-850 text-indigo-200">{children}</pre>,
            img: ({ src, alt }) => (
              <span 
                className="block my-3 max-w-lg rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/40 p-1 cursor-pointer group hover:border-zinc-700/80 transition-colors"
                onClick={() => src && setLightboxImage({ src, alt: alt || "Generated Image" })}
              >
                <img
                  src={src}
                  alt={alt || "Generated Image"}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[450px] object-contain rounded-lg hover:scale-[1.01] transition-transform duration-200 cursor-zoom-in shadow-xl group-hover:opacity-95"
                />
              </span>
            )
          }}
        >
          {content}
        </Markdown>
      </div>
    );
  };

  const selectedModelObj = TOP_AI_MODELS.find(m => m.id === selectedModelId) || TOP_AI_MODELS[0];

  const renderModelSelectorDropdown = (position: 'up' | 'down' = 'up') => {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-300 font-medium transition-all cursor-pointer shadow-sm"
          title="Select AI Model"
        >
          <Cpu className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="truncate max-w-[110px] sm:max-w-[150px]">{selectedModelObj.name}</span>
          <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
        </button>

        {isModelDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => {
                setIsModelDropdownOpen(false);
                setHoveredModelId(null);
              }}
            />
            <div 
              id="model-dropdown-container"
              className={`absolute right-0 ${
                position === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
              } w-64 rounded-xl bg-[#18191c] border border-zinc-800 shadow-2xl z-40 p-1.5 text-xs`}
            >
              <div className="px-2.5 py-1.5 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400">
                <span>Select AI Model</span>
              </div>
              <div 
                id="model-dropdown-scroll-list"
                onScroll={() => hoveredModelId && updatePopoverPosition(hoveredModelId)}
                className="py-1 max-h-[212px] overflow-y-auto space-y-0.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#2c2e4e] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#3b3d68] [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {TOP_AI_MODELS.map((model) => {
                  const isLocked = !model.isFree && (
                    userPlan === 'free' || (userPlan === 'pro' && model.tag === 'Max')
                  );
                  const isSelected = selectedModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      id={`model-item-${model.id}`}
                      type="button"
                      onMouseEnter={() => handleModelMouseEnter(model.id)}
                      onMouseLeave={handleModelMouseLeave}
                      onClick={() => {
                        if (model.isFree) {
                          setSelectedModelId(model.id);
                          setIsModelDropdownOpen(false);
                          setHoveredModelId(null);
                        } else if (!currentUser) {
                          setIsModelDropdownOpen(false);
                          setHoveredModelId(null);
                          onOpenAuth?.();
                        } else if (isLocked) {
                          setIsModelDropdownOpen(false);
                          setHoveredModelId(null);
                          onOpenUpgrade?.();
                        } else {
                          setSelectedModelId(model.id);
                          setIsModelDropdownOpen(false);
                          setHoveredModelId(null);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 text-white font-medium border border-indigo-500/30'
                          : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{model.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          model.isFree 
                            ? 'bg-zinc-800 text-zinc-400' 
                            : model.tag === 'Max'
                            ? 'bg-[#18191c] text-purple-300 border border-purple-800/40'
                            : 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'
                        }`}>
                          {model.tag}
                        </span>
                        {isLocked && <Zap className="h-3 w-3 text-amber-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hover Popover Card beside Model Dropdown (Positioned on the RIGHT with dynamic vertical alignment & hover bridge) */}
              {(() => {
                if (!hoveredModelId) return null;
                const hoveredModel = TOP_AI_MODELS.find(m => m.id === hoveredModelId);
                if (hoveredModel?.isFree) return null;
                const isHoveredLocked = hoveredModel && !hoveredModel.isFree && (
                  userPlan === 'free' || (userPlan === 'pro' && hoveredModel.tag === 'Max')
                );

                // Show popover if user is signed out OR if user hovering a locked model, but only for paid (non-free) models
                const shouldShowPopover = hoveredModel && !hoveredModel.isFree && (!currentUser || isHoveredLocked);
                if (!shouldShowPopover) return null;

                return (
                  <div 
                    id="model-hover-upgrade-popover-wrapper"
                    className="absolute left-full pl-2.5 z-50 transition-all duration-150 ease-out animate-in fade-in duration-150"
                    style={{ top: `${popoverTop}px` }}
                    onMouseEnter={handlePopoverMouseEnter}
                    onMouseLeave={handlePopoverMouseLeave}
                  >
                    <div 
                      id="model-hover-upgrade-popover"
                      className="w-64 rounded-2xl bg-[#18191c] border border-zinc-800 shadow-2xl p-4 text-left"
                    >
                      <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                        {!currentUser 
                          ? 'Access the top AI models'
                          : hoveredModel?.tag === 'Max'
                          ? 'Access Max tier models'
                          : 'Access Pro AI models'}
                      </h4>
                      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        {!currentUser 
                          ? 'Access the latest AI models from OpenAI, Anthropic (Claude) and more'
                          : hoveredModel?.tag === 'Max'
                          ? 'Upgrade to Max plan to access ultra-capable models like GPT-5.6 Sol, Claude Opus 5, and Nemotron 3 Ultra'
                          : 'Upgrade plan to access the latest AI models from OpenAI, Anthropic (Claude) and more'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModelDropdownOpen(false);
                          setHoveredModelId(null);
                          if (!currentUser) {
                            onOpenAuth?.();
                          } else {
                            onOpenUpgrade?.();
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.6)] border border-indigo-400/40 active:scale-[0.98] cursor-pointer"
                      >
                        {!currentUser ? 'Sign in' : 'Upgrade plan'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d0d] text-gray-200 overflow-hidden relative">
      
      {/* Header / Context Bar */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-3 md:px-6 bg-[#0a0a0a] shrink-0 z-20 safe-pt">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Hamburger Menu for Mobile/Tablet */}
          {!isSidebarOpen && setIsSidebarOpen && (
            <button
              id="mobile-chat-sidebar-toggle"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer touch-target flex items-center justify-center"
              title="Open Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold truncate max-w-[120px] sm:max-w-none">Vibranium AI</span>
          </div>
        </div>

        {/* Top Header Actions: Subscription Upgrade Button (Only shown when signed in) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <button
              id="chat-header-upgrade-btn"
              onClick={onOpenUpgrade}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Upgrade Plan"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="capitalize">{userPlan} Plan</span>
              {userPlan === 'free' && (
                <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ml-0.5">
                  Upgrade
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {messages.length === 0 ? (
        /* Empty Welcome Dashboard - Replicating screenshot exactly! */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto z-10">
          <div className="max-w-xl space-y-8">
            
            {/* Title Headings */}
            <div className="space-y-3 pt-8 md:pt-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Vibranium AI
              </h1>
              <p className="text-sm md:text-md text-gray-400 font-medium">
                Your personal AI assistant, built by Debraj Pal.
              </p>
            </div>

            {/* Quick Suggestions Cards (News, Weather, Joke) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4">
              <button
                id="suggestion-news-btn"
                onClick={() => {
                  setActiveModule('news');
                }}
                className="flex items-center gap-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 p-3.5 text-xs text-zinc-300 font-semibold text-left transition-all hover:scale-[1.01] active:scale-98"
              >
                <Globe className="h-4.5 w-4.5 text-indigo-400" />
                <span>Tell me news</span>
              </button>

              <button
                id="suggestion-weather-btn"
                onClick={() => {
                  handleSendMessage("Give me the current weather report.");
                }}
                className="flex items-center gap-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 p-3.5 text-xs text-zinc-300 font-semibold text-left transition-all hover:scale-[1.01] active:scale-98"
              >
                <CloudSun className="h-4.5 w-4.5 text-indigo-400" />
                <span>Weather</span>
              </button>

              <button
                id="suggestion-joke-btn"
                onClick={() => {
                  handleSendMessage("Tell me a funny joke.");
                }}
                className="flex items-center gap-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 p-3.5 text-xs text-zinc-300 font-semibold text-left transition-all hover:scale-[1.01] active:scale-98"
              >
                <Smile className="h-4.5 w-4.5 text-indigo-400" />
                <span>Tell a joke</span>
              </button>
            </div>

            {/* Guest warning banner if database syncing is offline */}
            {!currentUser ? (
              <div className="flex flex-col items-center gap-3 mx-auto mb-12">
                <div className="inline-flex items-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-[11px] text-zinc-400">
                  <Lock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Conversations are running in guest local mode. Connect account to sync cloud logs securely.</span>
                </div>
                <p className="text-[10.5px] text-zinc-600 tracking-widest uppercase font-mono mt-1">
                  &copy; 2026 Debraj Pal. All Rights Reserved
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mx-auto mb-12">
                <p className="text-[10.5px] text-zinc-600 tracking-widest uppercase font-mono">
                  &copy; 2026 Debraj Pal. All Rights Reserved
                </p>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* Conversation Feed */
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex flex-col max-w-3xl ${
                m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              {/* Message bubble */}
              <div 
                className={`rounded-2xl px-4.5 py-3 text-sm leading-relaxed max-w-full select-text shadow-sm ${
                  m.role === 'user'
                    ? 'bg-zinc-800 text-white font-medium rounded-tr-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none'
                }`}
              >
                {/* Text Content */}
                {m.role === 'user' ? (
                  <div className="flex flex-col gap-2">
                    {m.file && m.file.mimeType && m.file.mimeType.startsWith('image/') && m.file.base64 && (
                      <div 
                        className="max-w-xs rounded overflow-hidden border border-zinc-750 bg-zinc-950 cursor-pointer group hover:brightness-110 transition-all duration-200"
                        onClick={() => setLightboxImage({
                          src: `data:${m.file!.mimeType};base64,${m.file!.base64}`,
                          alt: m.file!.name
                        })}
                      >
                        <img
                          src={`data:${m.file.mimeType};base64,${m.file.base64}`}
                          alt={m.file.name}
                          referrerPolicy="no-referrer"
                          className="max-h-48 object-contain cursor-zoom-in"
                        />
                      </div>
                    )}
                    {m.file && m.file.mimeType && !m.file.mimeType.startsWith('image/') && (
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-950 text-xs text-zinc-300 border border-zinc-850">
                        <Paperclip className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="truncate max-w-[200px]">{m.file.name}</span>
                      </div>
                    )}
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {m.isImage && m.imageUrl ? (
                      <div className="flex flex-col gap-2">
                        {/* Custom Header indicating the Image Generator Engine */}
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs select-none pb-1 border-b border-zinc-800/60">
                          <Image className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Generated by Vibranium AI Core Creative Engine</span>
                        </div>
                        {/* Clean representation of the text content / prompt */}
                        {m.content && (
                          <div className="text-zinc-300 text-sm mb-1 leading-relaxed">
                            {renderFormattedMessageContent(m.content)}
                          </div>
                        )}
                        {/* Display of the generated image card with interactive hover states and clickable lightbox zoom */}
                        <div 
                          className="relative max-w-md rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-1 cursor-pointer group shadow-lg transition-all duration-200 hover:scale-[1.01]"
                          onClick={() => setLightboxImage({ src: m.imageUrl!, alt: "Generated Image" })}
                        >
                          <img
                            src={m.imageUrl}
                            alt="Generated Image"
                            referrerPolicy="no-referrer"
                            className="w-full max-h-[400px] object-contain rounded-lg transition-all duration-200 cursor-zoom-in"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                            <span className="bg-zinc-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-800 flex items-center gap-1.5 shadow-md">
                              <Image className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> Click to Expand / View Fullscreen
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {renderFormattedMessageContent(m.content)}
                      </div>
                    )}
                  </div>
                )}

                {/* Grounding/Search Sources */}
                {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-semibold block mb-1.5 uppercase tracking-wider flex items-center gap-1 select-none">
                      <Globe className="h-3 w-3 text-indigo-400" />
                      Sources Consulted ({m.sources.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto">
                      {m.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] text-indigo-300 font-mono transition-colors max-w-[200px] truncate"
                          title={src.title || src.uri}
                        >
                          <Globe className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{src.title || src.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Translation block if applicable */}
                {m.translatedContent && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs text-indigo-300 leading-relaxed font-medium">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Translation:</span>
                    {renderFormattedMessageContent(m.translatedContent)}
                  </div>
                )}

                {/* Quota / Billing Upgrade banner if message indicates limit */}
                {m.role === 'assistant' && (m.content.includes('RESOURCE_EXHAUSTED') || m.content.includes('Quota') || m.content.includes('rate limit')) && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/60 p-3 rounded-xl border border-indigo-500/20">
                    <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                      <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>Unlock top AI reasoning models & higher web search limits with Pro</span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenUpgrade}
                      className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-md"
                    >
                      Upgrade plan
                    </button>
                  </div>
                )}
              </div>

              {/* Message metadata / Toolbar */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 px-1 select-none">
                {m.modelUsed && <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">{m.modelUsed}</span>}
                
                {/* Speak Audio */}
                <button 
                  id={`bubble-speech-btn-${m.id}`}
                  onClick={() => triggerTTSIfNeeded(m.content, true, m.id)}
                  className={`transition-colors ${speakingMessageId === m.id ? 'text-indigo-400 font-bold animate-pulse' : 'hover:text-indigo-400'}`}
                  title={speakingMessageId === m.id ? "Stop speaking" : "Speak message aloud"}
                >
                  <Volume2 className={`h-3 w-3 ${speakingMessageId === m.id ? 'text-indigo-400 scale-110' : ''}`} />
                </button>

                {/* Copy message */}
                <button 
                  id={`bubble-copy-btn-${m.id}`}
                  onClick={() => handleCopyMessage(m.id, m.content)}
                  className="hover:text-indigo-400 transition-colors"
                  title="Copy message"
                >
                  {copiedId === m.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>

                {/* Translate Toggle */}
                {m.role === 'assistant' && (
                  <div className="relative inline-block">
                    <button 
                      id={`bubble-translate-trigger-${m.id}`}
                      onClick={() => setTranslatingMessageId(translatingMessageId === m.id ? null : m.id)}
                      className="hover:text-indigo-400 transition-colors flex items-center gap-0.5"
                      title="Translate reply"
                    >
                      <Languages className="h-3 w-3" />
                      <span>Translate</span>
                    </button>

                    {translatingMessageId === m.id && (
                      <div className="absolute left-0 mt-1 z-30 flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-2 rounded-md shadow-xl">
                        <select
                          id={`bubble-target-lang-${m.id}`}
                          value={messageTargetLang}
                          onChange={(e) => setMessageTargetLang(e.target.value)}
                          className="rounded bg-black border border-zinc-800 text-[10px] text-zinc-300 py-1 px-1.5 outline-none"
                        >
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="zh">Chinese</option>
                          <option value="ja">Japanese</option>
                          <option value="hi">Hindi</option>
                          <option value="bn">Bengali</option>
                        </select>
                        <button
                          id={`bubble-translate-btn-${m.id}`}
                          onClick={() => handleTranslateBubble(m.id, m.content)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2 py-1 text-[10px] font-bold"
                        >
                          Go
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loadingResponse && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 mr-auto font-mono select-none pl-1 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span>Vibranium AI is organizing a response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* API Warning notifications */}
      {error && (
        <div className="mx-6 mt-4 p-3.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 animate-fadeIn z-10 shrink-0">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
          <div className="leading-relaxed">
            <span className="font-bold">Communication block:</span> {error}
          </div>
        </div>
      )}

      {/* Floating Action / Text Bar Area */}
      <div className="p-3 md:p-6 bg-[#0d0d0d] z-10 shrink-0 safe-pb">
        
        {/* Hidden file input for Upload files */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          id="hidden-file-uploader"
        />

        {/* Attached file visual preview chip */}
        {attachedFile && (
          <div className="group max-w-3xl mx-auto mb-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-xs text-indigo-300">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="h-3.5 w-3.5 text-indigo-400 shrink-0 animate-bounce" />
              <span className="truncate font-medium">{attachedFile.name}</span>
              <span className="text-[10px] text-indigo-400/70 font-mono">({Math.round((attachedFile.content?.length || 0) / 1024 * 10) / 10} KB read)</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="w-0 opacity-0 overflow-hidden group-hover:w-4 group-hover:opacity-100 transition-all duration-200 ml-0 group-hover:ml-1 flex items-center justify-center p-0 rounded-full hover:bg-rose-500/20 text-rose-400 hover:text-white cursor-pointer shrink-0"
              title="Remove attachment"
            >
              <X className="h-3 w-3 shrink-0" />
            </button>
          </div>
        )}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
          className="relative max-w-3xl mx-auto"
        >
          {isListening ? (
            <div className={`w-full rounded-full border bg-[#111111] shadow-2xl py-2 md:py-2.5 pl-4 pr-3 flex flex-row items-center justify-between gap-2 md:gap-3 animate-fadeIn transition-all duration-300 ${
              loadingResponse 
                ? 'border-indigo-600/70 shadow-[0_0_22px_rgba(124,58,237,0.5)] ring-1 ring-indigo-500/30 animate-pulse' 
                : 'border-zinc-800 focus-within:border-zinc-700'
            }`}>
              {/* Left Side: Plus icon dropdown for web search, deep research, and files */}
              <div className="flex items-center shrink-0">
                <div className="relative shrink-0 select-none">
                  <button
                    id="chat-voice-plus-trigger"
                    type="button"
                    onClick={() => setIsPlusDropdownOpen(!isPlusDropdownOpen)}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                    title="Add search tools or attach files"
                  >
                    <Plus className={`h-4.5 w-4.5 transition-transform duration-200 ${isPlusDropdownOpen ? 'rotate-45 text-indigo-400' : ''}`} />
                  </button>

                  {isPlusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsPlusDropdownOpen(false)} />
                      <div className="absolute left-0 bottom-full mb-3 w-56 rounded-xl bg-zinc-900/95 backdrop-blur border border-zinc-800 shadow-2xl p-2 z-50 flex flex-col gap-1">
                        
                        {/* Web Search button */}
                        <button
                          type="button"
                          id="tool-web-search-btn-voice"
                          onClick={() => {
                            setWebSearchEnabled(!webSearchEnabled);
                            if (!webSearchEnabled) {
                              setDeepResearchEnabled(false);
                            }
                            setIsPlusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                            webSearchEnabled 
                              ? 'bg-indigo-950/60 border border-indigo-500/20 text-[#a78bfa]' 
                              : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Globe className={`h-4 w-4 ${webSearchEnabled ? 'text-[#a78bfa]' : 'text-zinc-400'}`} />
                            <div className="text-left">
                              <div>Web Search</div>
                              <div className="text-[9px] font-normal text-zinc-500">Enable real-time search grounding</div>
                            </div>
                          </div>
                          {webSearchEnabled && <Check className="h-3.5 w-3.5 text-[#a78bfa] shrink-0" />}
                        </button>

                        {/* Deep Research button */}
                        <button
                          type="button"
                          id="tool-deep-research-btn-voice"
                          onClick={() => {
                            setDeepResearchEnabled(!deepResearchEnabled);
                            if (!deepResearchEnabled) {
                              setWebSearchEnabled(false);
                            }
                            setIsPlusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                            deepResearchEnabled 
                              ? 'bg-purple-950/60 border border-purple-500/20 text-purple-300' 
                              : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Compass className={`h-4 w-4 ${deepResearchEnabled ? 'text-purple-400' : 'text-zinc-400'}`} />
                            <div className="text-left">
                              <div>Deep Research</div>
                              <div className="text-[9px] font-normal text-zinc-500">Exhaustive reasoning report</div>
                            </div>
                          </div>
                          {deepResearchEnabled && <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                        </button>

                        {/* Maps Grounding button */}
                        <button
                          type="button"
                          id="tool-maps-grounding-btn-voice"
                          onClick={() => {
                            setMapsGroundingEnabled(!mapsGroundingEnabled);
                            if (!mapsGroundingEnabled) {
                              setWebSearchEnabled(false);
                              setDeepResearchEnabled(false);
                              setThinkingModeEnabled(false);
                              setImageModeEnabled(false);
                            }
                            setIsPlusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                            mapsGroundingEnabled 
                              ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' 
                              : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Map className={`h-4 w-4 ${mapsGroundingEnabled ? 'text-emerald-400' : 'text-zinc-400'}`} />
                            <div className="text-left">
                              <div>Google Maps</div>
                              <div className="text-[9px] font-normal text-zinc-500">Inject dynamic Maps and Location data</div>
                            </div>
                          </div>
                          {mapsGroundingEnabled && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        </button>

                        <div className="h-px bg-zinc-800/65 my-1" />

                        {/* Upload Files button */}
                        <button
                          type="button"
                          id="tool-upload-files-btn-voice"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setIsPlusDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent transition-all text-xs font-semibold"
                        >
                          <Paperclip className="h-4 w-4 text-zinc-400" />
                          <div className="text-left">
                            <div>Upload files</div>
                            <div className="text-[9px] font-normal text-zinc-500">Support desktop & mobile explorers</div>
                          </div>
                        </button>

                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Center: Dynamic Wave Line Visualizer & Real-time Transcript */}
              <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-0.5">
                <VoiceVisualizer isListening={isListening} isPaused={isVoicePaused} />
                {input && (
                  <p className="text-[11px] text-zinc-400 font-medium truncate max-w-full px-2 mt-1 select-all animate-fadeIn" title={input}>
                    {input}
                  </p>
                )}
              </div>

              {/* Right Side: Pause/Resume control + Cancel Cross + Submit */}
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0 select-none">
                {/* Pause Button */}
                <button
                  id="chat-voice-pause-btn"
                  type="button"
                  onClick={toggleVoicePause}
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isVoicePaused 
                      ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/35 animate-pulse' 
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                  }`}
                  title={isVoicePaused ? 'Resume voice capture' : 'Pause voice capture'}
                >
                  {isVoicePaused ? <Play className="h-4 w-4 fill-current text-emerald-400" /> : <Pause className="h-4 w-4 fill-current text-white" />}
                </button>

                {/* Finish / Accept Button (between pause and send) */}
                <button
                  id="chat-voice-cancel-btn"
                  type="button"
                  onClick={() => {
                    setIsListening(false);
                    setIsVoicePaused(false);
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.stop();
                      } catch (err) {}
                    }
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-850 hover:bg-zinc-750 border border-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Accept voice capture"
                >
                  <Check className="h-4 w-4 text-zinc-400 hover:text-emerald-400" />
                </button>

                {/* Send / Stop Action */}
                <button
                  id="chat-submit-btn"
                  type="submit"
                  disabled={loadingResponse || !input.trim()}
                  className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/20 text-white disabled:text-zinc-500 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 flex items-center justify-center cursor-pointer"
                  title="Send transcript"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Perplexity-style prompt container: input text bar on top above features */
            <div className={`w-full border bg-[#111111] shadow-2xl rounded-2xl md:rounded-[24px] flex flex-col p-3.5 md:p-4 gap-3 transition-all duration-300 ${
              loadingResponse 
                ? 'border-indigo-600/70 shadow-[0_0_22px_rgba(124,58,237,0.5)] ring-1 ring-indigo-500/30 animate-pulse' 
                : 'border-zinc-800 focus-within:border-zinc-700 hover:border-zinc-700/80'
            }`}>
            
              {/* Top Row: Full width input text bar */}
              <div className="w-full">
                <input
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    imageModeEnabled
                      ? "Describe the image you want Vibranium to create..."
                      : thinkingModeEnabled
                        ? "Deeply reason and ask Vibranium..."
                        : webSearchEnabled 
                          ? "Search web & ask Vibranium..." 
                          : mapsGroundingEnabled
                            ? "Ask Vibranium with Google Maps..."
                            : deepResearchEnabled
                              ? "Investigate deeply with Vibranium..."
                              : "Ask anything..."
                  }
                  disabled={loadingResponse}
                  className="w-full bg-transparent text-sm md:text-base text-white placeholder-zinc-500 outline-none font-medium py-1 px-1"
                />
              </div>

              {/* Bottom Row: Controls bar with Plus Icon & Badges on Left, Model Select, Dictation, & Send on Right */}
              <div className="flex items-center justify-between w-full pt-2 border-t border-zinc-900/60">
                
                {/* Left Side: Plus Icon dropdown & Active feature badges */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <div className="relative shrink-0 select-none">
                    <button
                      id="chat-plus-trigger"
                      type="button"
                      onClick={() => setIsPlusDropdownOpen(!isPlusDropdownOpen)}
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                      title="Add search tools or attach files"
                    >
                      <Plus className={`h-4.5 w-4.5 transition-transform duration-200 ${isPlusDropdownOpen ? 'rotate-45 text-indigo-400' : ''}`} />
                    </button>

                    {isPlusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsPlusDropdownOpen(false)} />
                        <div className="absolute left-0 bottom-full mb-3 w-56 rounded-xl bg-zinc-900/95 backdrop-blur border border-zinc-800 shadow-2xl p-2 z-50 flex flex-col gap-1">
                          
                          {/* Web Search button */}
                          <button
                            type="button"
                            id="tool-web-search-btn"
                            onClick={() => {
                              const nextVal = !webSearchEnabled;
                              setWebSearchEnabled(nextVal);
                              if (nextVal) {
                                setDeepResearchEnabled(false);
                                setThinkingModeEnabled(false);
                                setImageModeEnabled(false);
                                setMapsGroundingEnabled(false);
                              }
                              setIsPlusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                              webSearchEnabled 
                                ? 'bg-indigo-950/60 border border-indigo-500/20 text-[#a78bfa]' 
                                : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Globe className={`h-4 w-4 ${webSearchEnabled ? 'text-[#a78bfa]' : 'text-zinc-400'}`} />
                              <div className="text-left">
                                <div>Web Search</div>
                                <div className="text-[9px] font-normal text-zinc-500">Enable real-time search grounding</div>
                              </div>
                            </div>
                            {webSearchEnabled && <Check className="h-3.5 w-3.5 text-[#a78bfa] shrink-0" />}
                          </button>

                          {/* Deep Research button */}
                          <button
                            type="button"
                            id="tool-deep-research-btn"
                            onClick={() => {
                              const nextVal = !deepResearchEnabled;
                              setDeepResearchEnabled(nextVal);
                              if (nextVal) {
                                setWebSearchEnabled(false);
                                setThinkingModeEnabled(false);
                                setImageModeEnabled(false);
                                setMapsGroundingEnabled(false);
                              }
                              setIsPlusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                              deepResearchEnabled 
                                ? 'bg-purple-950/60 border border-purple-500/20 text-purple-300' 
                                : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Compass className={`h-4 w-4 ${deepResearchEnabled ? 'text-purple-400' : 'text-zinc-400'}`} />
                              <div className="text-left">
                                <div>Deep Research</div>
                                <div className="text-[9px] font-normal text-zinc-500">Exhaustive reasoning report</div>
                              </div>
                            </div>
                            {deepResearchEnabled && <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                          </button>

                          {/* Thinking Mode button */}
                          <button
                            type="button"
                            id="tool-thinking-mode-btn"
                            onClick={() => {
                              const nextVal = !thinkingModeEnabled;
                              setThinkingModeEnabled(nextVal);
                              if (nextVal) {
                                setWebSearchEnabled(false);
                                setDeepResearchEnabled(false);
                                setImageModeEnabled(false);
                                setMapsGroundingEnabled(false);
                              }
                              setIsPlusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                              thinkingModeEnabled 
                                ? 'bg-amber-950/60 border border-amber-500/20 text-amber-400' 
                                : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Brain className={`h-4 w-4 ${thinkingModeEnabled ? 'text-amber-400' : 'text-zinc-400'}`} />
                              <div className="text-left">
                                <div>Thinking Mode</div>
                                <div className="text-[9px] font-normal text-zinc-500">Advanced step-by-step reasoning</div>
                              </div>
                            </div>
                            {thinkingModeEnabled && <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                          </button>

                          {/* Create Image button */}
                          <button
                            type="button"
                            id="tool-create-image-btn"
                            onClick={() => {
                              const nextVal = !imageModeEnabled;
                              setImageModeEnabled(nextVal);
                              if (nextVal) {
                                setWebSearchEnabled(false);
                                setDeepResearchEnabled(false);
                                setThinkingModeEnabled(false);
                                setMapsGroundingEnabled(false);
                              }
                              setIsPlusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                              imageModeEnabled 
                                ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' 
                                : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Image className={`h-4 w-4 ${imageModeEnabled ? 'text-emerald-400' : 'text-zinc-400'}`} />
                              <div className="text-left">
                                <div>Create Image</div>
                                <div className="text-[9px] font-normal text-zinc-500">Generate creative visual art</div>
                              </div>
                            </div>
                            {imageModeEnabled && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                          </button>

                          {/* Maps Grounding button */}
                          <button
                            type="button"
                            id="tool-maps-grounding-btn"
                            onClick={() => {
                              const nextVal = !mapsGroundingEnabled;
                              setMapsGroundingEnabled(nextVal);
                              if (nextVal) {
                                setWebSearchEnabled(false);
                                setDeepResearchEnabled(false);
                                setThinkingModeEnabled(false);
                                setImageModeEnabled(false);
                              }
                              setIsPlusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-xs font-semibold ${
                              mapsGroundingEnabled 
                                ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' 
                                : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Map className={`h-4 w-4 ${mapsGroundingEnabled ? 'text-emerald-400' : 'text-zinc-400'}`} />
                              <div className="text-left">
                                <div>Google Maps</div>
                                <div className="text-[9px] font-normal text-zinc-500">Inject dynamic Maps and Location data</div>
                              </div>
                            </div>
                            {mapsGroundingEnabled && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                          </button>

                          <div className="h-px bg-zinc-800/65 my-1" />

                          {/* Upload Files button */}
                          <button
                            type="button"
                            id="tool-upload-files-btn"
                            onClick={() => {
                              fileInputRef.current?.click();
                              setIsPlusDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent transition-all text-xs font-semibold"
                          >
                            <Paperclip className="h-4 w-4 text-zinc-400" />
                            <div className="text-left">
                              <div>Upload files</div>
                              <div className="text-[9px] font-normal text-zinc-500">Support desktop & mobile explorers</div>
                            </div>
                          </button>

                        </div>
                      </>
                    )}
                  </div>

                  {/* Web Search purple active badge with hovered cancel cross */}
                  {webSearchEnabled && (
                    <div className="group flex items-center bg-[#7c3aed]/10 border border-[#7c3aed]/25 hover:border-[#7c3aed]/50 text-[#a78bfa] text-[11px] px-2 py-0.5 rounded-full font-semibold select-none whitespace-nowrap transition-all duration-200">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-[#a78bfa]" />
                        <span>Web Search</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setWebSearchEnabled(false);
                        }}
                        className="w-0 opacity-0 overflow-hidden group-hover:w-4 group-hover:opacity-100 transition-all duration-200 ml-0 group-hover:ml-1.5 flex items-center justify-center p-0 rounded-full hover:bg-[#7c3aed]/20 text-[#a78bfa] hover:text-white cursor-pointer shrink-0"
                        title="Disable Web Search"
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* Deep Research pink active badge with hovered cancel cross */}
                  {deepResearchEnabled && (
                    <div className="group flex items-center bg-pink-500/10 border border-pink-500/25 text-pink-300 text-[11px] px-2 py-0.5 rounded-full font-semibold select-none whitespace-nowrap transition-all duration-200">
                      <div className="flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 shrink-0 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>Deep Research</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeepResearchEnabled(false);
                        }}
                        className="w-0 opacity-0 overflow-hidden group-hover:w-4 group-hover:opacity-100 transition-all duration-200 ml-0 group-hover:ml-1.5 flex items-center justify-center p-0 rounded-full hover:bg-pink-500/20 text-pink-300 hover:text-white cursor-pointer shrink-0"
                        title="Disable Deep Research"
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* Thinking Mode amber active badge with hovered cancel cross */}
                  {thinkingModeEnabled && (
                    <div className="group flex items-center bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] px-2 py-0.5 rounded-full font-semibold select-none whitespace-nowrap transition-all duration-200">
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 shrink-0 text-amber-400 animate-pulse" />
                        <span>Thinking Mode</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setThinkingModeEnabled(false);
                        }}
                        className="w-0 opacity-0 overflow-hidden group-hover:w-4 group-hover:opacity-100 transition-all duration-200 ml-0 group-hover:ml-1.5 flex items-center justify-center p-0 rounded-full hover:bg-amber-500/20 text-amber-400 hover:text-white cursor-pointer shrink-0"
                        title="Disable Thinking Mode"
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* Create Image emerald active badge with hovered cancel cross */}
                  {imageModeEnabled && (
                    <div className="group flex items-center bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] px-2 py-0.5 rounded-full font-semibold select-none whitespace-nowrap transition-all duration-200">
                      <div className="flex items-center gap-1.5">
                        <Image className="h-3.5 w-3.5 shrink-0 text-emerald-400 animate-pulse" />
                        <span>Create Image</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setImageModeEnabled(false);
                        }}
                        className="w-0 opacity-0 overflow-hidden group-hover:w-4 group-hover:opacity-100 transition-all duration-200 ml-0 group-hover:ml-1.5 flex items-center justify-center p-0 rounded-full hover:bg-emerald-500/20 text-emerald-400 hover:text-white cursor-pointer shrink-0"
                        title="Disable Create Image"
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* Google Maps active badge with hovered cancel cross */}
                  {mapsGroundingEnabled && (
                    <div className="group flex items-center bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[11px] px-2 py-0.5 rounded-full font-semibold select-none whitespace-nowrap transition-all duration-200">
                      <div className="flex items-center gap-1.5">
                        <Map className="h-3.5 w-3.5 shrink-0 text-teal-400 animate-pulse" />
                        <span>Google Maps</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMapsGroundingEnabled(false);
                        }}
                        className="w-0 opacity-0 overflow-hidden group-hover:w-4 group-hover:opacity-100 transition-all duration-200 ml-0 group-hover:ml-1.5 flex items-center justify-center p-0 rounded-full hover:bg-teal-500/20 text-teal-300 hover:text-white cursor-pointer shrink-0"
                        title="Disable Google Maps"
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Side: Model Selector + Dictation Mic + Send Button */}
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0 select-none">
                  
                  {/* Model Dropdown Selector */}
                  {renderModelSelectorDropdown('up')}

                  {/* Voice dictate mic button */}
                  <button
                    id="chat-mic-btn"
                    type="button"
                    onClick={toggleListening}
                    className={`rounded-full p-2 transition-all ${
                      isListening 
                        ? 'bg-indigo-600 text-white animate-pulse shadow shadow-indigo-600/35' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={isListening ? 'Stop capturing voice' : 'Dictate message'}
                  >
                    {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                  </button>

                  {/* Submit or Stop button */}
                  {loadingResponse ? (
                    <button
                      id="chat-stop-btn"
                      type="button"
                      onClick={handleStopGeneration}
                      className="rounded-full bg-indigo-600 hover:bg-indigo-500 p-2 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Stop generating response"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      id="chat-submit-btn"
                      type="submit"
                      disabled={!input.trim()}
                      className="rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/20 p-2 text-white disabled:text-zinc-500 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 flex items-center justify-center cursor-pointer"
                      title="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}

                </div>

              </div>
            </div>
          )}
        </form>

      </div>

      {/* Toast Popup Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white shadow-2xl animate-fadeIn select-none">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Expanded Full Screen Image Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          {/* Top Control Bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title / Info */}
            <div className="flex flex-col select-none">
              <span className="text-sm font-semibold text-zinc-100 truncate max-w-[280px] md:max-w-md">
                {lightboxImage.alt || "Expanded Image View"}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Vibranium Creative Gallery
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              {/* Download Button */}
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const response = await fetch(lightboxImage.src);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    // Generate a nice clean file name
                    const cleanName = (lightboxImage.alt || "vibranium-artwork")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .substring(0, 30);
                    link.download = `${cleanName || 'vibranium-generated'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    showToast("Downloaded image successfully!");
                  } catch (err) {
                    console.error("Failed to download image direct link:", err);
                    // Fallback to open in new window if download blocks
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`<img src="${lightboxImage.src}" alt="${lightboxImage.alt}" style="max-width:100%;" />`);
                    } else {
                      showToast("Could not download. Long-press image to save.");
                    }
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-all font-semibold active:scale-95"
                title="Download full quality image"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                title="Close Lightbox (Esc)"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Centered Image display container */}
          <div 
            className="w-full max-w-5xl max-h-[80vh] flex items-center justify-center relative mt-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-zinc-850 select-none animate-zoomIn cursor-zoom-out"
              onClick={() => setLightboxImage(null)}
            />
          </div>

          {/* Interactive Hint Banner at bottom */}
          <p className="text-[11px] text-zinc-500 font-medium select-none text-center mt-6 tracking-wide animate-fadeIn">
            Click anywhere on the backdrop or press <kbd className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800 font-mono text-[10px] mx-1">ESC</kbd> to return to chat.
          </p>
        </div>
      )}

    </div>
  );
}
