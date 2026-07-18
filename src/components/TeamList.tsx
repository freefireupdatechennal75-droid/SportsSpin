import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Download, Printer, Trash2, ShieldAlert,
  ChevronLeft, ChevronRight, Hash, User, Briefcase, Calendar, Phone, RefreshCw, Eye
} from 'lucide-react';
import { Student, TeamColor } from '../types';
import CollegeHeader from './CollegeHeader';

interface TeamListProps {
  token: string;
  onLogout: () => void;
}

export default function TeamList({ token, onLogout }: TeamListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete states
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View ID card state
  const [viewStudentIdCard, setViewStudentIdCard] = useState<Student | null>(null);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const departments = [
    'Computer Science (CSE)',
    'Electronics (ECE)',
    'Mechanical (MECH)',
    'Civil (CIVIL)',
    'Electrical (EEE)',
    'Fashion Technology (FT)'
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build dynamic query parameters for server filtering
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterTeam) params.append('team', filterTeam);
      if (filterDept) params.append('department', filterDept);
      if (filterYear) params.append('year', filterYear);

      const res = await fetch(`/api/students?${params.toString()}`);
      
      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || 'Failed to fetch students' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch students list');
      }
      setStudents(data.students);
      setCurrentPage(1); // Reset to first page on search/filter
    } catch (err: any) {
      setError(err.message || 'API link offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filterTeam, filterDept, filterYear]); // Fetch automatically when filter states change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDelete(studentId);
  };

  const executeDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/students/${studentToDelete}`, {
        method: 'DELETE',
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
        data = { error: text || 'Server returned an error' };
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        throw new Error(data.error || 'Failed to delete student');
      }

      setSuccess('✅ Student registration deleted successfully!');
      setStudentToDelete(null);
      fetchStudents();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Client-side export to Excel-compatible CSV format
  const handleExportCSV = () => {
    if (students.length === 0) {
      setError('No student records found to export!');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const headers = ['Register Number', 'Student Name', 'Department', 'Academic Year', 'Gender', 'Assigned Team', 'Registered At'];
    const csvRows = [headers.join(',')];

    students.forEach(s => {
      const row = [
        `"${s.registerNumber}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.department}"`,
        `"${s.year}"`,
        `"${s.gender}"`,
        `"${(s.team || 'PENDING').toUpperCase()}"`,
        `"${new Date(s.registeredAt).toLocaleString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `Sports_Day_Allocations_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // High-fidelity print command triggering browser print styles configured in index.css
  const handlePrint = () => {
    window.print();
  };

  // Pagination bounds calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

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
      
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/5 no-print">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Team Allocations Ledger</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Search, filter, paginate, audit, and export the official Sports team roll.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl shadow-2xl cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Excel Spreadsheets</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Action Box */}
      <div className="glass-card rounded-2xl p-5 mb-8 bg-white/5 border border-white/10 shadow-2xl no-print">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Keyword search */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or register number..."
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 glass-input text-white text-xs focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            />
          </div>

          {/* Team Filter */}
          <div className="md:col-span-2">
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="block w-full px-3 py-2.5 rounded-xl border border-white/10 glass-input text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">All Teams</option>
              <option value="blue" className="bg-slate-900 text-white">Blue Jaguars</option>
              <option value="red" className="bg-slate-900 text-white">Red Dragons</option>
              <option value="green" className="bg-slate-900 text-white">Green Vipers</option>
              <option value="yellow" className="bg-slate-900 text-white">Yellow Lions</option>
            </select>
          </div>

          {/* Dept Filter */}
          <div className="md:col-span-3">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="block w-full px-3 py-2.5 rounded-xl border border-white/10 glass-input text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="md:col-span-2 flex space-x-2">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-white/10 glass-input text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">All Years</option>
              {years.map(y => (
                <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
            >
              Find
            </button>
          </div>
        </form>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 p-4 rounded-xl text-xs font-bold no-print animate-pulse"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-rose-500/10 text-rose-300 border border-rose-500/20 p-4 rounded-xl text-xs font-bold no-print"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Student Records Print Area */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-white/5">
        
        {/* Printable Header */}
        <div className="print-only p-8 border-b border-slate-300">
          <h1 className="text-3xl font-black text-slate-900">Sports Allocations</h1>
          <p className="text-xs text-slate-500 mt-1">Official allocations audit sheet. Generated: {new Date().toLocaleString()}</p>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-3 text-xs text-slate-400 font-semibold">Updating database query...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs font-semibold">
            No matching student registration entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Profile</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Register ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Team</th>
                  <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest no-print">Action</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/5 text-xs">
                {currentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-md shadow-indigo-600/20">
                          {student.name[0]}
                        </div>
                        <span className="font-semibold text-white">{student.name}</span>
                      </div>
                    </td>

                    {/* Reg ID */}
                    <td className="px-6 py-4.5 whitespace-nowrap font-mono font-semibold text-slate-400">
                      {student.registerNumber}
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-slate-300">
                      {student.department}
                    </td>

                    {/* Academic Year */}
                    <td className="px-6 py-4.5 whitespace-nowrap font-medium text-slate-400">
                      {student.year}
                    </td>

                    {/* Gender */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="text-slate-300 font-semibold uppercase tracking-wider">{student.gender}</div>
                    </td>

                    {/* Assigned Team */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {student.team ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${teamBadges[student.team]}`}>
                          {student.team}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-400 border border-white/10">
                          PENDING SPIN
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center no-print">
                      {student.idCardPhoto ? (
                        <button
                          onClick={() => setViewStudentIdCard(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer mr-2"
                          title="View Scanned College ID"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-slate-600 inline-block mr-2" title="No ID Card attached">
                          <Eye className="w-4.5 h-4.5 opacity-30" />
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete registration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginated Footer Controls */}
        {!loading && totalPages > 1 && (
          <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-white/5 no-print">
            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-200">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(indexOfLastItem, students.length)}</span> of <span className="font-semibold text-slate-200">{students.length}</span> entries
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-white/10 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center text-xs font-bold text-slate-300 px-3">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-white/10 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal for Deletion */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-6 shadow-2xl max-w-md w-full border border-white/10 bg-slate-900/95 text-white"
            >
              <div className="flex items-center space-x-3 text-rose-400 mb-4">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
                <h3 className="text-xl font-bold italic">Confirm Registration Deletion</h3>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-semibold uppercase tracking-wide">
                Are you sure you want to delete this student registration? This will clear their allocated team assignment and free up general capacity. This action is irreversible.
              </p>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Student Profile</div>
                {(() => {
                  const s = students.find(x => x.id === studentToDelete);
                  if (!s) return null;
                  return (
                    <div className="mt-2 space-y-1">
                      <div className="text-sm font-bold text-white">{s.name}</div>
                      <div className="text-xs font-mono text-slate-400">{s.registerNumber} &bull; {s.department}</div>
                      {s.team && (
                        <div className="mt-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${teamBadges[s.team as keyof typeof teamBadges] || ''}`}>
                            {s.team}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setStudentToDelete(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={executeDeleteStudent}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors text-center uppercase tracking-wider shadow-lg shadow-rose-600/20"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {viewStudentIdCard && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-white/10 bg-slate-900/95 text-white relative overflow-hidden"
            >
              {/* Glow accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <User className="w-5 h-5" />
                  <h3 className="text-lg font-bold italic">Scanned College ID Card</h3>
                </div>
                <button
                  onClick={() => setViewStudentIdCard(null)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ID Photo */}
                <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center aspect-video md:aspect-square relative group">
                  {viewStudentIdCard.idCardPhoto ? (
                    <img
                      src={viewStudentIdCard.idCardPhoto}
                      alt="Student College ID"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-slate-500">No Image Preview Available</div>
                  )}
                  <div className="absolute top-2 left-2 bg-indigo-600/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-400/20">
                    Scanned OCR Photo
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</span>
                      <div className="text-sm font-bold text-white mt-0.5">{viewStudentIdCard.name}</div>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Register Number</span>
                      <div className="text-xs font-mono font-bold text-indigo-300 mt-0.5">{viewStudentIdCard.registerNumber}</div>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Department & Year</span>
                      <div className="text-xs font-semibold text-slate-300 mt-0.5">{viewStudentIdCard.department} ({viewStudentIdCard.year})</div>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gender</span>
                      <div className="text-xs font-semibold text-slate-300 mt-0.5">{viewStudentIdCard.gender}</div>
                    </div>
                    {viewStudentIdCard.phone && (
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Contact Phone</span>
                        <div className="text-xs font-semibold text-slate-300 mt-0.5">{viewStudentIdCard.phone}</div>
                      </div>
                    )}
                    {viewStudentIdCard.sports && viewStudentIdCard.sports.length > 0 && (
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selected Sports</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {viewStudentIdCard.sports.map(sport => (
                            <span key={sport} className="px-2 py-0.5 bg-white/5 text-[9px] text-slate-300 border border-white/5 rounded-md font-medium">
                              {sport}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Allocated Team</span>
                    {viewStudentIdCard.team ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${teamBadges[viewStudentIdCard.team as keyof typeof teamBadges] || ''}`}>
                        {viewStudentIdCard.team}
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-400 border border-white/10">
                        PENDING SPIN
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
