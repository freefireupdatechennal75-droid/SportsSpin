import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle2, User, Hash, Flag, Sparkles, Download, Printer } from 'lucide-react';
import { Student, TeamColor, TeamDetail } from '../types';
import CollegeHeader from './CollegeHeader';

interface ResultPageProps {
  student: Student;
  assignedTeam: TeamColor;
  onDone: () => void;
  showCaptainDetails?: boolean;
}

export default function ResultPage({ student, assignedTeam, onDone, showCaptainDetails = true }: ResultPageProps) {
  const [teamDetails, setTeamDetails] = useState<Record<TeamColor, TeamDetail> | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/teams')
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        } else {
          const text = await res.text();
          throw new Error(text || 'Non-JSON response received');
        }
      })
      .then(data => {
        if (data.success && data.teams) {
          setTeamDetails(data.teams);
        }
      })
      .catch(err => console.error("Error loading team details in ResultPage:", err));
  }, []);
  
  // Custom theme variables for each team
  const teamThemes = {
    blue: {
      bg: 'from-blue-600 via-indigo-600 to-blue-700',
      glow: 'shadow-blue-500/30',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      solidBorder: 'border-blue-500',
      contrastBg: 'bg-blue-950/40',
      name: 'Blue Jaguars',
      symbol: '🔵'
    },
    red: {
      bg: 'from-red-600 via-rose-600 to-red-700',
      glow: 'shadow-red-500/30',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      solidBorder: 'border-red-500',
      contrastBg: 'bg-rose-950/40',
      name: 'Red Dragons',
      symbol: '🔴'
    },
    green: {
      bg: 'from-emerald-600 via-teal-600 to-emerald-700',
      glow: 'shadow-emerald-500/30',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      solidBorder: 'border-emerald-500',
      contrastBg: 'bg-emerald-950/40',
      name: 'Green Vipers',
      symbol: '🟢'
    },
    yellow: {
      bg: 'from-amber-500 via-yellow-500 to-amber-600',
      glow: 'shadow-amber-500/30',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      solidBorder: 'border-amber-500',
      contrastBg: 'bg-amber-950/40',
      name: 'Yellow Lions',
      symbol: '🟡'
    }
  };

  const currentTheme = teamThemes[assignedTeam];

  const downloadCard = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 3, // Premium high-density capture
        backgroundColor: '#0f172a', // Clean rich slate background color for the card canvas
        style: {
          borderRadius: '24px',
        }
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `SportsDay2026_TeamAllocation_${student.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate high-res card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-6 px-4 flex flex-col justify-between items-center select-none text-slate-100">
      
      {/* College Logo Banner */}
      <div className="max-w-5xl w-full mx-auto mb-2 no-print">
        <CollegeHeader />
      </div>
      
      {/* Branding Header */}
      <div className="w-full max-w-md flex justify-center items-center no-print mb-4">
        <div className="flex items-center space-x-2">
          <Award className="w-8 h-8 text-indigo-400" />
          <span className="font-extrabold tracking-tight text-lg italic text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase">Sports Day 2026</span>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="w-full max-w-md my-auto relative">
        {/* Confetti / Particle Background effect */}
        <div className="absolute inset-0 flex justify-center items-center overflow-hidden pointer-events-none no-print">
          <div className="w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl opacity-40"></div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="w-full"
        >
          {/* CARD DOWNLOAD CONTAINER - Everything in here is captured in the downloaded PNG image */}
          <div 
            ref={cardRef}
            className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/90 relative p-0 overflow-hidden"
          >
            {/* Top Team Color Header Banner */}
            <div className={`bg-gradient-to-r ${currentTheme.bg} p-8 text-center text-white relative overflow-hidden flex flex-col items-center`}>
              
              {/* Elegant Background Circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10"></div>

              <CheckCircle2 className="w-14 h-14 mb-3 animate-pulse text-white/95" />
              <h1 className="text-[10px] font-black uppercase tracking-widest text-white/80">Registration Completed</h1>
              <h2 className="text-3xl font-black mt-2 tracking-tight drop-shadow-sm flex items-center justify-center space-x-2">
                <span>{currentTheme.symbol}</span>
                <span>{teamDetails ? teamDetails[assignedTeam].name : currentTheme.name}</span>
              </h2>
            </div>

            {/* Student Profile Overview */}
            <div className="p-7 space-y-5 bg-slate-900">
              
              <div className="text-center flex flex-col items-center">
                {/* ID Card Photo (if exists) */}
                {student.idCardPhoto ? (
                  <div className="relative mb-4 flex justify-center">
                    <div className={`absolute inset-0 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-tr ${currentTheme.bg} blur-md opacity-45`}></div>
                    <img
                      src={student.idCardPhoto}
                      alt={student.name}
                      referrerPolicy="no-referrer"
                      className={`relative w-24 h-24 rounded-2xl object-cover border-4 ${currentTheme.solidBorder} shadow-xl`}
                    />
                  </div>
                ) : (
                  <div className="relative mb-4 mx-auto w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10 shadow-xl">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allocation Profile</p>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">{student.name}</h3>
                <p className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-4.5 py-1.5 rounded-full inline-block mt-2 uppercase tracking-wide border border-indigo-500/10">
                  {student.department} &bull; {student.year}
                </p>
                {student.phone && (
                  <p className="text-xs text-slate-300 mt-2 font-mono bg-white/5 px-3 py-1 rounded-lg border border-white/5 inline-flex items-center space-x-1.5">
                    <span>📞</span> <span>{student.phone}</span>
                  </p>
                )}
              </div>

              {/* Structured Card Grid */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                <div className="flex items-center space-x-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                  <Hash className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Reg Number</p>
                    <p className="text-sm font-bold text-slate-100 font-mono">{student.registerNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                  <Flag className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Assigned Team</p>
                    <p className={`text-sm font-black uppercase ${currentTheme.text}`}>
                      {teamDetails ? teamDetails[assignedTeam].name : assignedTeam}
                    </p>
                  </div>
                </div>
              </div>

              {student.aiReason && (
                <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4.5 space-y-1.5 relative overflow-hidden text-left shadow-inner">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Captain's Welcome Note</span>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{student.aiReason}"
                  </p>
                </div>
              )}

              {/* Motivational message */}
              <div className={`p-4 rounded-2xl border ${currentTheme.border} ${currentTheme.contrastBg} text-center`}>
                <p className={`text-xs font-medium leading-relaxed ${currentTheme.text}`}>
                  ✨ Report to your <strong>{teamDetails ? teamDetails[assignedTeam].name : currentTheme.name}</strong> desk supervisor to collect your official Sports jersey and scheduling guidelines!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Group - Excluded from downloaded image PNG but styled elegantly */}
          <div className="mt-5 w-full space-y-3 no-print">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadCard}
                disabled={downloading}
                className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/30 text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Download PNG</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/30 text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>Print Card</span>
              </button>
            </div>

            <button
              onClick={onDone}
              className={`w-full py-4 rounded-xl text-center font-bold text-white bg-gradient-to-r ${currentTheme.bg} shadow-lg ${currentTheme.glow} hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer font-black uppercase tracking-widest text-xs`}
            >
              All Done! Next Student
            </button>
          </div>
        </motion.div>
      </div>

      {/* Spacing node */}
      <div className="text-slate-500 text-xs text-center mt-6 no-print">
        Registered students are recorded instantly in the Central Sports Ledger.
      </div>
    </div>
  );
}
