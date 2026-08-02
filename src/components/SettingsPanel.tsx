import React from 'react';
import { UserSettings } from '../types';
import { 
  Settings, 
  Eye, 
  Tv, 
  Volume2, 
  Cpu, 
  Check, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  currentUser: any;
  onOpenAuth: () => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  currentUser,
  onOpenAuth
}: SettingsPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0d0d] pt-16 px-4 pb-6 md:p-6 text-gray-200">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Module Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <Settings className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Providers</h1>
            <p className="text-xs text-zinc-400">Configure accessibility preferences, AI language models, and user sync</p>
          </div>
        </div>

        {/* User Account / Sync Panel */}
        <div className="rounded-md border border-zinc-800 bg-[#111111] p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Vibranium Secure Sync
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {currentUser 
                  ? `Logged in as: ${currentUser.email}. Your configuration is synchronized.`
                  : 'Log in to securely back up your configuration settings and chat history.'
                }
              </p>
            </div>
            <button
              id="settings-auth-action-btn"
              onClick={onOpenAuth}
              className="rounded-md bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              {currentUser ? 'Manage Account' : 'Connect Account'}
            </button>
          </div>
        </div>

        {/* AI Engine & Providers Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              AI TEXT, VISION & IMAGE GENERATION ENGINE HUB
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
              12+ Providers Active
            </span>
          </div>
          
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Vibranium Unified Multi-Model Gateway
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
                Server-Side Zero-Exposure Security
              </span>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed">
              Vibranium AI orchestrates real-time requests across elite frontier intelligence networks: <span className="text-indigo-300 font-semibold">Google Gemini 3.6 Flash</span>, <span className="text-indigo-300 font-semibold">Anthropic Claude 3.5 Sonnet & Opus</span>, <span className="text-indigo-300 font-semibold">xAI Grok 3</span>, <span className="text-indigo-300 font-semibold">NVIDIA Nemotron 70B</span>, <span className="text-indigo-300 font-semibold">Perplexity Sonar Pro / Reasoning Vision</span>, <span className="text-indigo-300 font-semibold">Google Gemma 4</span>, <span className="text-indigo-300 font-semibold">Meta Llama 3.3</span>, <span className="text-indigo-300 font-semibold">Kimi K3</span>, and <span className="text-indigo-300 font-semibold">Zhipu GLM 5.2</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Document & Office Parser
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Universal text & tables extraction for PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, and text files across all models.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  Image Generation Engine
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Powered by <span className="text-amber-300 font-semibold">Google Gemini Nano Banana (Imagen 3)</span> for 1080p, 1K, 2K, and 4K photorealistic art generation.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  Sonar Pro Vision & OCR
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Deep visual reasoning, OCR document reading, and search grounding powered by Perplexity Sonar Pro & Gemini Vision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Preference Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Tv className="h-4 w-4" />
              THEME
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-semibold">
              Current: {settings.theme === 'light' ? 'Light Mode' : settings.theme === 'amoled' ? 'Deep Onyx' : 'Dark Mode'}
            </span>
          </div>

          <p className="text-xs text-zinc-400 -mt-1">
            Toggle the entire web application interface between Light Mode and Dark Mode aesthetics.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Light Mode Option */}
            <label id="theme-option-light" className={`relative flex flex-col justify-between p-4 rounded-lg border cursor-pointer transition-all ${
              settings.theme === 'light' 
                ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40 shadow-lg' 
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === 'light'}
                onChange={() => onUpdateSettings({ theme: 'light' })}
                className="sr-only"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sun className="h-4 w-4 text-amber-400" />
                    Light Mode
                  </span>
                  {settings.theme === 'light' && <Check className="h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Clean, high-contrast bright canvas with crisp dark typography for daylight readability.
                </p>
              </div>
            </label>

            {/* Dark Metallic Option */}
            <label id="theme-option-dark" className={`relative flex flex-col justify-between p-4 rounded-lg border cursor-pointer transition-all ${
              settings.theme === 'dark' 
                ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40 shadow-lg' 
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={() => onUpdateSettings({ theme: 'dark' })}
                className="sr-only"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    Dark Mode
                  </span>
                  {settings.theme === 'dark' && <Check className="h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Deep midnight slate with clean indigo accents and low-eyestrain dark palette.
                </p>
              </div>
            </label>

            {/* Deep Onyx (AMOLED) Option */}
            <label id="theme-option-amoled" className={`relative flex flex-col justify-between p-4 rounded-lg border cursor-pointer transition-all ${
              settings.theme === 'amoled' 
                ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40 shadow-lg' 
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}>
              <input
                type="radio"
                name="theme"
                value="amoled"
                checked={settings.theme === 'amoled'}
                onChange={() => onUpdateSettings({ theme: 'amoled' })}
                className="sr-only"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Deep Onyx (AMOLED)
                  </span>
                  {settings.theme === 'amoled' && <Check className="h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Pure pitch-black theme optimized for high-efficiency OLED displays.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Accessibility Panel */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Accessibility & Accommodations
          </h2>

          <div className="rounded-md border border-zinc-800 bg-[#111111] p-5 space-y-6">
            {/* Text Zoom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Text Font-Size Zoom</span>
                <span className="text-xs text-indigo-400 font-mono capitalize">{settings.accessibility.fontSize}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                  <button
                    key={sz}
                    id={`settings-font-btn-${sz}`}
                    onClick={() => onUpdateSettings({ 
                      accessibility: { ...settings.accessibility, fontSize: sz } 
                    })}
                    className={`rounded-md py-2 text-xs font-medium border transition-all ${
                      settings.accessibility.fontSize === sz 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-md' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {sz === 'sm' && 'Small (14px)'}
                    {sz === 'md' && 'Medium (16px)'}
                    {sz === 'lg' && 'Large (18px)'}
                    {sz === 'xl' && 'Extra Large (20px)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Reader TTS Toggle */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <div>
                <span className="text-xs font-semibold text-white block">Vibranium Text-To-Speech Reader</span>
                <span className="text-[10px] text-zinc-400 leading-relaxed">
                  Automatically read back assistant responses aloud using advanced browser speech synthesis engines.
                </span>
              </div>
              <button
                id="settings-tts-toggle-btn"
                onClick={() => onUpdateSettings({ 
                  accessibility: { ...settings.accessibility, screenReader: !settings.accessibility.screenReader } 
                })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
                  settings.accessibility.screenReader ? 'bg-indigo-600' : 'bg-zinc-750'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    settings.accessibility.screenReader ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Voice Speed */}
            {settings.accessibility.screenReader && (
              <div className="space-y-2 border-t border-zinc-800 pt-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5" />
                    Speech Playback Speed Modifier
                  </span>
                  <span className="text-xs text-indigo-400 font-mono font-bold">{settings.accessibility.speechRate}x</span>
                </div>
                <input
                  id="settings-tts-speed-slider"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.accessibility.speechRate}
                  onChange={(e) => onUpdateSettings({ 
                    accessibility: { ...settings.accessibility, speechRate: Number(e.target.value) } 
                  })}
                  className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Fast)</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
