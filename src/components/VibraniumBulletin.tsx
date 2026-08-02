import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  RefreshCw,
  Clock,
  ExternalLink,
  Share2,
  Heart,
  TrendingUp,
  TrendingDown,
  Sun,
  Cloud,
  CloudRain,
  Radio,
  Sparkles,
  ChevronRight,
  Newspaper,
  Check,
  ShieldCheck,
  MapPin,
  Navigation,
  LocateFixed,
  Building2
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  keyTakeaways?: string[];
  source: string;
  sourceUrl?: string;
  time: string;
  category: string;
  imageUrl?: string;
  sourcesCount?: number;
  isHero?: boolean;
}

interface MarketItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  percentChange: string;
  isUp: boolean;
  sparkline: number[];
}

interface TrendingCompany {
  name: string;
  symbol: string;
  price: string;
  percentChange: string;
  isUp: boolean;
}

const getFallbackPhoto = (category?: string, title?: string): string => {
  const text = `${title || ''} ${category || ''}`.toLowerCase();
  if (text.includes('quantum') || text.includes('computing') || text.includes('tech') || text.includes('ai ') || text.includes('chip') || text.includes('nvidia') || text.includes('apple') || text.includes('qutwo') || text.includes('software')) {
    return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80';
  }
  if (text.includes('market') || text.includes('stock') || text.includes('sensex') || text.includes('nifty') || text.includes('finance') || text.includes('economy') || text.includes('bank') || text.includes('rupee') || text.includes('trade')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';
  }
  if (text.includes('sports') || text.includes('cricket') || text.includes('match') || text.includes('football') || text.includes('ipl')) {
    return 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80';
  }
  if (text.includes('defence') || text.includes('kargil') || text.includes('army') || text.includes('war') || text.includes('military')) {
    return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80';
  }
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
};

interface ForecastItem {
  day: string;
  temp: string;
  icon: string;
}

interface WeatherData {
  city: string;
  temp: string;
  condition: string;
  high: string;
  low: string;
  forecast: ForecastItem[];
}

interface BulletinData {
  heroStory?: NewsArticle;
  news: NewsArticle[];
  markets: MarketItem[];
  trendingCompanies?: TrendingCompany[];
  weather: WeatherData;
  lastUpdated?: string;
}

