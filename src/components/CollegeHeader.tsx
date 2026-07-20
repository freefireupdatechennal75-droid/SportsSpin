import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function CollegeHeader() {
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
      .catch(err => console.error("Error loading settings in CollegeHeader:", err));
  }, []);

  return (
    <div className="w-full bg-white text-blue-900 border-b-4 border-blue-900 shadow-lg py-3 px-4 sm:px-6 rounded-2xl overflow-hidden mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Section: Royal Shield Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <img
            src={logoSrc}
            className="w-[100px] h-[100px] object-contain rounded-xl drop-shadow-sm"
            alt={settings?.collegeName || 'College Logo'}
            onError={() => setLogoSrc('/angel-logo.jpg')}
          />
        </div>

        {/* Center Section: College Typography */}
        <div className="flex-1 text-center md:text-center px-2">
          <h1 className="font-serif font-extrabold text-blue-900 tracking-tight text-lg sm:text-xl md:text-2xl lg:text-3xl uppercase leading-tight">
            {settings?.collegeName || "Angel College of Engineering and Technology"}
          </h1>
          
          <div className="flex items-center justify-center space-x-1.5 mt-1 text-blue-800 text-xs sm:text-sm font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>Dharapuram Road, Tirupur, Tamil Nadu</span>
          </div>

          <p className="text-[10px] sm:text-xs text-slate-600 font-medium mt-1 italic">
            (Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai)
          </p>

          {/* Quick Contacts */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs font-semibold text-blue-900 border-t border-slate-100 pt-2">
            <span className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-amber-500" />
              <span>99944 05029</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-amber-500" />
              <span>99523 58692</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center space-x-1">
              <Mail className="w-3 h-3 text-amber-500" />
              <span>info@angelcollege.edu.in</span>
            </span>
          </div>
        </div>

        {/* Right Section: TNEA Counselling Code */}
        <div className="shrink-0 flex md:flex-col items-center justify-center bg-blue-900 text-white rounded-xl overflow-hidden border border-blue-800 shadow-sm w-full md:w-32">
          <div className="bg-blue-950 px-3 py-1.5 md:py-1 text-center w-full">
            <div className="text-[9px] font-black tracking-widest text-amber-400 uppercase leading-none">TNEA</div>
            <div className="text-[8px] font-bold uppercase text-slate-200 tracking-tighter mt-0.5">Counselling Code</div>
          </div>
          <div className="bg-white text-blue-950 font-serif font-black text-xl md:text-2xl px-4 py-1.5 md:py-2 text-center w-full tracking-wide border-t border-blue-800">
            2733
          </div>
        </div>

      </div>
    </div>
  );
}
