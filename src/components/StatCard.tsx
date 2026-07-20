import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  limit?: number;
  icon: LucideIcon;
  colorClass: string;
  gradientClass: string;
}

export default function StatCard({ title, value, limit, icon: Icon, colorClass, gradientClass }: StatCardProps) {
  
  // Calculate percentage of allocation filled
  const percentage = limit && limit > 0 ? Math.min(Math.round((value / limit) * 100), 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-card rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative`}
    >
      {/* Decorative colored glow blob */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-2xl opacity-10 -mr-6 -mt-6 ${gradientClass}`}></div>

      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">
            {value}
            {limit !== undefined && (
              <span className="text-sm font-bold text-slate-400"> / {limit}</span>
            )}
          </h3>
        </div>
        
        {/* Dynamic color specific styled icon */}
        <div className={`p-3 rounded-xl ${colorClass} text-white shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {limit !== undefined && (
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Capacity Filled</span>
            <span className="font-mono text-slate-600">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${gradientClass}`}
            ></motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
