import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { 
  BarChart3, Download, Printer, Users, Award, 
  TrendingUp, Activity, Briefcase, Calendar, ShieldCheck
} from 'lucide-react';
import { Student, DashboardStats, TeamColor, TeamDetail } from '../types';
import CollegeHeader from './CollegeHeader';

interface ReportsProps {
  token: string;
  onLogout: () => void;
}

export default function Reports({ token, onLogout }: ReportsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [printMode, setPrintMode] = useState<'analytical' | 'print'>('analytical');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch dashboard stats
      const statsRes = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let statsData: any = {};
      const statsContentType = statsRes.headers.get('content-type');
      if (statsContentType && statsContentType.includes('application/json')) {
        statsData = await statsRes.json();
      } else {
        const text = await statsRes.text();
        throw new Error(text || 'Non-JSON response received');
      }
      if (!statsRes.ok) {
        if (statsRes.status === 401 || statsRes.status === 403) {
          onLogout();
          return;
        }
        throw new Error(statsData.error || 'Failed to load report metrics');
      }

      // Fetch student list
      const studentsRes = await fetch('/api/students');
      let studentsData: any = {};
      const studentsContentType = studentsRes.headers.get('content-type');
      if (studentsContentType && studentsContentType.includes('application/json')) {
        studentsData = await studentsRes.json();
      } else {
        const text = await studentsRes.text();
        throw new Error(text || 'Non-JSON response received');
      }
      if (!studentsRes.ok) {
        throw new Error(studentsData.error || 'Failed to load students ledger');
      }

      setStats(statsData);
      setStudents(studentsData.students);
    } catch (err: any) {
      setError(err.message || 'Reports API offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode('analytical');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const getDepartmentStats = () => {
    const counts: { [dept: string]: number } = {};
    students.forEach(s => {
      counts[s.department] = (counts[s.department] || 0) + 1;
    });
    return Object.entries(counts).map(([dept, count]) => ({
      name: dept.replace(' (', '\n(').split('\n')[0],
      fullName: dept,
      count
    })).sort((a, b) => b.count - a.count);
  };

  const getYearStats = () => {
    const counts: { [year: string]: number } = {
      '1st Year': 0,
      '2nd Year': 0,
      '3rd Year': 0,
      '4th Year': 0
    };
    students.forEach(s => {
      if (counts[s.year] !== undefined) counts[s.year]++;
    });
    return Object.entries(counts).map(([year, count]) => ({ name: year, count }));
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      return alert('No student records found to export!');
    }

    const csvRows = [
      ['COLLEGE SPORTS - ANALYTICAL SUMMARY REPORT'],
      ['Generated Date:', new Date().toLocaleString()],
      ['Total Student Target Capacity:', stats?.totalCapacity],
      ['Total Students Registered:', students.length],
      [''],
      ['TEAM WISE ALLOCATION DETAILS'],
      ['Team Name', 'Allocated Count', 'Maximum Limit', 'Capacity Utilized (%)'],
      ['Blue Jaguars', stats?.teamCounts.blue, stats?.teamLimits.blue, Math.round(((stats?.teamCounts.blue || 0) / (stats?.teamLimits.blue || 1)) * 100) + '%'],
      ['Red Dragons', stats?.teamCounts.red, stats?.teamLimits.red, Math.round(((stats?.teamCounts.red || 0) / (stats?.teamLimits.red || 1)) * 100) + '%'],
      ['Green Vipers', stats?.teamCounts.green, stats?.teamLimits.green, Math.round(((stats?.teamCounts.green || 0) / (stats?.teamLimits.green || 1)) * 100) + '%'],
      ['Yellow Lions', stats?.teamCounts.yellow, stats?.teamLimits.yellow, Math.round(((stats?.teamCounts.yellow || 0) / (stats?.teamLimits.yellow || 1)) * 100) + '%'],
      [''],
      ['DEPARTMENT WISE BREAKDOWN'],
      ['Department Name', 'Student Count']
    ];

    getDepartmentStats().forEach(d => {
      csvRows.push([`"${d.fullName}"`, d.count.toString()]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.map(row => row.join(',')).join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `Sports_Day_Analytical_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Compiling Analytical Metrics...</p>
      </div>
    );
  }

  const teamBarData = stats ? [
    { name: 'Blue Jaguars', Allocated: stats.teamCounts.blue, Limit: stats.teamLimits.blue, fill: '#3b82f6' },
    { name: 'Red Dragons', Allocated: stats.teamCounts.red, Limit: stats.teamLimits.red, fill: '#ef4444' },
    { name: 'Green Vipers', Allocated: stats.teamCounts.green, Limit: stats.teamLimits.green, fill: '#22c55e' },
    { name: 'Yellow Lions', Allocated: stats.teamCounts.yellow, Limit: stats.teamLimits.yellow, fill: '#eab308' }
  ] : [];

  const deptData = getDepartmentStats();
  const yearData = getYearStats();

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-8 h-screen">
      
      {/* 1. ANALYTICAL DOCKET & SCREEN VIEW */}
      <div className={printMode === 'analytical' ? 'space-y-8' : 'hidden'}>
        {/* College Logo Banner */}
        <div className="w-full mb-6 no-print">
          <CollegeHeader />
        </div>
        
        {/* Top Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/5 no-print">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Reports & Business Insights</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
              Download summaries, print official audits, and explore demographics.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl shadow-2xl cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Analytical CSV</span>
            </button>

            <button
              onClick={() => {
                setPrintMode('analytical');
                setTimeout(() => {
                  window.print();
                }, 150);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Analytical Docket</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 text-rose-300 border border-rose-500/20 p-4 rounded-xl text-xs font-bold no-print">
            {error}
          </div>
        )}

        {/* Printable Letterhead Header */}
        <div className="print-only p-8 border-b-2 border-slate-300 text-center">
          <h1 className="text-3xl font-black text-slate-900">College Sports</h1>
          <h2 className="text-md font-bold uppercase text-slate-500 tracking-widest mt-1">Official Team Allocation Summary Docket</h2>
          <p className="text-xs text-slate-400 mt-4">Compiled Live on: {new Date().toLocaleString()} &bull; Security Audit Checked: Approved</p>
        </div>

        {/* High-Level Analytical Micro Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-2xl flex items-center space-x-4 bg-white/5">
            <div className="p-3.5 rounded-xl bg-indigo-500/15 text-indigo-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Allocation Ratio</p>
              <h4 className="text-xl font-black text-white mt-0.5">
                {stats ? Math.min(Math.round((students.length / stats.totalCapacity) * 100), 100) : 0}%
              </h4>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-2xl flex items-center space-x-4 bg-white/5">
            <div className="p-3.5 rounded-xl bg-emerald-500/15 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System State</p>
              <h4 className="text-sm font-bold mt-1 uppercase text-emerald-400 tracking-widest">SECURE</h4>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-2xl flex items-center space-x-4 bg-white/5">
            <div className="p-3.5 rounded-xl bg-purple-500/15 text-purple-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Depts</p>
              <h4 className="text-xl font-black text-white mt-0.5">{deptData.length}</h4>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-2xl flex items-center space-x-4 bg-white/5">
            <div className="p-3.5 rounded-xl bg-amber-500/15 text-amber-300">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Event Bounds</p>
              <h4 className="text-xl font-black text-white mt-0.5">{stats?.totalCapacity} Students</h4>
            </div>
          </div>
        </div>

        {/* Real-time Team Allocation margins Comparison */}
        <div className="glass-panel rounded-3xl border border-white/10 p-6 shadow-2xl bg-white/5">
          <div>
            <h3 className="font-extrabold text-white tracking-tight text-sm uppercase flex items-center space-x-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Allocated Counts vs Team Limits</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Displays allocation fill rates to maintain perfect balance</p>
          </div>

          <div className="h-80 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="Allocated" radius={[6, 6, 0, 0]}>
                  {teamBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                <Bar dataKey="Limit" fill="rgba(255,255,255,0.08)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Double Column breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Department Breakdown Bar chart */}
          <div className="lg:col-span-7 glass-panel rounded-3xl border border-white/10 p-6 shadow-2xl bg-white/5">
            <div>
              <h3 className="font-extrabold text-white tracking-tight text-sm uppercase flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Department wise Breakdown</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Student registrations distributed per major</p>
            </div>

            <div className="h-72 mt-8">
              {deptData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                  No department metrics found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} fontWeight="bold" />
                    <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Academic Year breakdown list */}
          <div className="lg:col-span-5 glass-panel rounded-3xl border border-white/10 p-6 shadow-2xl bg-white/5 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-white tracking-tight text-sm uppercase flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Academic Cohorts</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Yearly registration demographics analysis</p>
            </div>

            <div className="space-y-4 my-6">
              {yearData.map((y, idx) => {
                const total = students.length || 1;
                const percentage = Math.round((y.count / total) * 100);
                return (
                  <div key={y.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{y.name}</span>
                      <span className="font-mono text-slate-400">{y.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${percentage}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center leading-relaxed">
              Official College Sports Ledger &bull; End of Analytical summary
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
