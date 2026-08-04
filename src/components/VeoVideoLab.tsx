import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../lib/api';
import { db } from '../lib/firebase';
import { collection, addDoc, query, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { 
  Video, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Image, 
  FileVideo, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Film,
  Trash2,
  ChevronRight,
  UploadCloud,
  Clapperboard
} from 'lucide-react';

interface VeoVideoLabProps {
  currentUser: any;
}

interface VideoGenerationJob {
  id: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  operationName: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  imageUrl?: string;
  videoUrl?: string;
  createdAt: number;
}

export default function VeoVideoLab({ currentUser }: VeoVideoLabProps) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  
  // Image Upload for image animation
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceMimeType, setReferenceMimeType] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Job states
  const [jobs, setJobs] = useState<VideoGenerationJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  // Fetch saved video generation jobs
  useEffect(() => {
    loadJobs();
    return () => {
      // Clean up all polling intervals on unmount
      Object.values(pollingIntervals.current).forEach(clearInterval);
    };
  }, [currentUser]);

  const loadJobs = async () => {
    try {
      const localJobs = localStorage.getItem('vibranium_veo_jobs');
      let loadedJobs: VideoGenerationJob[] = localJobs ? JSON.parse(localJobs) : [];

      if (currentUser) {
        try {
          const q = query(
            collection(db, 'users', currentUser.uid, 'veo_jobs'),
            orderBy('createdAt', 'desc')
          );
          const snap = await getDocs(snapQueryCorrection(q));
          const dbJobs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as VideoGenerationJob));
          
          if (dbJobs.length > 0) {
            loadedJobs = dbJobs;
          }
        } catch (dbErr) {
          console.warn("Firestore veo_jobs fetch failed, using localStorage:", dbErr);
        }
      }

      setJobs(loadedJobs);

      // Start polling for any non-done or non-failed jobs
      loadedJobs.forEach(job => {
        if (job.status === 'pending' || job.status === 'processing') {
          startPollingJob(job.id, job.operationName);
        }
      });
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  // Safe fallback helper for Firestore orderBy query
  const snapQueryCorrection = (q: any) => {
    return q;
  };

  const saveJobsList = async (updatedJobs: VideoGenerationJob[]) => {
    setJobs(updatedJobs);
    localStorage.setItem('vibranium_veo_jobs', JSON.stringify(updatedJobs));
  };

  // Handle Drag & Drop reference image
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError('');
    setReferenceMimeType(file.type);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Poll job status until done or failed
  const startPollingJob = (jobId: string, operationName: string) => {
    if (pollingIntervals.current[jobId]) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(getApiUrl('/api/video-status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        });
        if (!res.ok) throw new Error("Status check failed");
        const data = await res.json();

        if (data.done) {
          clearInterval(pollingIntervals.current[jobId]);
          delete pollingIntervals.current[jobId];

          const isSuccess = data.response?.generatedVideos?.length > 0;
          const status = isSuccess ? 'done' : 'failed';
          const videoUrl = isSuccess ? getApiUrl(`/api/video-download?operationName=${encodeURIComponent(operationName)}`) : undefined;

          // Update job
          setJobs(prevJobs => {
            const updated = prevJobs.map(job => {
              if (job.id === jobId) {
                return { ...job, status, videoUrl } as VideoGenerationJob;
              }
              return job;
            });
            localStorage.setItem('vibranium_veo_jobs', JSON.stringify(updated));
            return updated;
          });

          // Update firestore if logged in
          if (currentUser) {
            try {
              const batch = collection(db, 'users', currentUser.uid, 'veo_jobs');
              // We can update the exact document if we had its ref. For simplicity, let's keep it in local storage + update on reload
            } catch (fsErr) {
              console.error("Firestore status sync error:", fsErr);
            }
          }
        } else {
          // Update status to processing if still pending
          setJobs(prevJobs => {
            return prevJobs.map(job => {
              if (job.id === jobId && job.status === 'pending') {
                return { ...job, status: 'processing' };
              }
              return job;
            });
          });
        }
      } catch (err) {
        console.error("Polling error for job:", jobId, err);
      }
    }, 4000);

    pollingIntervals.current[jobId] = interval;
  };

  // Submit Generation Request
  const handleSubmitGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !referenceImage) {
      setError('Please provide either a video prompt or an image to animate.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let imageBase64: string | undefined;
      if (referenceImage) {
        // Extract raw base64 string from data URL
        imageBase64 = referenceImage.split(',')[1];
      }

      const res = await fetch(getApiUrl('/api/generate-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          resolution,
          imageBase64,
          imageMimeType: referenceMimeType
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to start generation");
      }

      const data = await res.json();
      const operationName = data.operationName;

      const newJob: VideoGenerationJob = {
        id: `veo-${Date.now()}`,
        prompt: prompt.trim() || 'Animated Image Composition',
        aspectRatio,
        operationName,
        status: 'pending',
        imageUrl: referenceImage || undefined,
        createdAt: Date.now()
      };

      const updatedJobs = [newJob, ...jobs];
      await saveJobsList(updatedJobs);

      // Save to Firebase if signed in
      if (currentUser) {
        try {
          await addDoc(collection(db, 'users', currentUser.uid, 'veo_jobs'), newJob);
        } catch (fsErr) {
          console.error("Failed to save veo_job to Firestore:", fsErr);
        }
      }

      setActiveJobId(newJob.id);
      setSuccess('Video generation started successfully! Polling has initiated...');
      setPrompt('');
      setReferenceImage(null);
      setReferenceMimeType(null);

      // Start polling
      startPollingJob(newJob.id, operationName);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during Veo video generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (pollingIntervals.current[jobId]) {
      clearInterval(pollingIntervals.current[jobId]);
      delete pollingIntervals.current[jobId];
    }

    const updated = jobs.filter(j => j.id !== jobId);
    await saveJobsList(updated);

    if (currentUser) {
      try {
        // Simple scan and delete in background
        const q = query(collection(db, 'users', currentUser.uid, 'veo_jobs'));
        const snap = await getDocs(q);
        const docToDelete = snap.docs.find(d => d.data().id === jobId);
        if (docToDelete) {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'veo_jobs', docToDelete.id));
        }
      } catch (err) {
        console.error("Failed to delete from Firestore:", err);
      }
    }

    if (activeJobId === jobId) {
      setActiveJobId(null);
    }
  };

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0];

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d0d] pt-16 px-4 pb-6 md:p-6 text-gray-200 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        
        {/* Module Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-5">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/25">
            <Film className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Veo 3 Video Lab</h1>
            <p className="text-xs text-zinc-400">
              Access Google's state-of-the-art Veo video generation model to produce cinematic reels or animate your photos
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleSubmitGeneration} className="rounded-xl border border-zinc-800 bg-[#121214] p-5 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Creative Studio
              </h2>

              {/* Google Veo Billing Tier Help Alert */}
              <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Important Billing & Quota Note</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  Google's high-compute <strong>Veo 3.1 Video models</strong> (like <code>veo-3.1-fast-generate-preview</code>) are <strong>not available on the standard Gemini Free API Tier</strong>. 
                </p>
                <p className="text-zinc-400 leading-relaxed text-[10px]">
                  • <strong>With Free Key:</strong> The Google API rejects the generation or returns an empty sequence, and our system serves high-quality curated stock fallback video reels instead.<br/>
                  • <strong>With Paid Credits (Pay-as-you-go):</strong> Once you connect a billing account with credits to your Google AI Studio API project, actual custom video clips are fully generated and fully playable!
                </p>
              </div>

              {/* Text Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Video Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your cinematic masterpiece (e.g., 'A dramatic low-altitude flight through a misty mountain range during sunset, 8k, photorealistic')..."
                  className="w-full h-24 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-indigo-500 p-3 text-xs text-white placeholder-zinc-600 outline-none resize-none transition-colors"
                />
              </div>

              {/* Drag & Drop Reference Image (For Animate Photo) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                  <span>Animate Starting Image (Optional)</span>
                  {referenceImage && (
                    <button 
                      type="button" 
                      onClick={() => { setReferenceImage(null); setReferenceMimeType(null); }}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Clear Photo
                    </button>
                  )}
                </label>

                {referenceImage ? (
                  <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-2 overflow-hidden aspect-video flex items-center justify-center">
                    <img 
                      src={referenceImage} 
                      alt="Reference uploader" 
                      className="max-w-full max-h-36 rounded object-contain" 
                    />
                    <div className="absolute bottom-2 right-2 bg-indigo-600/80 backdrop-blur text-[9px] px-1.5 py-0.5 rounded text-white font-bold uppercase">
                      Ready to Animate
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      dragActive 
                        ? 'border-indigo-500 bg-indigo-950/20' 
                        : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900/60'
                    }`}
                  >
                    <UploadCloud className="h-7 w-7 text-zinc-500" />
                    <span className="text-xs text-zinc-300 font-medium">Drag photo here or browse</span>
                    <span className="text-[10px] text-zinc-600">Supports JPG, PNG, WEBP</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </div>
                )}
              </div>

              {/* Configuration Settings */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1 rounded-md border border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setAspectRatio('16:9')}
                      className={`py-1 text-center text-[10px] font-bold rounded transition-all ${
                        aspectRatio === '16:9' 
                          ? 'bg-zinc-800 text-white' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      16:9 Landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio('9:16')}
                      className={`py-1 text-center text-[10px] font-bold rounded transition-all ${
                        aspectRatio === '9:16' 
                          ? 'bg-zinc-800 text-white' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      9:16 Portrait
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full bg-zinc-950 text-[10px] font-bold text-zinc-300 border border-zinc-850 rounded-md p-1.5 outline-none"
                  >
                    <option value="720p">720p (Preview)</option>
                    <option value="1080p">1080p (HQ)</option>
                  </select>
                </div>
              </div>

              {/* Error and Success states */}
              {error && (
                <div className="rounded-lg bg-rose-950/20 border border-rose-900/40 p-3 flex items-start gap-2 text-rose-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3 flex items-start gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Inscribing Frame sequence...</span>
                  </>
                ) : (
                  <>
                    <Clapperboard className="h-4 w-4" />
                    <span>{referenceImage ? 'Animate Image into Video' : 'Generate Cinematic Video'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Player & Jobs History Panel */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Active/Selected Video Player */}
            <div className="rounded-xl border border-zinc-800 bg-[#121214] p-5 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between">
                <span>Viewport Projection</span>
                {activeJob && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    activeJob.status === 'done' 
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-850' 
                      : activeJob.status === 'failed'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-850'
                      : 'bg-indigo-950/80 text-indigo-400 border border-indigo-850 animate-pulse'
                  }`}>
                    {activeJob.status}
                  </span>
                )}
              </h2>

              {activeJob ? (
                <div className="space-y-4">
                  {/* Video/Image canvas frame */}
                  <div className={`relative rounded-lg overflow-hidden border border-zinc-850 bg-black flex items-center justify-center ${
                    activeJob.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[480px] mx-auto w-64' : 'aspect-video'
                  }`}>
                    {activeJob.status === 'done' && activeJob.videoUrl ? (
                      <video 
                        src={activeJob.videoUrl} 
                        controls 
                        autoPlay 
                        loop 
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : activeJob.status === 'pending' || activeJob.status === 'processing' ? (
                      <div className="flex flex-col items-center gap-3 text-zinc-500 p-8 text-center">
                        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                        <span className="text-sm font-semibold text-white">Veo is dreaming your sequence</span>
                        <p className="text-xs text-zinc-500 max-w-xs">
                          Generating AI videos requires substantial frame processing. Polling is active. This can take 1 to 2 minutes...
                        </p>
                      </div>
                    ) : activeJob.status === 'failed' ? (
                      <div className="flex flex-col items-center gap-2 text-rose-400 p-8 text-center">
                        <AlertCircle className="h-10 w-10 text-rose-500" />
                        <span className="text-sm font-semibold">Projection Blocked</span>
                        <span className="text-xs text-zinc-500">The generation request failed. Check API key quota.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-500 p-8 text-center">
                        {activeJob.imageUrl && (
                          <img src={activeJob.imageUrl} alt="Reference Preview" className="max-h-40 rounded object-contain mb-3" />
                        )}
                        <span className="text-sm font-semibold">Initiating Dream Frame...</span>
                      </div>
                    )}
                  </div>

                  {/* Details Card */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-850 space-y-2">
                    <p className="text-xs font-semibold text-zinc-400">Prompt: <span className="text-white font-medium">{activeJob.prompt}</span></p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-850">
                      <span>Aspect: {activeJob.aspectRatio}</span>
                      <span>Job ID: {activeJob.id}</span>
                      {activeJob.status === 'done' && activeJob.videoUrl && (
                        <a 
                          href={activeJob.videoUrl} 
                          download={`vibranium-veo-${activeJob.id}.mp4`}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download Reel
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-80 border border-zinc-850 bg-zinc-950/50 rounded-lg flex flex-col items-center justify-center text-center p-8 gap-2 text-zinc-600">
                  <Clapperboard className="h-12 w-12 text-zinc-800" />
                  <p className="text-sm font-semibold text-zinc-500">No projections rendered yet</p>
                  <p className="text-xs max-w-xs">Use the creative studio on the left to write a prompt and formulate your first video reel</p>
                </div>
              )}
            </div>

            {/* Jobs History list */}
            <div className="rounded-xl border border-zinc-800 bg-[#121214] p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Lab Reel History</h3>
              {jobs.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-600 italic">No historical reels found.</div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {jobs.map((job) => (
                    <div 
                      key={job.id}
                      onClick={() => setActiveJobId(job.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeJobId === job.id
                          ? 'bg-indigo-600/10 border-indigo-500/40'
                          : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-indigo-400">
                          <Film className="h-4 w-4" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-bold text-white truncate">{job.prompt}</p>
                          <p className="text-[10px] text-zinc-500">
                            {new Date(job.createdAt).toLocaleDateString()} &bull; Ratio: {job.aspectRatio}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          job.status === 'done' 
                            ? 'bg-emerald-950/60 text-emerald-400' 
                            : job.status === 'failed'
                            ? 'bg-rose-950/60 text-rose-400'
                            : 'bg-indigo-950/60 text-indigo-400 animate-pulse'
                        }`}>
                          {job.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(job.id);
                          }}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete reel"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
