import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Download, Printer, RefreshCw, Trophy,
  Users, ChevronLeft, ChevronRight, Hash, User, Briefcase, Calendar, Dribbble
} from 'lucide-react';
import { Student } from '../types';
import CollegeHeader from './CollegeHeader';

interface SportsDetailsProps {
  token: string;
  onLogout: () => void;
}

export default function SportsDetails({ token, onLogout }: SportsDetailsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSport, setActiveSport] = useState<string>('All');
  
  // Filtering and Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sportsList = ['Cricket', 'Volleyball', 'Throwball', 'Running', 'Football'];

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
      
      const res = await fetch('/api/students');
      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Non-JSON response received');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch student sports data');
      }
      setStudents(data.students);
    } catch (err: any) {
      setError(err.message || 'Error loading sports details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students by active sport and filters
  const getFilteredStudents = () => {
    return students.filter(student => {
      // 1. Sport filter
      if (activeSport !== 'All') {
        const studentSports = student.sports || [];
        if (!studentSports.includes(activeSport)) return false;
      }

      // 2. Search term (name or register number)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(search);
        const matchesReg = student.registerNumber.toLowerCase().includes(search);
        if (!matchesName && !matchesReg) return false;
      }

      // 3. Team filter
      if (filterTeam && student.team !== filterTeam) return false;

      // 4. Department filter
      if (filterDept && student.department !== filterDept) return false;

      // 5. Year filter
      if (filterYear && student.year !== filterYear) return false;

      return true;
    });
  };

  const filteredStudents = getFilteredStudents();

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Compute stats for sports
  const getSportStats = () => {
    const stats: { [sport: string]: number } = {};
    sportsList.forEach(s => {
      stats[s] = 0;
    });

    students.forEach(student => {
      const studentSports = student.sports || [];
      studentSports.forEach(s => {
        if (stats[s] !== undefined) {
          stats[s]++;
        }
      });
    });

    return stats;
  };

  const sportStats = getSportStats();

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('No student records found to export!');
      return;
    }

    const csvRows = [
      ['COLLEGE SPORTS - SPORTS REGISTRATION EXPORT'],
      ['Sport Context:', activeSport],
      ['Generated Date:', new Date().toLocaleString()],
      ['Total Records:', filteredStudents.length],
      [''],
      ['ID', 'Name', 'Register Number', 'Department', 'Year', 'Gender', 'Assigned Team', 'Registered Sports']
    ];

    filteredStudents.forEach((student, idx) => {
      csvRows.push([
        (idx + 1).toString(),
        student.name,
        student.registerNumber,
        student.department,
        student.year,
        student.gender,
        student.team ? student.team.toUpperCase() : 'PENDING',
        `"${(student.sports || []).join(', ')}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.map(row => row.join(',')).join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `Sports_Day_${activeSport}_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const teamColors = {
    blue: 'border-blue-500/20 text-blue-300 bg-blue-500/10 hover:bg-blue-500/15',
    red: 'border-red-500/20 text-red-300 bg-red-500/10 hover:bg-red-500/15',
    green: 'border-green-500/20 text-green-300 bg-green-500/10 hover:bg-green-500/15',
    yellow: 'border-yellow-500/20 text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/15'
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-8 h-screen">
      
      {/* College Logo Banner */}
      <div className="w-full mb-6 no-print">
        <CollegeHeader />
      </div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/5 no-print">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Sports Details</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Display register student details per sport
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={fetchStudents}
            className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Refresh registrations list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Sports CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-500/10 text-rose-300 border border-rose-500/20 p-4 rounded-xl text-xs font-bold no-print">
          {error}
        </div>
      )}

      {/* Sports Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {sportsList.map((sport) => {
          const count = sportStats[sport] || 0;
          const isActive = activeSport === sport;
          return (
            <div
              key={sport}
              onClick={() => {
                setActiveSport(sport);
                setCurrentPage(1);
              }}
              className={`glass-card p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-indigo-500/10'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{sport}</span>
                <Trophy className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              </div>
              <h4 className="text-2xl font-black text-white mt-2 font-mono">{count}</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Registrations</p>
            </div>
          );
        })}
      </div>

      {/* Sport Selector Tabs */}
      <div className="flex flex-wrap gap-2.5 mb-6 border-b border-white/5 pb-4">
        <button
          onClick={() => {
            setActiveSport('All');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
            activeSport === 'All'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          All Sports ({students.length})
        </button>
        {sportsList.map((sport) => {
          const count = sportStats[sport] || 0;
          return (
            <button
              key={sport}
              onClick={() => {
                setActiveSport(sport);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
                activeSport === sport
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {sport} ({count})
            </button>
          );
        })}
      </div>

      {/* Advanced Filters Block */}
      <div className="glass-card rounded-2xl p-5 mb-8 border border-white/10 shadow-2xl bg-white/5">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          
          {/* Search box */}
          <div className="flex-1 w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search student name or register number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 glass-input text-white text-xs focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            />
          </div>

          {/* Team filter */}
          <div className="w-full md:w-44">
            <select
              value={filterTeam}
              onChange={(e) => {
                setFilterTeam(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-4 py-2.5 rounded-xl border border-white/10 glass-input text-white text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Teams</option>
              <option value="blue">Blue Jaguars</option>
              <option value="red">Red Dragons</option>
              <option value="green">Green Vipers</option>
              <option value="yellow">Yellow Lions</option>
            </select>
          </div>

          {/* Dept filter */}
          <div className="w-full md:w-52">
            <select
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-4 py-2.5 rounded-xl border border-white/10 glass-input text-white text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Year filter */}
          <div className="w-full md:w-40">
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-4 py-2.5 rounded-xl border border-white/10 glass-input text-white text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Years</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 mb-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Loading lists...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 text-slate-500 mx-auto opacity-40 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching students found</p>
              <p className="text-[10px] text-slate-500 mt-1">Try adjusting search query or filters.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/50 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">Student</th>
                  <th className="py-4 px-6 font-bold">Register Number</th>
                  <th className="py-4 px-6 font-bold">Department</th>
                  <th className="py-4 px-6 font-bold">Year</th>
                  <th className="py-4 px-6 font-bold">Gender</th>
                  <th className="py-4 px-6 font-bold">Registered Sports</th>
                  <th className="py-4 px-6 font-bold">Assigned Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                {currentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-md shadow-indigo-600/10">
                          {student.name[0]}
                        </div>
                        <span className="font-bold text-white text-sm">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">{student.registerNumber}</td>
                    <td className="py-4 px-6 text-slate-400">{student.department}</td>
                    <td className="py-4 px-6 text-slate-400">{student.year}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        student.gender === 'Female' ? 'bg-pink-500/10 text-pink-300' : 'bg-blue-500/10 text-blue-300'
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {(student.sports || []).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {student.team ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${teamColors[student.team]}`}>
                          {student.team}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-400 border border-white/10 tracking-wider">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredStudents.length > 0 && !loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 no-print">
          <p className="text-xs text-slate-400 font-medium">
            Showing <span className="text-white font-bold">{indexOfFirstItem + 1}</span> to{' '}
            <span className="text-white font-bold">{Math.min(indexOfLastItem, filteredStudents.length)}</span> of{' '}
            <span className="text-white font-bold">{filteredStudents.length}</span> students registered
          </p>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`w-8.5 h-8.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  currentPage === number
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
