import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Award, Shield, Zap, Target, Flame } from 'lucide-react';

export default function SportsDayBanner() {
  const [settings, setSettings] = useState<any>(null);
  const [logoSrc, setLogoSrc] = useState('/angel-logo.jpg');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
          const nextLogo = data.settings.collegeLogoUrl || '/angel-logo.jpg';
          setLogoSrc(nextLogo.startsWith('data:') || nextLogo.startsWith('http://') || nextLogo.startsWith('https://') || nextLogo.startsWith('/') ? nextLogo : `/${nextLogo.replace(/^\.?\//, '')}`);
        }
      })
      .catch(err => console.error("Error loading settings in SportsDayBanner:", err));
  }, []);

  return (
    <div className="w-full bg-slate-950/40 backdrop-blur-md border border-white/10 shadow-2xl py-5 px-4 sm:px-6 rounded-3xl overflow-hidden mb-6 relative select-none">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-amber-500/5 pointer-events-none"></div>
      
      {/* Confetti particles effect in header */}
      <div className="absolute top-2 left-10 w-2 h-2 bg-yellow-400 rotate-45 opacity-40 animate-pulse"></div>
      <div className="absolute top-12 right-24 w-1.5 h-1.5 bg-rose-500 rounded-full opacity-40 animate-ping"></div>
      <div className="absolute bottom-4 left-1/4 w-2.5 h-2.5 bg-blue-400 rotate-12 opacity-30"></div>
      <div className="absolute top-4 right-1/3 w-2 h-2 bg-green-400 rounded-xs opacity-30"></div>

      <div className="flex flex-col items-center gap-4 relative z-10">
        
        {/* Top: College Branding and Info */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 pb-4 border-b border-white/5">
          
          {/* Left: Shield Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <img 
              src={logoSrc}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
              alt={settings?.collegeName || 'College Logo'}
              onError={() => setLogoSrc('/angel-logo.jpg')}
            />
            {false && (
              <svg className="w-12 h-14 sm:w-14 sm:h-16 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20 C10 20 50 10 50 10 C50 10 90 20 90 20 C90 20 90 80 50 110 C10 80 10 20 10 20 Z" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="3" />
                <path d="M15 24 C15 24 50 15 50 15 C50 15 85 24 85 24 C85 24 85 76 50 103 C15 76 15 24 15 24 Z" fill="#f59e0b" opacity="0.8" />
                <circle cx="50" cy="55" r="20" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" />
                <circle cx="50" cy="55" r="14" fill="#1e3a8a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="50" cy="55" r="6" fill="#60a5fa" />
                <path d="M50 24 L52 29 L57 29 L53 32 L55 37 L50 34 L45 37 L47 32 L43 29 L48 29 Z" fill="#ffffff" />
              </svg>
            )}
          </div>

          {/* Center: Typography */}
          <div className="flex-1 text-center lg:text-left px-2">
            <h1 className="font-sans font-black text-white tracking-tight text-lg sm:text-xl md:text-2xl lg:text-3xl uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
              {settings?.collegeName || "Angel College of Engineering and Technology"}
            </h1>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1 sm:gap-3 mt-1.5 text-slate-300 text-[11px] sm:text-xs">
              <span className="flex items-center space-x-1 font-semibold text-amber-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Dharapuram Road, Tirupur, Tamil Nadu</span>
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="text-slate-400 italic">
                Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai
              </span>
            </div>

            {/* Quick Contacts */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2 text-[10px] sm:text-xs font-bold text-slate-300">
              <span className="flex items-center space-x-1 hover:text-white transition-colors">
                <Phone className="w-3 h-3 text-amber-400" />
                <span>99944 05029</span>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center space-x-1 hover:text-white transition-colors">
                <Phone className="w-3 h-3 text-amber-400" />
                <span>99523 58692</span>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center space-x-1 hover:text-white transition-colors">
                <Mail className="w-3 h-3 text-amber-400" />
                <span>info@angelcollege.edu.in</span>
              </span>
            </div>
          </div>

          {/* Right: Counselling Code */}
          <div className="shrink-0 flex lg:flex-col items-center justify-center bg-slate-950/60 rounded-2xl overflow-hidden border border-white/10 shadow-lg w-full sm:w-auto lg:w-32">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-1.5 text-center w-full">
              <div className="text-[10px] font-black tracking-widest text-slate-950 uppercase leading-none">TNEA</div>
              <div className="text-[8px] font-bold uppercase text-amber-950 tracking-tighter mt-0.5">Counselling Code</div>
            </div>
            <div className="bg-transparent text-amber-400 font-sans font-black text-xl md:text-2xl px-4 py-1 text-center w-full tracking-wider">
              2733
            </div>
          </div>

        </div>

        {/* Middle: Sports Day 2026 Centerpiece */}
        <div className="w-full text-center py-2 relative">
          <div className="inline-flex items-center justify-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-2">
            <Award className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">Annual Athletic Meet</span>
          </div>

          <h2 className="font-black tracking-tighter text-3xl sm:text-4xl md:text-5xl uppercase italic leading-none bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-rose-500 to-amber-400">
            Sports
          </h2>
          
          <div className="flex items-center justify-center space-x-4 mt-2">
            <span className="text-slate-500 text-xs font-black tracking-widest uppercase">Strive</span>
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            <span className="text-slate-500 text-xs font-black tracking-widest uppercase">Compete</span>
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            <span className="text-slate-500 text-xs font-black tracking-widest uppercase">Conquer</span>
          </div>

          <p className="text-amber-400 font-serif italic text-xs sm:text-sm font-semibold mt-1.5">
            Let the Game Begin!
          </p>
        </div>

        {/* Bottom: The Four Teams Showcase Row */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mt-1">
          
          {/* Blue Team */}
          <div className="bg-blue-950/40 border border-blue-500/20 hover:border-blue-500/40 transition-colors p-2.5 rounded-2xl flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-black text-blue-400 uppercase tracking-wider leading-tight">Blue Team</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">Unity • Strength • Victory</div>
            </div>
          </div>

          {/* Red Team */}
          <div className="bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/40 transition-colors p-2.5 rounded-2xl flex items-center space-x-2.5">
            <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-black text-rose-400 uppercase tracking-wider leading-tight">Red Team</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">Passion • Power • Pride</div>
            </div>
          </div>

          {/* Green Team */}
          <div className="bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors p-2.5 rounded-2xl flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider leading-tight">Green Team</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">Focus • Determination • Success</div>
            </div>
          </div>

          {/* Yellow Team */}
          <div className="bg-amber-950/40 border border-amber-500/20 hover:border-amber-500/40 transition-colors p-2.5 rounded-2xl flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider leading-tight">Yellow Team</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">Energy • Spirit • Excellence</div>
            </div>
          </div>

        </div>

        {/* Footer Slogan */}
        <div className="w-full text-center border-t border-white/5 pt-3 mt-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            ★ ★ ★ Play with Heart, Win with Pride! ★ ★ ★
          </p>
        </div>

      </div>
    </div>
  );
}
