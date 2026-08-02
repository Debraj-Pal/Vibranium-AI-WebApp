import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isPaused: boolean;
}

export default function VoiceVisualizer({ isListening, isPaused }: VoiceVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Resize canvas for high-DPI (Retina) crispness
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(container);
    handleResize();

    return () => {
      observer.disconnect();
    };
  }, []);

  // Main visualizer and Web Audio API hook
  useEffect(() => {
    let active = true;
    let dataArray: Uint8Array = new Uint8Array(0);
    let useFallback = false;

    const cleanupAudioOnly = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };

    const cleanup = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      cleanupAudioOnly();
    };

    const drawQuietState = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const totalDots = 70;
      const padding = 16;
      const availableWidth = width - padding * 2;
      const step = availableWidth / (totalDots - 1);
      const dotRadius = Math.max(1.8, (availableWidth / totalDots) * 0.22);

      for (let i = 0; i < totalDots; i++) {
        const x = padding + i * step;
        const y = centerY;

        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(161, 161, 170, 0.45)'; // zinc-400
        ctx.shadowBlur = 0;
        ctx.fill();
      }
    };

    const animatePaused = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const totalDots = 70;
      const padding = 16;

      const tick = () => {
        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        const availableWidth = width - padding * 2;
        const step = availableWidth / (totalDots - 1);
        const time = Date.now() * 0.002;
        const dotRadius = Math.max(1.8, (availableWidth / totalDots) * 0.22);

        for (let i = 0; i < totalDots; i++) {
          const ripple = Math.sin(time * 1.5 + i * 0.12) * 2.2;
          const x = padding + i * step;
          const y = centerY + ripple;

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(161, 161, 170, 0.5)';
          ctx.shadowBlur = 0;
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(tick);
      };

      animationRef.current = requestAnimationFrame(tick);
    };

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512; // High-resolution time-domain buffer
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Crucial Web Audio API Fix: Explicitly resume suspended AudioContext
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
      } catch (err) {
        console.warn("Microphone access denied, suspended or blocked by iframe sandbox. Using procedural fallback:", err);
        useFallback = true;
      }

      startLoop();
    };

    const startLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const totalDots = 70;
      const padding = 16;
      
      // Keep track of smoothed amplitude to interpolate between frames
      const smoothedAmplitudes = new Float32Array(totalDots);
      smoothedAmplitudes.fill(0);

      const tick = async () => {
        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Auto-resume audio context if it gets suspended
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume();
          } catch (e) {}
        }

        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        const availableWidth = width - padding * 2;
        const step = availableWidth / (totalDots - 1);
        const time = Date.now() * 0.0025;
        const baseDotRadius = Math.max(1.8, (availableWidth / totalDots) * 0.22);

        if (!useFallback && analyserRef.current) {
          // Use Time Domain Data to capture wave amplitude continuously
          analyserRef.current.getByteTimeDomainData(dataArray);
        }

        for (let i = 0; i < totalDots; i++) {
          const centerIndex = (totalDots - 1) / 2;
          const distanceFromCenter = Math.abs(i - centerIndex);
          // Bell curve envelope weight to concentrate wave amplitude beautifully in center
          const weight = Math.exp(-Math.pow(distanceFromCenter / (centerIndex * 0.58), 2));

          let amplitude = 0;
          if (!useFallback && analyserRef.current && dataArray.length > 0) {
            const sampleIndex = Math.floor((i / totalDots) * dataArray.length);
            const rawValue = dataArray[sampleIndex] !== undefined ? dataArray[sampleIndex] : 128;
            const deviation = Math.abs(rawValue - 128);
            const boostedDeviation = Math.min(128, deviation * 4.5);
            amplitude = (boostedDeviation / 128) * (height * 0.4) * weight;
          } else {
            // High fidelity, smooth simulated speech wave when mic fallback is active
            const voiceModulation = Math.sin(time * 0.8) * 0.4 + 0.6;
            const wave1 = Math.sin(time * 2.2 - i * 0.15) * (height * 0.28);
            const wave2 = Math.cos(time * 1.1 + i * 0.08) * (height * 0.12);
            amplitude = Math.max(0, (wave1 + wave2) * voiceModulation) * weight;
          }

          // Apply temporal smoothing (lerp factor: 0.12)
          smoothedAmplitudes[i] += (amplitude - smoothedAmplitudes[i]) * 0.12;
          const currentAmp = smoothedAmplitudes[i];

          // Dotted wave: vertical displacement oscillates with audio wave phase
          const wavePhase = Math.sin(time * 4 - i * 0.2);
          const yDisplacement = wavePhase * currentAmp;

          const x = padding + i * step;
          const y = centerY + yDisplacement;
          const dotRadius = baseDotRadius + Math.min(2, (currentAmp / height) * 3);

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);

          // If active audio is speaking, give active dots colorful gradient & glow
          if (currentAmp > 1.5) {
            ctx.fillStyle = '#a855f7'; // Purple glow dot
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
          } else {
            ctx.fillStyle = 'rgba(161, 161, 170, 0.5)'; // zinc-400
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(tick);
      };

      animationRef.current = requestAnimationFrame(tick);
    };

    if (!isListening) {
      cleanup();
      drawQuietState();
      return;
    }

    if (isPaused) {
      cleanup();
      animatePaused();
      return;
    }

    initAudio();

    return () => {
      active = false;
      cleanup();
    };
  }, [isListening, isPaused]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-10 select-none overflow-hidden relative"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block absolute top-0 left-0"
      />
    </div>
  );
}