export default function VibraniumBulletin() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BulletinData | null>(null);
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);

  // Weather & Location state
  const [userCity, setUserCity] = useState<string>('Kolkata');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  const fetchNewsData = async (
    category: string,
    isRefresh: boolean = false,
    cityOverride?: string,
    latOverride?: number,
    lonOverride?: number
  ) => {
    setLoading(true);
    try {
      const targetCity = cityOverride !== undefined ? cityOverride : userCity;
      const targetLat = latOverride !== undefined ? latOverride : userCoords?.lat;
      const targetLon = lonOverride !== undefined ? lonOverride : userCoords?.lon;

      let url = `/api/news?category=${category}&city=${encodeURIComponent(targetCity)}`;
      if (targetLat !== undefined && targetLon !== undefined) {
        url += `&lat=${targetLat}&lon=${targetLon}`;
      }
      if (isRefresh) {
        url += `&refresh=true`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error('Failed to fetch news from server API');
      }
    } catch (err) {
      console.error('Error fetching live news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationToast('Geolocation is not supported by your browser.');
      setTimeout(() => setLocationToast(null), 3000);
      return;
    }
    setIsLocating(true);
    setLocationToast('Requesting location access for live weather...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let detectedCity = 'My Location';
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.state || 'My Location';
          }
        } catch (geoErr) {
          console.warn('Reverse geocoding failed:', geoErr);
        }

        setUserCity(detectedCity);
        setUserCoords({ lat, lon });
        setIsLocating(false);
        setLocationToast(`Live weather loaded for ${detectedCity}`);
        setTimeout(() => setLocationToast(null), 3000);
        fetchNewsData(activeCategory, true, detectedCity, lat, lon);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsLocating(false);
        setLocationToast('Location access denied. You can search any city manually!');
        setTimeout(() => setLocationToast(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleCitySearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    const newCity = cityInput.trim();
    setUserCity(newCity);
    setUserCoords(null);
    setIsSearchOpen(false);
    setCityInput('');
    fetchNewsData(activeCategory, true, newCity);
  };

  const handleQuickCityClick = (cityName: string) => {
    setUserCity(cityName);
    setUserCoords(null);
    setIsSearchOpen(false);
    fetchNewsData(activeCategory, true, cityName);
  };

  useEffect(() => {
    fetchNewsData(activeCategory);
  }, [activeCategory]);

  const toggleLike = (id: string) => {
    setLikedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const shareArticle = (title: string, url?: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url || window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const renderSparkline = (points: number[], isUp: boolean) => {
    if (!points || points.length === 0) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const pathData = points
      .map((pt, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((pt - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isUp ? '#10b981' : '#ef4444';

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const categories = [
    { id: 'all', label: 'For You' },
    { id: 'india', label: 'India' },
    { id: 'global', label: 'Global' },
    { id: 'sports', label: 'Sports' },
    { id: 'affairs', label: 'Current Affairs' },
    { id: 'markets', label: 'Markets & Economy' },
    { id: 'tech', label: 'Tech & AI' },
    { id: 'science', label: 'Science' },
  ];

  // Filter news articles by search query
  const hero = data?.heroStory;
  const filteredArticles = (data?.news || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f10] text-zinc-100 min-h-screen overflow-y-auto pt-16 md:pt-4 px-3 sm:px-6 pb-12">
      {/* Top Bar Header */}
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Newspaper className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                  Vibranium Bulletin
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Real-time global news intelligence, sports coverage & market outlook
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input Bar with Indigo Glow */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search real-time news..."
                className="w-full bg-[#1b1c1e] border border-zinc-700/60 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.35)] focus:ring-1 focus:ring-indigo-400/50 transition-all"
              />
            </div>

            {/* Live Refresh Button */}
            <button
              onClick={() => fetchNewsData(activeCategory, true)}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-[#1e1f21] hover:bg-[#282a2d] border border-zinc-700/70 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition-all hover:text-white shadow-sm disabled:opacity-50 shrink-0"
              title="Force re-indexing real-time web search"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{loading ? 'Syncing RAG...' : 'Live Sync'}</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800/60">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-md shadow-white/5'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Hero Article & Articles Feed (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Featured Hero Article */}
            {hero && !searchQuery && (
              <div className="group relative rounded-2xl border border-zinc-800 bg-[#161719] overflow-hidden shadow-xl transition-all hover:border-zinc-700">
                <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={hero.imageUrl || getFallbackPhoto(hero.category, hero.title)}
                    alt={hero.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.src = getFallbackPhoto(hero.category, hero.title);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161719] via-[#161719]/50 to-transparent pointer-events-none" />

                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600/90 text-white backdrop-blur-md shadow-lg border border-indigo-400/30">
                      Featured Breaking
                    </span>
                    {hero.sourcesCount && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/70 text-zinc-200 backdrop-blur-md border border-white/10">
                        {hero.sourcesCount} sources
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-3 relative z-10">
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="font-semibold text-indigo-400">{hero.source}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      {hero.time}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug group-hover:text-indigo-200 transition-colors">
                    {hero.sourceUrl ? (
                      <a
                        href={hero.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {hero.title}
                      </a>
                    ) : (
                      hero.title
                    )}
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                    {hero.summary}
                  </p>

                  {/* Perplexity AI Key Takeaways Box */}
                  {hero.keyTakeaways && hero.keyTakeaways.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span>AI Executive Takeaways</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {hero.keyTakeaways.map((point: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold mt-0.5">&bull;</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hero.sourceUrl && (
                        <a
                          href={hero.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
                        >
                          Read full coverage
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLike(hero.id)}
                        className={`p-2 rounded-full border transition-colors ${
                          likedArticles[hero.id]
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white'
                        }`}
                        title="Bookmark article"
                      >
                        <Heart className={`h-4 w-4 ${likedArticles[hero.id] ? 'fill-rose-500' : ''}`} />
                      </button>

                      <button
                        onClick={() => shareArticle(hero.title, hero.sourceUrl)}
                        className="p-2 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
                        title="Share link"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Feed Cards List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {searchQuery ? `Search results for "${searchQuery}"` : 'Latest News Updates'}
                </h3>
                <span className="text-[11px] text-zinc-500">
                  {filteredArticles.length} stories reported
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="rounded-xl border border-zinc-800 bg-[#161719] p-5 space-y-3 animate-pulse"
                    >
                      <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                      <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
                      <div className="h-12 bg-zinc-800/60 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-[#161719] p-8 text-center space-y-2">
                  <Globe className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400 font-semibold">No news items matched your filter</p>
                  <p className="text-xs text-zinc-500">Try searching for a different keyword or category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-[#161719] hover:bg-[#1c1d20] overflow-hidden transition-all hover:border-zinc-700/80 shadow-md"
                    >
                      <div className="relative h-44 w-full bg-zinc-900 overflow-hidden shrink-0">
                        <img
                          src={item.imageUrl || getFallbackPhoto(item.category, item.title)}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.src = getFallbackPhoto(item.category, item.title);
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161719] via-transparent to-transparent opacity-80 pointer-events-none" />
                        <span className="absolute bottom-2 left-3 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-indigo-500/20">
                          {item.category}
                        </span>
                      </div>

                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="font-semibold text-indigo-400">{item.source}</span>
                            <span className="text-zinc-500">{item.time}</span>
                          </div>

                          <h4 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
                            {item.sourceUrl ? (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {item.title}
                              </a>
                            ) : (
                              item.title
                            )}
                          </h4>

                          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                            {item.summary}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {item.sourcesCount ? `${item.sourcesCount} sources` : 'Verified Source'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleLike(item.id)}
                              className={`text-zinc-500 hover:text-rose-400 transition-colors ${
                                likedArticles[item.id] ? 'text-rose-500' : ''
                              }`}
                              title="Bookmark"
                            >
                              <Heart className={`h-3.5 w-3.5 ${likedArticles[item.id] ? 'fill-rose-500' : ''}`} />
                            </button>
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 hover:text-white transition-colors"
                                title="Open Source"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Weather & Market Outlook Widgets (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Weather Widget */}
            {data?.weather && (
              <div className="rounded-2xl border border-zinc-800 bg-[#161719] p-4 sm:p-5 space-y-3.5 shadow-xl relative overflow-hidden">
                {/* Location Toast Notification */}
                {locationToast && (
                  <div className="bg-indigo-600/90 text-white text-xs px-3 py-1.5 rounded-lg flex items-center justify-between animate-fade-in font-medium">
                    <span>{locationToast}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <CloudRain className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Live Weather</h4>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          LIVE
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400 inline" />
                        {data.weather.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Detect Geolocation Button */}
                    <button
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      title="Detect current location for live weather"
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600 hover:text-white text-zinc-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                    >
                      <LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-spin text-indigo-400' : ''}`} />
                    </button>

                    {/* Toggle City Search Input */}
                    <button
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      title="Search city weather (e.g., Mumbai, Chennai, Delhi)"
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600 hover:text-white text-zinc-400 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Search className="h-4 w-4" />
                    </button>

                    <div className="text-right pl-1 border-l border-zinc-800/80">
                      <span className="text-2xl font-bold text-white font-mono">{data.weather.temp}</span>
                      <span className="text-[11px] text-zinc-400 block font-medium">{data.weather.condition}</span>
                    </div>
                  </div>
                </div>

                {/* City Search Form */}
                {isSearchOpen && (
                  <form onSubmit={handleCitySearchSubmit} className="space-y-2 pt-1 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                        <input
                          type="text"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          placeholder="Enter city (e.g., Mumbai, Chennai, Delhi)..."
                          className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        Search
                      </button>
                    </div>
                  </form>
                )}

                {/* Quick Popular Cities Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  <span className="text-zinc-500 text-[10px] uppercase font-semibold shrink-0">Quick:</span>
                  {[
                    { label: 'Mumbai (Bombay)', name: 'Mumbai' },
                    { label: 'Chennai', name: 'Chennai' },
                    { label: 'Kolkata', name: 'Kolkata' },
                    { label: 'Delhi', name: 'Delhi' },
                    { label: 'Bengaluru', name: 'Bengaluru' }
                  ].map((cityObj) => (
                    <button
                      key={cityObj.name}
                      onClick={() => handleQuickCityClick(cityObj.name)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                        userCity.toLowerCase().includes(cityObj.name.toLowerCase())
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {cityObj.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
                  <span>High: <strong className="text-white">{data.weather.high}</strong></span>
                  <span>Low: <strong className="text-white">{data.weather.low}</strong></span>
                  <span className="text-[10px] text-zinc-500">7-Day Live Forecast</span>
                </div>

                {/* 7-day Live Forecast (Sunday to Saturday / Next 7 days) */}
                <div className="grid grid-cols-7 gap-1 pt-1">
                  {data.weather.forecast.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center p-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60 text-center hover:border-indigo-500/40 transition-all"
                    >
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{f.day}</span>
                      {f.icon === 'sun' ? (
                        <Sun className="h-4 w-4 text-amber-400 my-1 shrink-0" />
                      ) : f.icon === 'rain' ? (
                        <CloudRain className="h-4 w-4 text-sky-400 my-1 shrink-0" />
                      ) : (
                        <Cloud className="h-4 w-4 text-zinc-400 my-1 shrink-0" />
                      )}
                      <span className="text-[10px] font-bold text-white font-mono">{f.temp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-Time Market Outlook Panel */}
            <div className="rounded-2xl border border-zinc-800 bg-[#161719] p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Market Outlook</h4>
                    <p className="text-[11px] text-zinc-500">Live Global & Indian Indices</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>

              {/* Tickers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {(data?.markets || []).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{m.symbol}</span>
                        <span className="text-[10px] text-zinc-500">({m.name})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-white font-mono">{m.price}</span>
                        <span
                          className={`text-[11px] font-bold font-mono px-1.5 py-0.2 rounded ${
                            m.isUp
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {m.percentChange}
                        </span>
                      </div>
                    </div>

                    {renderSparkline(m.sparkline, m.isUp)}
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Stocks & Movers */}
            {data?.trendingCompanies && (
              <div className="rounded-2xl border border-zinc-800 bg-[#161719] p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Trending Companies
                  </h4>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                </div>

                <div className="space-y-2">
                  {data.trendingCompanies.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-none text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{c.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{c.symbol}</span>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-white block font-semibold">{c.price}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            c.isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {c.percentChange}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy notification toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-3.5 text-xs text-indigo-300 flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Article link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}
