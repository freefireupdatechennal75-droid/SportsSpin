import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Student, AppSettings, ActivityLog, TeamDetail, TeamColor } from './src/types';

interface DatabaseSchema {
  admins: {
    username: string;
    passwordHash: string;
    name: string;
  }[];
  students: Student[];
  settings: AppSettings;
  activityLogs: ActivityLog[];
  teams: Record<TeamColor, TeamDetail>;
}

const DB_PATH = path.join(process.cwd(), 'db.json');

const DEFAULT_TEAMS: Record<TeamColor, TeamDetail> = {
  blue: {
    id: 'blue',
    name: 'Blue Jaguars',
    captainName: 'Aakash',
    captainImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    description: 'The fierce Jaguars known for speed, strategy, and sportsmanship on the field.',
    benefits: [
      'Official Blue Team Jersey',
      'Access to Specialized Sports Kit',
      'Daily High-Protein Snacks & Refreshments',
      'Dedicated Athletic Coach & Training Sessions',
      'Annual Gym Membership Subsidy'
    ]
  },
  red: {
    id: 'red',
    name: 'Red Dragons',
    captainName: 'Bhavana',
    captainImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    description: 'The fiery Red Dragons, a team built on passion, determination, and raw strength.',
    benefits: [
      'Official Red Team Jersey',
      'Custom Sports Kits & Accessories',
      'Complimentary Food & Hydration Drinks',
      'Elite Football & Basketball Coach Training',
      'Specialized Fitness & Cardio Workshops'
    ]
  },
  green: {
    id: 'green',
    name: 'Green Vipers',
    captainName: 'Charan',
    captainImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    description: 'The agile Green Vipers, utilizing stealth, speed, and continuous teamwork to secure victory.',
    benefits: [
      'Official Green Team Jersey',
      'High-Performance Sports Gears',
      'Premium Nutritious Meal Packs',
      'Volleyball & KHO-KHO Coaching Sessions',
      'Yoga & Flexibility Training Passes'
    ]
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow Lions',
    captainName: 'Dinesh',
    captainImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
    description: 'The majestic Yellow Lions, reigning with pride, teamwork, and unmatched spirit.',
    benefits: [
      'Official Yellow Team Jersey',
      'Premium Athletic Footwear & Gears',
      'Unlimited Energy Drinks & Fruits',
      'Chess & Badminton Tactical Coaches',
      'Physiotherapy & Recovery Session Vouchers'
    ]
  }
};

// Initialize Database with Default Seed Data
function initDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      let fileUpdated = false;

      // Migrate existing DB if teams property is missing
      if (!parsed.teams) {
        parsed.teams = DEFAULT_TEAMS;
        fileUpdated = true;
      } else {
        for (const col of ['blue', 'red', 'green', 'yellow'] as TeamColor[]) {
          if (parsed.teams[col] && !parsed.teams[col].captainImage) {
            parsed.teams[col].captainImage = DEFAULT_TEAMS[col].captainImage;
            fileUpdated = true;
          }
        }
      }

      // Migrate settings with new fields if missing
      if (parsed.settings) {
        if (parsed.settings.collegeName === undefined) {
          parsed.settings.collegeName = 'Angel College of Engineering and Technology';
          fileUpdated = true;
        }
        if (parsed.settings.collegeLogoUrl === undefined) {
          parsed.settings.collegeLogoUrl = '/angel-logo.jpg';
          fileUpdated = true;
        }
        if (parsed.settings.showCaptainDetails === undefined) {
          parsed.settings.showCaptainDetails = true;
          fileUpdated = true;
        }
        if (parsed.settings.allowViewingTeamReports === undefined) {
          parsed.settings.allowViewingTeamReports = true;
          fileUpdated = true;
        }
        if (parsed.settings.enrollmentDeadline === undefined) {
          // Set default deadline to 2 days from now formatted as yyyy-MM-ddTHH:mm
          const defaultDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
          const offset = defaultDate.getTimezoneOffset() * 60000;
          const localISO = new Date(defaultDate.getTime() - offset).toISOString().slice(0, 16);
          parsed.settings.enrollmentDeadline = localISO;
          fileUpdated = true;
        }
        if (parsed.settings.enableTimeLimit === undefined) {
          parsed.settings.enableTimeLimit = false;
          fileUpdated = true;
        }
      } else {
        const defaultDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const offset = defaultDate.getTimezoneOffset() * 60000;
        const localISO = new Date(defaultDate.getTime() - offset).toISOString().slice(0, 16);
        parsed.settings = {
          totalCapacity: 200,
          title: 'Sports',
          collegeName: 'Angel College of Engineering and Technology',
          collegeLogoUrl: '/angel-logo.jpg',
          showCaptainDetails: true,
          allowViewingTeamReports: true,
          enrollmentDeadline: localISO,
          enableTimeLimit: false
        };
        fileUpdated = true;
      }

      if (fileUpdated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf8');
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file, resetting to defaults:', err);
  }

  // Default seed
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Angel123', salt);

  const defaultDb: DatabaseSchema = {
    admins: [
      {
        username: 'Angel',
        passwordHash,
        name: 'Sports Admin'
      }
    ],
    students: [],
    settings: {
      totalCapacity: 200,
      title: 'Sports',
      collegeName: 'Angel College of Engineering and Technology',
      collegeLogoUrl: '/angel-logo.jpg',
      showCaptainDetails: true,
      allowViewingTeamReports: true,
      enrollmentDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      enableTimeLimit: false
    },
    activityLogs: [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        user: 'System',
        action: 'Database Initialized',
        details: 'Default sports configuration and admin account seeded successfully.'
      }
    ],
    teams: DEFAULT_TEAMS
  };

  saveDb(defaultDb);
  return defaultDb;
}

