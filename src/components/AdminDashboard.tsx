import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { 
  Users, Award, Settings, Trash2, ShieldAlert, CheckCircle, 
  Clock, Hash, FileSpreadsheet, RefreshCcw, Bell, User, Upload
} from 'lucide-react';
import { DashboardStats, AppSettings, TeamColor, TeamDetail } from '../types';
import StatCard from './StatCard';
import CollegeHeader from './CollegeHeader';

const compressCaptainImage = (dataUrl: string, size = 300, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
  });
};

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  onSettingsUpdated?: () => void;
}

export default function AdminDashboard({ token, onLogout, onSettingsUpdated }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Settings edit state
  const [showSettings, setShowSettings] = useState(false);
  const [newCapacity, setNewCapacity] = useState('200');
  const [newTitle, setNewTitle] = useState('Sports');
  const [collegeName, setCollegeName] = useState('');
  const [collegeLogoUrl, setCollegeLogoUrl] = useState('');
  const [showCaptainDetailsState, setShowCaptainDetailsState] = useState(true);
  const [allowViewingTeamReportsState, setAllowViewingTeamReportsState] = useState(true);
  const [enrollmentDeadlineState, setEnrollmentDeadlineState] = useState('');
  const [enableTimeLimitState, setEnableTimeLimitState] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Reset database state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmString, setConfirmString] = useState('');
  const [resetting, setResetting] = useState(false);

  // Success messages alerts
  const [successMsg, setSuccessMsg] = useState('');

  // Team Details edit states
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [teams, setTeams] = useState<Record<TeamColor, TeamDetail> | null>(null);
  const [selectedTeamEdit, setSelectedTeamEdit] = useState<TeamColor>('blue');
  const [editName, setEditName] = useState('');
  const [editCaptainName, setEditCaptainName] = useState('');
  const [editCaptainImage, setEditCaptainImage] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBenefits, setEditBenefits] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        throw new Error(data.error || 'Failed to load stats');
      }
      setStats(data);
      setNewCapacity(data.totalCapacity.toString());
      if (data.settings) {
        setNewTitle(data.settings.title || 'Sports');
        setCollegeName(data.settings.collegeName || 'Angel College of Engineering and Technology');
        setCollegeLogoUrl(data.settings.collegeLogoUrl || '');
        setShowCaptainDetailsState(data.settings.showCaptainDetails !== false);
        setAllowViewingTeamReportsState(data.settings.allowViewingTeamReports !== false);
        setEnrollmentDeadlineState(data.settings.enrollmentDeadline || '');
        setEnableTimeLimitState(!!data.settings.enableTimeLimit);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reach administrative API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh stats every 10 seconds for live updates
    const timer = setInterval(fetchStats, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSettingsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          totalCapacity: parseInt(newCapacity, 10),
          title: newTitle,
          collegeName,
          collegeLogoUrl,
          showCaptainDetails: showCaptainDetailsState,
          allowViewingTeamReports: allowViewingTeamReportsState,
          enrollmentDeadline: enrollmentDeadlineState,
          enableTimeLimit: enableTimeLimitState
        })
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
        throw new Error(data.error || 'Failed to update configuration.');
      }

      setStats(prev => prev ? { ...prev, totalCapacity: data.settings.totalCapacity } : null);
      setSuccessMsg('✅ Sports settings updated successfully!');
      setShowSettings(false);
      onSettingsUpdated?.();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (confirmString !== 'RESET_ALL') {
      setError('Confirmation typing mismatch. Write "RESET_ALL" exactly.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setResetting(true);

    try {
      const res = await fetch('/api/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirm: 'RESET_ALL' })
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
        throw new Error(data.error || 'Reset query rejected by server');
      }

      setSuccessMsg('🧹 Database purged. Ready for fresh allocation registrations.');
      setShowResetConfirm(false);
      setConfirmString('');
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  };

  // Fetch team configurations when opening the team details editor
  useEffect(() => {
    if (showTeamEditor) {
      setError('');
      setSuccessMsg('');
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
            setTeams(data.teams);
            const current = data.teams[selectedTeamEdit];
            if (current) {
              setEditName(current.name);
              setEditCaptainName(current.captainName);
              setEditCaptainImage(current.captainImage || '');
              setEditDescription(current.description);
              setEditBenefits(current.benefits.join('\n'));
            }
          }
        })
        .catch(err => {
          console.error("Error fetching team list:", err);
          setError('Failed to fetch team configuration.');
        });
    }
  }, [showTeamEditor]);

  // Sync team form inputs when switching active team tab
  useEffect(() => {
    if (teams && teams[selectedTeamEdit]) {
      const current = teams[selectedTeamEdit];
      setEditName(current.name);
      setEditCaptainName(current.captainName);
      setEditCaptainImage(current.captainImage || '');
      setEditDescription(current.description);
      setEditBenefits(current.benefits.join('\n'));
    }
  }, [selectedTeamEdit, teams]);

  const handleSaveTeamDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setTeamSaving(true);

    try {
      const parsedBenefits = editBenefits
        .split('\n')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      const res = await fetch(`/api/teams/${selectedTeamEdit}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          captainName: editCaptainName,
          captainImage: editCaptainImage,
          description: editDescription,
          benefits: parsedBenefits
        })
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
        throw new Error(data.error || 'Failed to save team details.');
      }

      setSuccessMsg(`✅ ${editName} details saved successfully!`);
      if (teams) {
        setTeams({
          ...teams,
          [selectedTeamEdit]: data.team
        });
      }
      setShowTeamEditor(false);
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTeamSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-xs font-black tracking-widest text-slate-400 uppercase">Loading Central Statistics...</p>
      </div>
    );
  }

  // Formatting chart data
  const chartData = stats ? [
    { name: 'Blue Jaguars', value: stats.teamCounts.blue, color: '#3b82f6' },
    { name: 'Red Dragons', value: stats.teamCounts.red, color: '#ef4444' },
    { name: 'Green Vipers', value: stats.teamCounts.green, color: '#22c55e' },
    { name: 'Yellow Lions', value: stats.teamCounts.yellow, color: '#eab308' }
  ] : [];

  const teamBadges = {
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    red: 'bg-red-500/15 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    green: 'bg-green-500/15 text-green-300 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    yellow: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-8 h-screen">
      
      {/* College Logo Banner */}
      <div className="w-full mb-6 no-print">
        <CollegeHeader />
      </div>
      
      {/* Top Welcome Navbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/5 no-print">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">System Overview</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Sports Allocation Engine live analytics dashboard monitor.
          </p>
        </div>

        {/* Administrative Action Bar */}
        <div className="flex items-center space-x-3 mt-4 md:mt-0 flex-wrap gap-y-2">
          <button
            onClick={() => {
              setError('');
              setSuccessMsg('');
              setShowTeamEditor(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs font-bold cursor-pointer transition-all"
          >
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Edit Team Details</span>
          </button>

          <button
            onClick={() => {
              setError('');
              setSuccessMsg('');
              setShowSettings(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl shadow-2xl cursor-pointer transition-all"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Manage Capacity</span>
          </button>

          <button
            onClick={() => {
              setError('');
              setSuccessMsg('');
              setShowResetConfirm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-bold cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>
      </div>

      {/* General Success & Error Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-pulse"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-red-500/10 text-red-300 border border-red-500/20 p-4 rounded-xl text-xs font-bold flex items-center space-x-2"
          >
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Registered"
            value={stats.totalRegistered}
            limit={stats.totalCapacity}
            icon={Users}
            colorClass="bg-slate-800"
            gradientClass="bg-slate-600"
          />
          <StatCard
            title="Blue Jaguars"
            value={stats.teamCounts.blue}
            limit={stats.teamLimits.blue}
            icon={Award}
            colorClass="bg-blue-600"
            gradientClass="bg-blue-500"
          />
          <StatCard
            title="Red Dragons"
            value={stats.teamCounts.red}
            limit={stats.teamLimits.red}
            icon={Award}
            colorClass="bg-red-600"
            gradientClass="bg-red-500"
          />
          <StatCard
            title="Green Vipers"
            value={stats.teamCounts.green}
            limit={stats.teamLimits.green}
            icon={Award}
            colorClass="bg-green-600"
            gradientClass="bg-green-500"
          />
          <StatCard
            title="Yellow Lions"
            value={stats.teamCounts.yellow}
            limit={stats.teamLimits.yellow}
            icon={Award}
            colorClass="bg-yellow-500"
            gradientClass="bg-yellow-500"
          />
        </div>
      )}

      {/* Sub charts and list row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Recharts Pie Chart Column */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 flex flex-col justify-between bg-white/5 border border-white/10 shadow-2xl">
          <div>
            <h3 className="font-extrabold tracking-widest text-xs uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Team Distribution</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Real-time team assignment proportions</p>
          </div>
          
          <div className="h-64 mt-4 relative">
            {stats && stats.totalRegistered === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <FileSpreadsheet className="w-12 h-12 text-slate-500 stroke-[1.5]" />
                <p className="text-xs font-semibold mt-3">No student registrations logged yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontSize: '11px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Registrations Column */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 flex flex-col justify-between bg-white/5 border border-white/10 shadow-2xl">
          <div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold tracking-widest text-xs uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Recent Allocations</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Latest registrations from the spinning wheel</p>
              </div>
              <span className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 cursor-pointer text-slate-400 transition-colors" onClick={fetchStats}>
                <RefreshCcw className="w-4 h-4 text-indigo-400" />
              </span>
            </div>

            <div className="mt-6 space-y-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
              {stats && stats.recentStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  Awaiting allocation entries.
                </div>
              ) : (
                stats?.recentStudents.map((student) => (
                  <div key={student.id} className="flex justify-between items-center p-3.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-xs uppercase">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{student.registerNumber} &bull; {student.department}</p>
                      </div>
                    </div>
                    {student.team ? (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${teamBadges[student.team]}`}>
                        {student.team}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-400 border border-white/10">
                        Pending
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Audit Activity Logs */}
      <div className="glass-card rounded-2xl p-6 bg-white/5 border border-white/10 shadow-2xl">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="font-extrabold tracking-widest text-xs uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Activity Log & Audit Trail</h3>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {stats && stats.recentLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              No recent audit trail logs found.
            </div>
          ) : (
            stats?.recentLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 text-xs border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div className="mt-0.5 p-1 rounded-full bg-white/5 text-indigo-400 border border-white/10">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-300">
                    <span className="font-extrabold text-white">{log.user}</span> &bull; {log.action}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{log.details}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Change Capacity Dialog Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-white/10 bg-slate-900/90 text-white my-8"
          >
            <h3 className="text-xl font-bold text-white mb-2 italic">Adjust System & College Configuration</h3>
            <p className="text-xs text-slate-400 mb-6 font-semibold uppercase tracking-wider">
              Enter target student bounds and update college branding details.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Students Upper Limit</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    required
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sports Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="block w-full px-4 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">College Name</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  required
                  className="block w-full px-4 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">College Logo (URL or File Import)</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={collegeLogoUrl}
                    onChange={(e) => setCollegeLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png or uploaded image data"
                    className="block w-full px-4 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  
                  <div className="flex items-center space-x-3">
                    <label className="relative flex items-center justify-center px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 mr-2" />
                      <span>Upload Logo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setCollegeLogoUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {collegeLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setCollegeLogoUrl('')}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 cursor-pointer"
                      >
                        Clear Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrollment Time Limit Settings */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Time Restricted Enrollment</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Enforce a registration deadline to auto-close signups.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableTimeLimitState}
                      onChange={(e) => setEnableTimeLimitState(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                  </label>
                </div>

                {enableTimeLimitState && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest">Enrollment Deadline (Date & Time)</label>
                    <input
                      type="datetime-local"
                      value={enrollmentDeadlineState}
                      onChange={(e) => setEnrollmentDeadlineState(e.target.value)}
                      required={enableTimeLimitState}
                      className="block w-full px-4 py-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider shadow-lg shadow-indigo-600/20"
                >
                  {settingsSaving ? 'Saving...' : 'Apply Config'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Team Details Editor Modal */}
      {showTeamEditor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-white/10 bg-slate-900/95 text-white overflow-y-auto max-h-[92vh]"
          >
            <h3 className="text-xl font-bold text-white mb-2 italic">Edit Team Configuration</h3>
            <p className="text-xs text-slate-400 mb-6 font-semibold uppercase tracking-wider">
              Customize team details, captains, descriptions, and benefits shown to students upon spinning.
            </p>

            {/* Team Selector tabs */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {(['blue', 'red', 'green', 'yellow'] as TeamColor[]).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedTeamEdit(col)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                    selectedTeamEdit === col
                      ? col === 'blue' ? 'bg-blue-600/25 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : col === 'red' ? 'bg-red-600/25 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : col === 'green' ? 'bg-green-600/25 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                        : 'bg-yellow-500/25 border-yellow-500 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {col === 'blue' ? '🔵 Blue'
                   : col === 'red' ? '🔴 Red'
                   : col === 'green' ? '🟢 Green'
                   : '🟡 Yellow'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveTeamDetails} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Team Brand Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  placeholder="e.g. Blue Jaguars"
                  className="block w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/60 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Motto / Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={2}
                  placeholder="A cool description about team spirit or goals"
                  className="block w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/60 text-white text-sm focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-300">
                  Benefits & Perks (one per line)
                </label>
                <textarea
                  value={editBenefits}
                  onChange={(e) => setEditBenefits(e.target.value)}
                  required
                  rows={4}
                  placeholder="Official Team Jersey&#10;Access to Specialized Sports Kit&#10;Complimentary Energy Drinks"
                  className="block w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/60 text-white text-sm focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono text-xs"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTeamEditor(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teamSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider shadow-lg shadow-indigo-600/20"
                >
                  {teamSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Safety Guard Database Purge Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-rose-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-3xl p-6 shadow-2xl max-w-md w-full border border-rose-500/20 bg-slate-900/90 text-white"
          >
            <div className="flex items-center space-x-3 text-rose-400 mb-3">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
              <h3 className="text-xl font-bold text-white italic">Critical Action: Database Purge</h3>
            </div>
            
            <p className="text-xs text-slate-300 mb-6 leading-relaxed font-semibold">
              This will clear <strong>ALL</strong> registered student records and team spin results. This action is destructive and irreversible.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-rose-300 uppercase tracking-widest mb-2">
                  Type <code className="bg-rose-500/20 text-rose-200 px-1.5 py-0.5 rounded-md font-black">RESET_ALL</code> to confirm
                </label>
                <input
                  type="text"
                  value={confirmString}
                  onChange={(e) => setConfirmString(e.target.value)}
                  placeholder="RESET_ALL"
                  className="block w-full px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-white text-sm focus:ring-2 focus:ring-rose-500 placeholder-rose-500/40"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    setConfirmString('');
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  disabled={resetting || confirmString !== 'RESET_ALL'}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider disabled:opacity-40 rounded-xl shadow-lg shadow-rose-600/20"
                >
                  {resetting ? 'Purging...' : 'Confirm Purge'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
