import React from 'react';
import { motion } from 'motion/react';
import { Award, LayoutDashboard, Users, BarChart3, LogOut, ArrowLeft, ShieldAlert, Trophy, FileText } from 'lucide-react';
import { AdminUser } from '../types';

interface SidebarProps {
  currentTab: 'dashboard' | 'teamlist' | 'reports' | 'sports';
  setTab: (tab: 'dashboard' | 'teamlist' | 'reports' | 'sports') => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onNavigateToRegister: () => void;
  allowViewingTeamReports?: boolean;
}

export default function Sidebar({ currentTab, setTab, adminUser, onLogout, onNavigateToRegister, allowViewingTeamReports = true }: SidebarProps) {
  
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Admin Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'teamlist',
      label: 'Allocated Team List',
      icon: Users
    },
    {
      id: 'sports',
      label: 'Sports Registrations',
      icon: Trophy
    },
    {
      id: 'reports',
      label: 'Analytical Reports',
      icon: BarChart3
    }
  ] as const;

  return (
    <div className="w-64 bg-slate-950/60 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between text-slate-300 h-screen sticky top-0 no-print">
      
      {/* Top Brand Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center space-x-3 text-white">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/25">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-sm text-white italic bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 uppercase">Sports</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Allocation Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 py-6 px-4 space-y-1.5">
        <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest px-3 mb-3">Core Administration</p>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as 'dashboard' | 'teamlist' | 'reports' | 'sports')}
              className={`w-full flex items-center space-x-3.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Profile and Actions */}
      <div className="p-4 border-t border-white/5 space-y-4">
        
        {/* Admin Avatar Profile Block */}
        {adminUser && (
          <div className="flex items-center space-x-3 px-2 py-1.5 bg-white/5 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-inner">
              {adminUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{adminUser.name}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
                <span>Active Staff</span>
              </p>
            </div>
          </div>
        )}

        {/* Public View & Logout Buttons */}
        <div className="space-y-1">
          <button
            onClick={onNavigateToRegister}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Allocator</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