let dbCache: DatabaseSchema = initDatabase();

function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    dbCache = data;
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export const dbService = {
  // Admins
  getAdmins() {
    return dbCache.admins;
  },

  getAdminByUsername(username: string) {
    return dbCache.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
  },

  // Students
  getStudents() {
    return dbCache.students;
  },

  getStudentById(id: string) {
    return dbCache.students.find(s => s.id === id);
  },

  getStudentByRegisterNumber(regNum: string) {
    return dbCache.students.find(s => s.registerNumber.trim().toUpperCase() === regNum.trim().toUpperCase());
  },

  addStudent(student: Student) {
    const db = dbCache;
    db.students.push(student);
    saveDb(db);
    this.addLog('System', 'Student Registered', `Registered student ${student.name} (${student.registerNumber})`);
    return student;
  },

  updateStudent(id: string, updates: Partial<Student>) {
    const db = dbCache;
    const index = db.students.findIndex(s => s.id === id);
    if (index !== -1) {
      db.students[index] = { ...db.students[index], ...updates };
      saveDb(db);
      this.addLog('System', 'Student Updated', `Updated registration details for student ID: ${id}`);
      return db.students[index];
    }
    return null;
  },

  deleteStudent(id: string) {
    const db = dbCache;
    const index = db.students.findIndex(s => s.id === id);
    if (index !== -1) {
      const student = db.students[index];
      db.students.splice(index, 1);
      saveDb(db);
      this.addLog('Admin', 'Student Deleted', `Deleted student record: ${student.name} (${student.registerNumber})`);
      return true;
    }
    return false;
  },

  // Settings
  getSettings() {
    return dbCache.settings;
  },

  updateSettings(updates: Partial<AppSettings>, adminUser: string) {
    const db = dbCache;
    db.settings = { ...db.settings, ...updates };
    saveDb(db);
    this.addLog(adminUser, 'Settings Changed', `Updated app settings. Total capacity: ${db.settings.totalCapacity}`);
    return db.settings;
  },

  // Activity Logs
  getLogs() {
    return dbCache.activityLogs;
  },

  addLog(user: string, action: string, details: string) {
    const db = dbCache;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      details
    };
    db.activityLogs.unshift(newLog); // latest log first
    if (db.activityLogs.length > 500) {
      db.activityLogs.pop(); // keep log size bounded
    }
    saveDb(db);
    return newLog;
  },

  // Reset Database (for admin troubleshooting/restart)
  resetDatabase(adminUser: string) {
    const db = dbCache;
    db.students = [];
    db.activityLogs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: adminUser,
        action: 'Database Reset',
        details: 'All student allocations and registrations have been cleared.'
      }
    ];
    saveDb(db);
    return true;
  },

  // Teams
  getTeams() {
    return dbCache.teams || DEFAULT_TEAMS;
  },

  updateTeam(id: TeamColor, updates: Partial<TeamDetail>, adminUser: string) {
    const db = dbCache;
    if (!db.teams) {
      db.teams = { ...DEFAULT_TEAMS };
    }
    if (db.teams[id]) {
      db.teams[id] = { ...db.teams[id], ...updates };
      saveDb(db);
      this.addLog(adminUser, 'Team Updated', `Updated details for ${id.toUpperCase()} team.`);
      return db.teams[id];
    }
    return null;
  }
};
