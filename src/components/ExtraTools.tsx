import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { 
  Camera, 
  Monitor, 
  Bell, 
  Globe, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Loader2, 
  AlertCircle,
  Video,
  CameraOff
} from 'lucide-react';
import { AlarmItem, NewsItem } from '../types';
import VibraniumBulletin from './VibraniumBulletin';

interface ExtraToolsProps {
  toolType: 'camera' | 'screenshot' | 'alarms' | 'news';
  currentUser: any;
}

export default function ExtraTools({ toolType, currentUser }: ExtraToolsProps) {
  if (toolType === 'news') {
    return <VibraniumBulletin />;
  }
  // Common states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // 1. Camera States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 2. Screenshot States
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [capturedScreenshots, setCapturedScreenshots] = useState<string[]>([]);

  // 3. Alarm States
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [alarmTime, setAlarmTime] = useState('08:00');
  const [alarmLabel, setAlarmLabel] = useState('Morning Standup');

  // 4. News States
  const [newsCategory, setNewsCategory] = useState('all');

  // --- CAMERA CODE ---
  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error(err);
      setCameraError('Permission denied or camera hardware not found. Please verify permissions in index.html / metadata.json.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedPhotos(prev => [dataUrl, ...prev]);
      setSuccess('Photo captured successfully!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  useEffect(() => {
    if (toolType === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [toolType]);

  // --- SCREENSHOT CODE ---
  const triggerScreenshot = () => {
    setScreenshotFlash(true);
    setTimeout(() => setScreenshotFlash(false), 300);

    // Create a beautiful simulation screenshot using canvas gradient
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw background
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#0c0b11');
      grad.addColorStop(0.5, '#2e1065');
      grad.addColorStop(1, '#09080e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Draw metallic grid
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 1280; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 720);
        ctx.stroke();
      }
      for (let j = 0; j < 720; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(1280, j);
        ctx.stroke();
      }

      // Draw branding text
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('Vibranium AI Assistant', 100, 250);

      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Snapshot Captured on: ${new Date().toLocaleString()}`, 100, 310);
      ctx.fillText('Secure Sandbox Environment', 100, 360);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedScreenshots(prev => [dataUrl, ...prev]);
      setSuccess('Screenshot captured successfully!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // --- ALARM DATABASE SYNC ---
  const loadAlarms = async () => {
    if (!currentUser) {
      // Local storage fallback for guests
      const local = localStorage.getItem('vibranium_alarms');
      if (local) setAlarms(JSON.parse(local));
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'users', currentUser.uid, 'alarms'));
      const snapshot = await getDocs(q);
      const list: AlarmItem[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AlarmItem);
      });
      setAlarms(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAlarm = {
      time: alarmTime,
      label: alarmLabel || 'General Alarm',
      isActive: true
    };

    if (currentUser) {
      try {
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'alarms'), newAlarm);
        setAlarms(prev => [...prev, { id: docRef.id, ...newAlarm }]);
      } catch (err) {
        console.error(err);
      }
    } else {
      const id = Date.now().toString();
      const list = [...alarms, { id, ...newAlarm }];
      setAlarms(list);
      localStorage.setItem('vibranium_alarms', JSON.stringify(list));
    }

    setAlarmLabel('');
    setSuccess('Alarm scheduled!');
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleDeleteAlarm = async (id: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'alarms', id));
        setAlarms(prev => prev.filter(al => al.id !== id));
      } catch (err) {
        console.error(err);
      }
    } else {
      const list = alarms.filter(al => al.id !== id);
      setAlarms(list);
      localStorage.setItem('vibranium_alarms', JSON.stringify(list));
    }
  };

  const handleToggleAlarm = async (id: string, active: boolean) => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'alarms', id), { isActive: !active });
        setAlarms(prev => prev.map(al => al.id === id ? { ...al, isActive: !active } : al));
      } catch (err) {
        console.error(err);
      }
    } else {
      const list = alarms.map(al => al.id === id ? { ...al, isActive: !active } : al);
      setAlarms(list);
      localStorage.setItem('vibranium_alarms', JSON.stringify(list));
    }
  };

  useEffect(() => {
    if (toolType === 'alarms') {
      loadAlarms();
    }
  }, [toolType, currentUser]);


  // --- NEWS ITEMS ---
  const MOCK_NEWS: NewsItem[] = [
    {
      id: 'n1',
      title: 'FIFA World Cup Qualifiers: Stunning game play and critical group stage standings',
      summary: 'Football federations announce latest FIFA match results and roster schedules. Teams are executing tight defensive formations, leading to exciting tactical draws and high-scoring matches worldwide.',
      source: 'FIFA Media Centre',
      time: '12 mins ago',
      category: 'sports',
      url: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026'
    },
    {
      id: 'n2',
      title: 'Lewis Hamilton takes dramatic podium at wet Formula 1 Grand Prix',
      summary: 'With unpredictable thunderstorms disrupting tyre strategies, the F1 racing season saw incredible overtakes in the final laps, altering the top driver standings.',
      source: 'Motorsport Network',
      time: '1 hr ago',
      category: 'sports',
      url: 'https://www.formula1.com'
    },
    {
      id: 'n3',
      title: 'India clinches spectacular series win in international T20 cricket finals',
      summary: 'India dominates the international bilateral cricket series with robust top-order hitting and superb death bowling, establishing new global records in T20 match ratings.',
      source: 'CricIntel',
      time: '2 hrs ago',
      category: 'sports',
      url: 'https://www.bcci.tv'
    },
    {
      id: 'n4',
      title: 'India State Elections: Groundbreaking turnout reported as count system goes digital',
      summary: 'State election commissioners introduce fully cryptographic voting receipts and real-time digital dashboards, ensuring high accuracy and secure democratic counting.',
      source: 'National Herald India',
      time: '4 hrs ago',
      category: 'elections',
      url: 'https://results.eci.gov.in'
    },
    {
      id: 'n5',
      title: 'Global Democratic Summits establish unified digital identity security pact',
      summary: 'Dozens of nation representatives finalize a joint treaty to safeguard electoral systems against deepfake generation and malicious coordinate manipulation.',
      source: 'Global Affairs Council',
      time: '5 hrs ago',
      category: 'elections',
      url: 'https://www.un.org'
    },
    {
      id: 'n6',
      title: 'Infrastructure Boom: India coordinates massive green-hydrogen highway network',
      summary: 'With thousands of kilometers of state transport lines getting automated charging setups, India fast-tracks its carbon-neutrality targets ahead of the 2030 timeline.',
      source: 'India Business Daily',
      time: '6 hrs ago',
      category: 'affairs',
      url: 'https://www.india.gov.in'
    },
    {
      id: 'n7',
      title: 'UN Climate Council adopts strict marine conservation benchmarks',
      summary: 'Under global ocean protection mandates, container shipping lines must reduce emissions by 40% and reroute transport channels to safeguard coral reefs.',
      source: 'UN Environment News',
      time: '8 hrs ago',
      category: 'affairs',
      url: 'https://www.unep.org'
    },
    {
      id: 'n8',
      title: 'Vibranium AI establishes new record in real-time localized weather telemetry',
      summary: 'Debraj Pal announces the rollout of the Vibranium AI framework, allowing clients to gain instant browser location authorization and query open weather arrays.',
      source: 'Developer Chronicle',
      time: '30 mins ago',
      category: 'tech',
      url: 'https://github.com'
    },
    {
      id: 'n9',
      title: 'Foundational Multimodal LLMs execute fully offline inside client brower engines',
      summary: 'With extreme quantization parameters, 7B parameter models achieve incredible generation velocities inside standard web sandboxes without hitting cloud APIs.',
      source: 'AI Progress Watch',
      time: '3 hrs ago',
      category: 'tech',
      url: 'https://huggingface.co'
    },
    {
      id: 'n10',
      title: 'Quantum Computing Grid achieves 256 stable qubits at room temperature',
      summary: 'Researchers utilize specialized diamond-nitrogen vacancies to stabilize quantum computational coherence, introducing highly secure, unbreakable cryptography standards.',
      source: 'Scientific American Advancements',
      time: '7 hrs ago',
      category: 'science',
      url: 'https://www.scientificamerican.com'
    },
    {
      id: 'n11',
      title: 'Deep Space Telescope detects heavy atmospheric water vapor on nearby exoplanet',
      summary: 'Orbiting a stable red dwarf star, the Earth-like exoplanet reveals a carbon dioxide and water-rich atmosphere, raising high anticipation for organic trace analysis.',
      source: 'Astronomy Journal Research',
      time: '9 hrs ago',
      category: 'science',
      url: 'https://www.nasa.gov'
    },
    {
      id: 'n12',
      title: 'National Education Council mandates ethical AI and cybersecurity curricula',
      summary: 'Beginning this semester, secondary schools and colleges will incorporate hand-on coding with neural models and security sandbox principles into core coursework.',
      source: 'Academia Chronicle',
      time: '10 hrs ago',
      category: 'education',
      url: 'https://www.education.gov.in'
    },
    {
      id: 'n13',
      title: 'Top technical universities receive multi-billion research grant for clean energy',
      summary: 'Universities and research colleges partner with industrial leaders to build advanced sodium-ion battery grids and sustainable hydrogen power grids.',
      source: 'EduResearch Gazette',
      time: '12 hrs ago',
      category: 'education',
      url: 'https://www.nature.com'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d0d] pt-16 px-4 pb-6 md:p-6 text-gray-200 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl space-y-6">

        {/* --- CAMERA COMPONENT --- */}
        {toolType === 'camera' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Camera className="h-6 w-6 text-indigo-400 animate-pulse" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Camera Feed Simulator</h1>
                <p className="text-xs text-zinc-400">Stream your actual webcam directly into the browser and capture snap logs</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Camera Stream viewport */}
              <div className="relative rounded-md border border-zinc-800 bg-black overflow-hidden flex flex-col items-center justify-center md:col-span-2 h-96">
                {stream ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-500 p-8 text-center">
                    <CameraOff className="h-10 w-10 text-indigo-500/50" />
                    <span className="text-sm font-semibold text-white">Webcam stream inactive</span>
                    {cameraError ? (
                      <p className="text-xs text-rose-400 mt-2 max-w-xs">{cameraError}</p>
                    ) : (
                      <button 
                        id="camera-start-feed-btn"
                        onClick={startCamera}
                        className="mt-3 rounded-md bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
                      >
                        Start Video Feed
                      </button>
                    )}
                  </div>
                )}

                {stream && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <button
                      id="camera-snap-btn"
                      onClick={capturePhoto}
                      className="rounded-md bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-102 active:scale-95"
                    >
                      Capture Photo
                    </button>
                    <button
                      id="camera-stop-feed-btn"
                      onClick={stopCamera}
                      className="rounded-md bg-black/50 hover:bg-black/80 border border-zinc-800 px-4 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      Close Stream
                    </button>
                  </div>
                )}
              </div>

              {/* Saved Photos Reel */}
              <div className="rounded-md border border-zinc-800 bg-[#111111] p-5 flex flex-col h-96 overflow-y-auto">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Captured Reels</h3>
                {capturedPhotos.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-600 italic">
                    Photos captured during session will log here
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {capturedPhotos.map((p, idx) => (
                      <div key={idx} className="relative rounded-md overflow-hidden border border-zinc-800 group aspect-video">
                        <img src={p} alt="Snap log" className="w-full h-full object-cover scale-x-[-1]" />
                        <a 
                          href={p} 
                          download={`vibranium-snap-${idx}.jpg`}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- SCREENSHOT COMPONENT --- */}
        {toolType === 'screenshot' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Monitor className="h-6 w-6 text-indigo-400" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">System Screen Logger</h1>
                <p className="text-xs text-zinc-400">Capture visual telemetry snapshots of the Vibranium AI workbench layout</p>
              </div>
            </div>

            {/* Flash Effect overlay */}
            {screenshotFlash && (
              <div className="fixed inset-0 bg-white z-50 animate-flash pointer-events-none"></div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              {/* Snapshot Viewfinder */}
              <div className="relative rounded-md border border-dashed border-zinc-700 bg-[#111111] overflow-hidden flex flex-col items-center justify-center md:col-span-2 h-96 p-6 text-center">
                <Monitor className="h-12 w-12 text-indigo-500/20 mb-4 animate-bounce" />
                <h3 className="text-sm font-semibold text-white">Layout Telemetry Ready</h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Click below to synthesize a gorgeous metadata screenshot of your current canvas, displaying render stamps and telemetry logs.
                </p>
                <button
                  id="screenshot-capture-action-btn"
                  onClick={triggerScreenshot}
                  className="mt-6 rounded-md bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-102 active:scale-95"
                >
                  Generate Screen Stamp
                </button>
              </div>

              {/* Snapshots reel */}
              <div className="rounded-md border border-zinc-800 bg-[#111111] p-5 flex flex-col h-96 overflow-y-auto">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Snap Logs</h3>
                {capturedScreenshots.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-600 italic">
                    Screenshots captured will appear in this log
                  </div>
                ) : (
                  <div className="space-y-3">
                    {capturedScreenshots.map((p, idx) => (
                      <div key={idx} className="rounded-md overflow-hidden border border-zinc-800 bg-[#09080e] p-2 space-y-1">
                        <img src={p} alt="Snap log" className="rounded-md w-full object-cover" />
                        <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-zinc-500">
                          <span>Log #{capturedScreenshots.length - idx}</span>
                          <a href={p} download={`vibranium-screen-${idx}.jpg`} className="text-indigo-400 font-bold hover:underline">Download</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ALARMS COMPONENT --- */}
        {toolType === 'alarms' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Bell className="h-6 w-6 text-indigo-400" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Vibranium Alarms & Routines</h1>
                <p className="text-xs text-zinc-400">Schedule custom developer alarms and sync them with your cloud account</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Add alarm pane */}
              <div className="rounded-md border border-zinc-800 bg-[#111111] p-5 h-fit space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Schedule Routine</h3>
                <form onSubmit={handleAddAlarm} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Alarm Time</label>
                    <input
                      id="alarm-time-input"
                      type="time"
                      required
                      value={alarmTime}
                      onChange={(e) => setAlarmTime(e.target.value)}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2.5 px-4 text-md text-white text-center outline-none focus:border-indigo-500/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Label / Name</label>
                    <input
                      id="alarm-label-input"
                      type="text"
                      required
                      value={alarmLabel}
                      onChange={(e) => setAlarmLabel(e.target.value)}
                      placeholder="e.g. Daily Standup"
                      className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2.5 px-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <button
                    id="alarm-submit-btn"
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-bold text-white transition-all shadow-md hover:scale-[1.01] active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Set Routine
                  </button>
                </form>
              </div>

              {/* Alarms lists */}
              <div className="rounded-md border border-zinc-800 bg-[#111111] p-5 md:col-span-2 flex flex-col h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Scheduled Actions</h3>
                  {!currentUser && (
                    <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                      Local Mode
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="flex-1 flex items-center justify-center gap-2 text-zinc-500">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                    <span className="text-xs">Fetching Sync Routines...</span>
                  </div>
                ) : alarms.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-600 italic">
                    No active routines. Set an alarm using the creator!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alarms.map((al) => (
                      <div 
                        key={al.id} 
                        className={`flex items-center justify-between rounded-md border p-4 transition-all ${
                          al.isActive 
                            ? 'border-indigo-500/25 bg-indigo-500/5 shadow-md shadow-indigo-500/5' 
                            : 'border-zinc-800 bg-zinc-900/50 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Bell className={`h-5 w-5 ${al.isActive ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`} />
                          <div>
                            <span className="text-lg font-bold text-white font-mono">{al.time}</span>
                            <span className="text-xs text-zinc-400 block mt-0.5">{al.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Toggle active switch */}
                          <button
                            id={`alarm-toggle-btn-${al.id}`}
                            onClick={() => handleToggleAlarm(al.id, al.isActive)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
                              al.isActive ? 'bg-indigo-600' : 'bg-zinc-750'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                al.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Delete alarm */}
                          <button
                            id={`alarm-delete-btn-${al.id}`}
                            onClick={() => handleDeleteAlarm(al.id)}
                            className="rounded-md p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success toast notification */}
        {success && (
          <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-xs text-emerald-400 flex items-center gap-2 animate-fadeIn shadow-lg shadow-emerald-500/5">
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="font-bold">{success}</span>
          </div>
        )}

      </div>
    </div>
  );
}
