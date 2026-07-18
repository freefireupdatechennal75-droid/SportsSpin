import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Volume2, VolumeX, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, TeamColor } from '../types';
import CollegeHeader from './CollegeHeader';

interface SpinWheelProps {
  student: Student;
  onSpinComplete: (assignedTeam: TeamColor) => void;
}

export default function SpinWheel({ student, onSpinComplete }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState('');
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isSpinningRef = useRef(false);

  // Initialize Web Audio API safely on first user interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Warm up and unlock Web Audio API immediately on first window click or touch
  useEffect(() => {
    const handleWarmup = () => {
      try {
        initAudio();
        const ctx = audioCtxRef.current;
        if (ctx) {
          // Play an ultra-short inaudible note to satisfy browser gesture requirements
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(1, ctx.currentTime);
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.001);
        }
      } catch (err) {
        console.warn('Audio warmup failed:', err);
      }
    };

    window.addEventListener('click', handleWarmup, { once: true });
    window.addEventListener('touchstart', handleWarmup, { once: true });

    return () => {
      window.removeEventListener('click', handleWarmup);
      window.removeEventListener('touchstart', handleWarmup);
    };
  }, []);

  // Play crisp mechanical click/tick sound
  const playTickSound = () => {
    if (muted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.24, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (err) {
      // Audio blocked or failed
    }
  };

  // Play grandiose winning major chime
  const playWinSound = () => {
    if (muted) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const playNote = (freq: number, start: number, duration: number, volume: number = 0.12) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        gain.gain.setValueAtTime(volume, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Arpeggio leading to a triumphant major triad
      playNote(261.63, 0, 0.2);       // C4
      playNote(329.63, 0.12, 0.2);    // E4
      playNote(392.00, 0.24, 0.2);    // G4
      
      // Gorgeous celebratory C-major triad!
      playNote(523.25, 0.36, 0.7, 0.10); // C5
      playNote(659.25, 0.36, 0.7, 0.10); // E5
      playNote(783.99, 0.36, 0.7, 0.10); // G5
    } catch (err) {
      // Audio blocked or failed
    }
  };

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    isSpinningRef.current = true;
    setError('');
    initAudio();

    try {
      const res = await fetch('/api/students/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Non-JSON response received');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to allocate team');
      }

      const assignedTeam: TeamColor = data.assignedTeam;

      // Map team colors to wheel degrees considering the SVG's -45 deg static rotation:
      // - Sector 1 (Blue): original center 315°, rotated -45° is 270° (already at top pointer 12 o'clock). baseAngle = 360° (or 0°).
      // - Sector 2 (Red): original center 45°, rotated -45° is 0° (3 o'clock). Needs 270° clockwise to land at 12 o'clock.
      // - Sector 3 (Green): original center 135°, rotated -45° is 90° (6 o'clock). Needs 180° clockwise to land at 12 o'clock.
      // - Sector 4 (Yellow): original center 225°, rotated -45° is 180° (9 o'clock). Needs 90° clockwise to land at 12 o'clock.
      let baseAngle = 0;
      switch (assignedTeam) {
        case 'red':
          baseAngle = 270; // Red lands at top
          break;
        case 'green':
          baseAngle = 180; // Green lands at top
          break;
        case 'yellow':
          baseAngle = 90; // Yellow lands at top
          break;
        case 'blue':
          baseAngle = 360; // Blue lands at top
          break;
      }

      // Add a small randomized offset (from -15deg to +15deg) so it doesn't land exactly centered
      const randomOffset = Math.floor(Math.random() * 30) - 15;

      // Calculate total spin degrees (5 full rotations = 1800deg plus the target position)
      const targetRotation = rotation + 1800 + baseAngle + randomOffset - (rotation % 360);
      setRotation(targetRotation);

      // Auditory feedback: simulate mechanical ticker clicks as the wheel spins
      // Starting very frequent, then slowing down gradually to perfectly rest at 5000ms
      const clickIntervals = [
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        100, 100, 100, 100, 100,
        130, 130, 130,
        170, 170, 170,
        220, 220,
        300, 300,
        400, 400,
        600, 800
      ];
      let delay = 0;

      clickIntervals.forEach((interval) => {
        delay += interval;
        setTimeout(() => {
          if (isSpinningRef.current) {
            playTickSound();
          }
        }, delay);
      });

      // Wheel stops after 5s (matching transition timing)
      setTimeout(() => {
        setSpinning(false);
        isSpinningRef.current = false;
        playWinSound();

        // Throw beautiful confetti explosion!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Redirect/notify completion
        setTimeout(() => {
          onSpinComplete(assignedTeam);
        }, 1200);

      }, 5000);

    } catch (err: any) {
      setSpinning(false);
      isSpinningRef.current = false;
      setError(err.message || 'Wheel error. Please contact sports desk.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-6 px-4 flex flex-col justify-between items-center select-none text-slate-100">
      
      {/* College Logo Banner */}
      <div className="max-w-5xl w-full mx-auto mb-2 no-print">
        <CollegeHeader />
      </div>
      
      {/* Top Banner */}
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Award className="w-8 h-8 text-indigo-400 animate-pulse" />
          <span className="font-extrabold tracking-tight text-lg italic text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase">Sports Allocation</span>
        </div>
        
        {/* Mute Button */}
        <button
          onClick={() => {
            const nextMuted = !muted;
            setMuted(nextMuted);
            if (!nextMuted) {
              // Unmuting: play a pleasant double chime to test and unlock Web Audio
              try {
                initAudio();
                const ctx = audioCtxRef.current;
                if (ctx) {
                  const playTestNote = (freq: number, start: number) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime + start);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + start);
                    osc.stop(ctx.currentTime + start + 0.15);
                  };
                  playTestNote(523.25, 0); // C5
                  playTestNote(659.25, 0.08); // E5
                }
              } catch (e) {
                // Ignore
              }
            }
          }}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-xs hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
          title={muted ? "Unmute sound" : "Mute sound"}
        >
          {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-[10px] font-bold uppercase tracking-wider px-1">{muted ? "Muted" : "Active"}</span>
        </button>
      </div>

      {/* Main Wheel Container */}
      <div className="flex flex-col items-center max-w-lg w-full relative">
        <div className="text-center mb-6">
          <p className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-1">ALLOCATION PHASE</p>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Spin the Wheel!</h2>
          <p className="text-sm text-slate-400 mt-2">
            Welcome, <span className="font-bold text-slate-200">{student.name}</span> (<span className="font-mono text-slate-300">{student.registerNumber}</span>)
          </p>
        </div>

        {/* Pointer Indicator */}
        <div className="z-10 -mb-2 relative animate-bounce">
          <ArrowDown className="w-10 h-10 text-indigo-400 fill-indigo-400 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
        </div>

        {/* Spinning Wheel */}
        <div className="relative w-76 h-76 sm:w-96 sm:h-96 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.6)] p-4 bg-slate-900 border-[10px] border-slate-800 flex items-center justify-center overflow-hidden">
          
          {/* Wheel Frame Visual Accents */}
          <div className="absolute inset-2 border-4 border-dashed border-indigo-500/15 rounded-full z-10 pointer-events-none spin-slow"></div>

          <div
            ref={wheelRef}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
            }}
            className="w-full h-full rounded-full overflow-hidden shadow-inner relative flex items-center justify-center bg-slate-950"
          >
            {/* SVG Vector Sectors */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-45">
              {/* Sector 1: Blue (top-right static) */}
              <path d="M50,50 L50,0 A50,50 0 0,1 100,50 Z" fill="#3b82f6" />
              {/* Sector 2: Red (bottom-right static) */}
              <path d="M50,50 L100,50 A50,50 0 0,1 50,100 Z" fill="#ef4444" />
              {/* Sector 3: Green (bottom-left static) */}
              <path d="M50,50 L50,100 A50,50 0 0,1 0,50 Z" fill="#10b881" />
              {/* Sector 4: Yellow (top-left static) */}
              <path d="M50,50 L0,50 A50,50 0 0,1 50,0 Z" fill="#f59e0b" />

              {/* Text labels directly drawn on the sectors with mathematical precision */}
              <text x="71.21" y="28.79" fill="white" fontWeight="900" fontSize="5" textAnchor="middle" dominantBaseline="central" transform="rotate(45, 71.21, 28.79)" letterSpacing="0.05em" className="select-none pointer-events-none font-sans" style={{ filter: 'drop-shadow(0px 1.5px 3px rgba(0,0,0,0.8))' }}>BLUE</text>
              <text x="71.21" y="71.21" fill="white" fontWeight="900" fontSize="5" textAnchor="middle" dominantBaseline="central" transform="rotate(135, 71.21, 71.21)" letterSpacing="0.05em" className="select-none pointer-events-none font-sans" style={{ filter: 'drop-shadow(0px 1.5px 3px rgba(0,0,0,0.8))' }}>RED</text>
              <text x="28.79" y="71.21" fill="white" fontWeight="900" fontSize="5" textAnchor="middle" dominantBaseline="central" transform="rotate(225, 28.79, 71.21)" letterSpacing="0.05em" className="select-none pointer-events-none font-sans" style={{ filter: 'drop-shadow(0px 1.5px 3px rgba(0,0,0,0.8))' }}>GREEN</text>
              <text x="28.79" y="28.79" fill="white" fontWeight="900" fontSize="5" textAnchor="middle" dominantBaseline="central" transform="rotate(315, 28.79, 28.79)" letterSpacing="0.05em" className="select-none pointer-events-none font-sans" style={{ filter: 'drop-shadow(0px 1.5px 3px rgba(0,0,0,0.8))' }}>YELLOW</text>
            </svg>
          </div>

          {/* Centered Premium Metallic Hub */}
          <div className="absolute w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-b from-slate-800 to-slate-950 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-xl z-20">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
              <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
            </div>
          </div>
        </div>

        {/* Spin Control Button */}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="mt-8 px-14 py-4.5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 cursor-pointer text-white"
        >
          {spinning ? 'Allocating...' : 'Spin to Allocate'}
        </button>

        {error && (
          <div className="mt-4 bg-red-900/40 text-red-200 border border-red-500/25 backdrop-blur-md rounded-xl px-4 py-2.5 text-xs font-semibold text-center max-w-sm">
            {error}
          </div>
        )}
      </div>

      {/* Spacing alignment */}
      <div className="text-slate-500 text-xs text-center mt-6">
        Click Spin to run the randomized balance allocation protocol.
      </div>
    </div>
  );
}
