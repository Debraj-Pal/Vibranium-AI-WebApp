import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { getApiUrl } from '../lib/api';
import { 
  Languages, 
  Copy, 
  Check, 
  Volume2, 
  Mic, 
  MicOff, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface TranslationModuleProps {
  speechRate: number;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'it', name: 'Italian (Italiano)' }
];

export default function TranslationModule({ speechRate }: TranslationModuleProps) {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [detectedLang, setDetectedLang] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);

  // Handle translation requests
  const handleTranslate = async (textToTranslate = inputText) => {
    if (!textToTranslate.trim()) {
      setTranslatedText('');
      setDetectedLang('');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      const response = await fetch(getApiUrl('/api/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          targetLanguage: targetLangName
        })
      });

      if (!response.ok) {
        throw new Error('Translation backend returned an error.');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText || '');
      setDetectedLang(data.detectedLanguage || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during translation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time translation trigger (debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (inputText.trim()) {
        handleTranslate();
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [inputText, targetLang]);

  // Speech Recognition configuration
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      // Leave rec.lang empty to allow the browser to auto-detect and capture spoken language natively
      rec.lang = '';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev ? prev + ' ' + transcript : transcript);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error', err);
        setIsListening(false);
        let errorMsg = "Speech recognition failed.";
        if (err.error === 'not-allowed') {
          errorMsg = "Microphone access blocked. Please allow mic permissions, or open this app in a new tab if running in an iframe.";
        } else if (err.error === 'no-speech') {
          errorMsg = "No speech detected. Please speak closer to your microphone.";
        } else if (err.error === 'audio-capture') {
          errorMsg = "No microphone found. Please connect a microphone.";
        }
        alert(errorMsg);
      };

      recognitionRef.current = rec;
    }
  }, [sourceLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!translatedText) return;
    // Cancel prior speech first
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.rate = speechRate;
    // Map target language to synthesis code if possible
    utterance.lang = targetLang;
    window.speechSynthesis.speak(utterance);
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') {
      // If auto, we use the detected language code or default
      setSourceLang(targetLang);
      setTargetLang('en');
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
    const tempText = inputText;
    setInputText(translatedText);
    setTranslatedText(tempText);
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setDetectedLang('');
    setError('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d0d] pt-16 px-4 pb-6 md:p-6 text-gray-200 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        
        {/* Module Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <Languages className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Live Language Translator</h1>
            <p className="text-xs text-zinc-400">Instantly translate voice or written text in real-time with automatic language detection</p>
          </div>
        </div>

        {/* Translation Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-md bg-[#111111] border border-zinc-800 p-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
            {/* Auto-Detect Language display status */}
            <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-md text-xs text-indigo-350 font-bold select-none text-indigo-300">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Auto-Capture Language Active
            </div>

            <div className="text-zinc-500 text-xs px-1 select-none hidden sm:block">➔</div>

            {/* Target Lang dropdown label */}
            <div className="text-xs text-zinc-400 font-semibold select-none self-center">
              Translate to:
            </div>

            {/* Target Lang dropdown */}
            <select
              id="translator-target-select"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="flex-1 sm:flex-initial rounded-md bg-zinc-900 border border-zinc-800 py-1.5 px-3 text-xs text-zinc-300 outline-none focus:border-indigo-500/50 cursor-pointer min-w-0 font-semibold"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end w-full sm:w-auto shrink-0 border-t border-zinc-800/50 sm:border-t-0 pt-3 sm:pt-0">
            <button
              id="translator-clear-btn"
              onClick={handleClear}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 flex items-start gap-2 animate-fadeIn">
            <Info className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div>
              <span className="font-semibold">Error translating text: </span>
              {error}
            </div>
          </div>
        )}

        {/* Workspace Panels (Input / Output) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Input Text Pane */}
          <div className="relative rounded-md border border-zinc-800 bg-zinc-900 p-5 flex flex-col h-72 shadow-sm">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
              Source Box
            </div>

            <textarea
              id="translator-input-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste text here to translate in real-time..."
              className="mt-6 flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-3">
              <span className="text-[10px] text-zinc-500 font-mono">
                {inputText.length} characters
              </span>

              <div className="flex items-center gap-1">
                <button
                  id="translator-mic-btn"
                  onClick={toggleListening}
                  className={`rounded-md p-2 transition-all ${
                    isListening 
                      ? 'bg-indigo-600 text-white animate-pulse shadow-md shadow-indigo-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Translate Voice Dictation'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Output Text Pane */}
          <div className="relative rounded-md border border-zinc-800 bg-zinc-900 p-5 flex flex-col h-72 shadow-sm">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                Translated Result
              </div>
              {detectedLang && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <span>Detected:</span>
                  <span className="font-semibold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10">
                    {detectedLang}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex-1 overflow-y-auto text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap select-text">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
                  <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  <span className="text-xs font-mono">Analyzing & Translating...</span>
                </div>
              ) : translatedText ? (
                <div className="markdown-body">
                  <Markdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-zinc-100">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                      code: ({ children }) => <code className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-300 border border-zinc-800">{children}</code>
                    }}
                  >
                    {translatedText}
                  </Markdown>
                </div>
              ) : (
                <span className="text-zinc-600 italic">Translation output will appear here as you type...</span>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-zinc-800 pt-3 mt-3 gap-1">
              <button
                id="translator-copy-btn"
                onClick={handleCopy}
                disabled={!translatedText}
                className="rounded-md p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title="Copy Translation"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>

              <button
                id="translator-speech-btn"
                onClick={handleSpeak}
                disabled={!translatedText}
                className="rounded-md p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title="Speak Aloud"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Explainer Panel */}
        <div className="rounded-md border border-zinc-800 bg-[#111111] p-4 flex gap-3">
          <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-400 leading-relaxed">
            <span className="font-bold text-zinc-200">Real-time Conversational Translation: </span>
            This translation module works on the same advanced machine-translation model backing the main chat page. Toggle any of your incoming or outgoing messages in the main AI assistant chat for secondary live-translations as well!
          </div>
        </div>

      </div>
    </div>
  );
}
