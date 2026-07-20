import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award } from 'lucide-react';
import StudentRegistration from './components/StudentRegistration';
import SpinWheel from './components/SpinWheel';
import ResultPage from './components/ResultPage';
import AdminLogin from './components/AdminLogin';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import TeamList from './components/TeamList';
import Reports from './components/Reports';
import SportsDetails from './components/SportsDetails';
import { Student, TeamColor, AdminUser } from './types';

type PageRoute = 'register' | 'spin' | 'result' | 'admin-login' | 'admin-dashboard';
type AdminTab = 'dashboard' | 'teamlist' | 'reports' | 'sports';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('register');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  
  // Transient student registration state
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);
  const [assignedTeam, setAssignedTeam] = useState<TeamColor | null>(null);

  // Administrative session states
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [appSettings, setAppSettings] = useState<any>(null);

  const fetchAppSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setAppSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  // Boot hydration: Restore previous admin session if active
  useEffect(() => {
    fetchAppSettings();
    const cachedToken = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('adminUser');
    
    if (cachedToken && cachedUser) {
      try {
        setAdminToken(cachedToken);
        setAdminUser(JSON.parse(cachedUser));
        setCurrentPage('admin-dashboard');
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  const handleAdminLogin = (token: string, user: AdminUser) => {
    setAdminToken(token);
    setAdminUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    setCurrentPage('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    setCurrentPage('register');
  };

  // State transitions router mapping
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 font-sans antialiased text-slate-100">
      <AnimatePresence mode="wait">
        
        {/* PAGE 1: STUDENT REGISTRATION */}
        {currentPage === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <StudentRegistration
              onRegisterSuccess={(student) => {
                setRegisteredStudent(student);
                setCurrentPage('spin');
              }}
              onNavigateToLogin={() => setCurrentPage('admin-login')}
            />
          </motion.div>
        )}

        {/* PAGE 2: SPIN WHEEL */}
        {currentPage === 'spin' && registeredStudent && (
          <motion.div
            key="spin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SpinWheel
              student={registeredStudent}
              onSpinComplete={(team) => {
                setAssignedTeam(team);
                // Update local model
                setRegisteredStudent(prev => prev ? { ...prev, team } : null);
                setCurrentPage('result');
              }}
            />
          </motion.div>
        )}

        {/* PAGE 3: CONGRATULATIONS RESULT PAGE */}
        {currentPage === 'result' && registeredStudent && assignedTeam && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ResultPage
              student={registeredStudent}
              assignedTeam={assignedTeam}
              onDone={() => {
                setRegisteredStudent(null);
                setAssignedTeam(null);
                setCurrentPage('register');
              }}
            />
          </motion.div>
        )}

        {/* PAGE 4: ADMIN SECURITY LOGIN */}
        {currentPage === 'admin-login' && (
          <motion.div
            key="admin-login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AdminLogin
              onLoginSuccess={handleAdminLogin}
              onNavigateToRegister={() => setCurrentPage('register')}
            />
          </motion.div>
        )}

        {/* PAGE 5: ADMIN PORTAL HUB */}
        {currentPage === 'admin-dashboard' && adminToken && (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-screen"
          >
            {/* Sidebar Navigation */}
            <Sidebar
              currentTab={adminTab}
              setTab={setAdminTab}
              adminUser={adminUser}
              onLogout={handleAdminLogout}
              onNavigateToRegister={() => setCurrentPage('register')}
              allowViewingTeamReports={appSettings?.allowViewingTeamReports !== false}
            />

            {/* Inner Route Panels */}
            {adminTab === 'dashboard' && (
              <AdminDashboard token={adminToken} onLogout={handleAdminLogout} onSettingsUpdated={fetchAppSettings} />
            )}
            
            {adminTab === 'teamlist' && (
              <TeamList token={adminToken} onLogout={handleAdminLogout} />
            )}

            {adminTab === 'sports' && (
              <SportsDetails token={adminToken} onLogout={handleAdminLogout} />
            )}

            {adminTab === 'reports' && (
              <Reports token={adminToken} onLogout={handleAdminLogout} />
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
