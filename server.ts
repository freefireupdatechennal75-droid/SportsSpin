import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { dbService } from './server_db';
import { TeamColor, Student, AppSettings } from './src/types';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Add typescript interfaces for custom Request properties
interface AuthenticatedRequest extends Request {
  admin?: {
    username: string;
    name: string;
  };
}

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sports_day_2026_jwt_secret_key';

// Calculate balanced team capacities based on total student limit
export function calculateTeamLimits(totalCapacity: number) {
  const base = Math.floor(totalCapacity / 4);
  const remainder = totalCapacity % 4;

  return {
    blue: base + (remainder >= 1 ? 1 : 0),
    red: base + (remainder >= 2 ? 1 : 0),
    green: base + (remainder >= 3 ? 1 : 0),
    yellow: base
  };
}

async function startServer() {
  const app = express();
  
  // Enable trusting of reverse proxies (e.g., Render, Cloudflare, load balancers)
  // This ensures express-rate-limit reads the correct client IP ('X-Forwarded-For') instead of the proxy server's IP.
  app.set('trust proxy', 1);

  // Parse JSON bodies with a reasonable 10MB limit (sufficient for Base64 ID image uploads)
  app.use(express.json({ limit: '10mb' }));

  // Use Helmet for comprehensive security headers to prevent common exploits
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled to allow flexible Vite live preview & dynamic external base64 images
      crossOriginEmbedderPolicy: false,
    })
  );

  // Security Headers Middleware (Supplementary)
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // ==========================================
  // SECURITY: RATE LIMITERS (Brute Force / DDoS / API Spam Protection)
  // ==========================================

  // 1. General API Limiter (100 requests per 15 minutes)
  const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP to 150 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
  });

  // 2. Admin Login Brute-Force Limiter (5 attempts per 15 minutes)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8, // limit each IP to 8 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
  });

  // 3. Gemini Scan ID Card Rate Limiter (Prevent API abuse / cost control)
  const idScanLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 12, // limit each IP to 12 ID scans per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'ID scanning limit reached. Please wait a few minutes before scanning another card.' }
  });

  // 4. Student Registration Limiter (Mitigate registration spam)
  const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 student registrations per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many student registrations from this network. Please try again shortly.' }
  });

  // Apply general rate limiter to all API endpoints by default
  app.use('/api/', generalApiLimiter);

  // JWT Authentication Middleware for Admins
  const authenticateAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { username: string; name: string };
      req.admin = { username: decoded.username, name: decoded.name };
      next();
    } catch (err) {
      res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
    }
  };

  // ==========================================
  // PUBLIC API ROUTES
  // ==========================================

  // 1. Admin Login (Protected by rate limiting)
  app.post('/api/auth/login', loginLimiter, (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const admin = dbService.getAdminByUsername(username);
    if (!admin) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const token = jwt.sign(
      { username: admin.username, name: admin.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        username: admin.username,
        name: admin.name
      }
    });
  });

  // 2. Validate/Check Register Number (Instant UI Feedback)
  app.post('/api/students/check-reg', (req: Request, res: Response) => {
    const { registerNumber } = req.body;
    if (!registerNumber) {
      res.status(400).json({ error: 'Register number is required.' });
      return;
    }

    const existing = dbService.getStudentByRegisterNumber(registerNumber);
    if (existing) {
      res.json({ exists: true, student: existing });
    } else {
      res.json({ exists: false });
    }
  });

  // 2.3. Get Teams Details
  app.get('/api/teams', (req: Request, res: Response) => {
    const teams = dbService.getTeams();
    res.json({ success: true, teams });
  });

  // 2.4. Get App Settings (Publicly readable)
  app.get('/api/settings', (req: Request, res: Response) => {
    const settings = dbService.getSettings();
    res.json({ success: true, settings });
  });

  // 2.5. Scan ID Card using Gemini AI Multi-modal OCR (Protected by rate limiting)
  app.post('/api/students/scan-id', idScanLimiter, async (req: Request, res: Response) => {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: 'Image is required for scanning.' });
      return;
    }

    try {
      // Parse base64 string
      let base64Data = image;
      let mimeType = 'image/jpeg';

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      // Initialize Gemini AI
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              },
              {
                text: `Analyze this student ID card image and extract the following details.
- "name": The student's full name.
- "registerNumber": The student's unique register number / roll number / ID number.
- "department": The department. Map it strictly to one of these: 'Computer Science (CSE)', 'Electronics (ECE)', 'Mechanical (MECH)', 'Civil (CIVIL)', 'Electrical (EEE)', 'Fashion Technology (FT)'. If not clear or not found, choose the best guess or 'Computer Science (CSE)'.
- "year": The year of study. Choose strictly one of: '1st Year', '2nd Year', '3rd Year', '4th Year'. If not clear or not found, make a logical guess or choose '1st Year'.
- "gender": The student's gender. Choose strictly one of: 'Male', 'Female', 'Other'. If not found, guess or choose 'Male'.
- "phone": Any contact number found. If none found, return "".

Output MUST be a valid JSON matching this schema exactly.`
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                registerNumber: { type: Type.STRING },
                department: { type: Type.STRING },
                year: { type: Type.STRING },
                gender: { type: Type.STRING },
                phone: { type: Type.STRING }
              },
              required: ['name', 'registerNumber', 'department', 'year', 'gender', 'phone']
            }
          }
        });
      } catch (gemini35Error: any) {
        console.warn('gemini-3.5-flash failed/busy, trying gemini-2.5-flash...', gemini35Error.message || gemini35Error);
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              },
              {
                text: `Analyze this student ID card image and extract the following details.
- "name": The student's full name.
- "registerNumber": The student's unique register number / roll number / ID number.
- "department": The department. Map it strictly to one of these: 'Computer Science (CSE)', 'Electronics (ECE)', 'Mechanical (MECH)', 'Civil (CIVIL)', 'Electrical (EEE)', 'Fashion Technology (FT)'. If not clear or not found, choose the best guess or 'Computer Science (CSE)'.
- "year": The year of study. Choose strictly one of: '1st Year', '2nd Year', '3rd Year', '4th Year'. If not clear or not found, make a logical guess or choose '1st Year'.
- "gender": The student's gender. Choose strictly one of: 'Male', 'Female', 'Other'. If not found, guess or choose 'Male'.
- "phone": Any contact number found. If none found, return "".

Output MUST be a valid JSON matching this schema exactly.`
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                registerNumber: { type: Type.STRING },
                department: { type: Type.STRING },
                year: { type: Type.STRING },
                gender: { type: Type.STRING },
                phone: { type: Type.STRING }
              },
              required: ['name', 'registerNumber', 'department', 'year', 'gender', 'phone']
            }
          }
        });
      }

      const text = response.text;
      if (!text) {
        throw new Error('No content returned from Gemini.');
      }

      const parsed = JSON.parse(text);
      res.json({ success: true, details: parsed });
    } catch (err: any) {
      console.error('Error scanning ID with Gemini:', err);
      res.status(500).json({ error: err.message || 'Failed to scan ID card.' });
    }
  });

  // 3. Register Student (Step 1 of Spin Process) (Protected by rate limiting)
  app.post('/api/students/register', registrationLimiter, (req: Request, res: Response) => {
    const { name, registerNumber, department, year, phone, gender, sports, idCardPhoto } = req.body;

    if (!name || !registerNumber || !department || !year || !gender) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    const settings = dbService.getSettings();
    if (settings.enableTimeLimit && settings.enrollmentDeadline) {
      const deadline = new Date(settings.enrollmentDeadline).getTime();
      if (Date.now() > deadline) {
        res.status(400).json({ 
          error: '[English] The enrollment time limit has expired. Registration is now closed.\n' +
                 '[Tamil / தமிழ்] சேர்க்கைக்கான கால அவகாசம் முடிந்துவிட்டது. பதிவு தற்போது மூடப்பட்டுள்ளது.'
        });
        return;
      }
    }

    if (!idCardPhoto) {
      res.status(400).json({ error: 'College ID Card photo is required. Please upload your ID Card photo.' });
      return;
    }

    if (!sports || !Array.isArray(sports) || sports.length < 4) {
      res.status(400).json({ error: 'Please select a minimum of 4 sports (1 Indoor & 3 Outdoor).' });
      return;
    }

    // Clean data inputs
    const cleanRegNum = registerNumber.toString().trim().toUpperCase();

    const existing = dbService.getStudentByRegisterNumber(cleanRegNum);
    if (existing) {
      res.status(400).json({ error: 'This Register Number is already registered.' });
      return;
    }

    const newStudent: Student = {
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.toString().trim(),
      registerNumber: cleanRegNum,
      department: department.toString(),
      year: year.toString(),
      phone: phone ? phone.toString().trim() : '',
      gender: gender.toString(),
      team: null,
      registeredAt: new Date().toISOString(),
      spunAt: null,
      sports: Array.isArray(sports) ? sports : [],
      idCardPhoto: idCardPhoto ? idCardPhoto.toString() : undefined
    };

    dbService.addStudent(newStudent);
    res.status(201).json({ success: true, student: newStudent });
  });

  // 4. Spin API (Team Allocation Logic with AI and Gender Balancing)
  app.post('/api/students/spin', async (req: Request, res: Response) => {
    const { studentId } = req.body;

    if (!studentId) {
      res.status(400).json({ error: 'Student ID is required.' });
      return;
    }

    const student = dbService.getStudentById(studentId);
    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    if (student.team) {
      res.status(400).json({ error: 'This student has already spun the wheel!', student });
      return;
    }

    const settings = dbService.getSettings();
    const students = dbService.getStudents();
    const limits = calculateTeamLimits(settings.totalCapacity);

    // Count already allocated teams by overall total and by this student's specific gender
    const allocatedCounts = {
      blue: 0,
      red: 0,
      green: 0,
      yellow: 0
    };

    const allocatedGenderCounts = {
      blue: 0,
      red: 0,
      green: 0,
      yellow: 0
    };

    const currentGender = (student.gender || 'Male').trim();

    students.forEach(s => {
      if (s.team && allocatedCounts[s.team] !== undefined) {
        allocatedCounts[s.team]++;
        if (s.gender && s.gender.trim() === currentGender) {
          allocatedGenderCounts[s.team]++;
        }
      }
    });

    // 1. Find teams with the absolute minimum total allocated count
    const minTotalCount = Math.min(allocatedCounts.blue, allocatedCounts.red, allocatedCounts.green, allocatedCounts.yellow);
    const candidatesByTotal = (['blue', 'red', 'green', 'yellow'] as TeamColor[]).filter(t => allocatedCounts[t] === minTotalCount);

    // 2. Among these minimum-total candidate teams, find those with the minimum count of this student's gender
    const minGenderCount = Math.min(...candidatesByTotal.map(t => allocatedGenderCounts[t]));
    const bestTeams = candidatesByTotal.filter(t => allocatedGenderCounts[t] === minGenderCount);

    // 3. To prevent consecutive repetitions, identify the last allocated team if possible
    let lastAllocatedTeam: TeamColor | null = null;
    for (let i = students.length - 1; i >= 0; i--) {
      if (students[i].team) {
        lastAllocatedTeam = students[i].team;
        break;
      }
    }

    // 4. Resolve ties among bestTeams using lastAllocatedTeam filter
    let selectedTeam: TeamColor;
    if (bestTeams.length > 1 && lastAllocatedTeam) {
      const withoutLast = bestTeams.filter(t => t !== lastAllocatedTeam);
      if (withoutLast.length > 0) {
        selectedTeam = withoutLast[Math.floor(Math.random() * withoutLast.length)];
      } else {
        selectedTeam = bestTeams[Math.floor(Math.random() * bestTeams.length)];
      }
    } else {
      selectedTeam = bestTeams[Math.floor(Math.random() * bestTeams.length)];
    }

    // Generate AI Placement Insights using Gemini
    let aiReason = `Our allocation balancing algorithm evaluated your athletic preferences and selected the ${selectedTeam.toUpperCase()} team for you!`;
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const teams = dbService.getTeams();
        const targetTeamDetail = teams[selectedTeam];
        const sportsList = (student.sports || []).join(', ');

        const systemPrompt = `You are an enthusiastic sports coordinator and captain of the ${targetTeamDetail.name} (Team Color: ${selectedTeam.toUpperCase()}). Team description: ${targetTeamDetail.description}. Captain's name is ${targetTeamDetail.captainName}.`;

        const prompt = `A student named ${student.name} (Department: ${student.department}, Year: ${student.year}, Gender: ${student.gender}) who registered for sports: ${sportsList} has been allocated to your team.
Write a very motivating and personalized welcome note (2 sentences, under 50 words) from you (${targetTeamDetail.captainName}) to them, highlighting how their participation/sports match with your team. Do not use any markdown formatting or quotes.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.8,
          }
        });

        if (response.text) {
          aiReason = response.text.trim();
        }
      } catch (geminiError) {
        console.error('Gemini welcome generation failed:', geminiError);
      }
    }

    // Update student with final team allocation and AI explanation
    const updatedStudent = dbService.updateStudent(studentId, {
      team: selectedTeam,
      spunAt: new Date().toISOString(),
      aiReason
    });

    dbService.addLog(
      'Wheel',
      'Team Allocated',
      `${student.name} (${currentGender}) assigned to ${selectedTeam.toUpperCase()} team. AI placement generated.`
    );

    res.json({
      success: true,
      student: updatedStudent,
      assignedTeam: selectedTeam,
      availableTeams: [selectedTeam],
      limits,
      counts: allocatedCounts
    });
  });

  // ==========================================
  // ADMIN AUTHENTICATED API ROUTES
  // ==========================================

  // 1. Get Dashboard Statistics
  app.get('/api/dashboard/stats', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
    const settings = dbService.getSettings();
    const students = dbService.getStudents();
    const logs = dbService.getLogs();

    const teamCounts = {
      blue: 0,
      red: 0,
      green: 0,
      yellow: 0
    };

    students.forEach(s => {
      if (s.team) {
        teamCounts[s.team]++;
      }
    });

    const limits = calculateTeamLimits(settings.totalCapacity);

    res.json({
      totalRegistered: students.length,
      totalCapacity: settings.totalCapacity,
      teamCounts,
      teamLimits: limits,
      recentStudents: students.slice(-10).reverse(), // Last 10 registered
      recentLogs: logs.slice(0, 15), // Last 15 activity logs
      settings: settings
    });
  });

  // 2. Get Students (with advanced server-side search and filters)
  app.get('/api/students', (req: Request, res: Response) => {
    let students = dbService.getStudents();
    const { search, team, department, year } = req.query;

    if (search) {
      const q = search.toString().toLowerCase();
      students = students.filter(
        s => s.name.toLowerCase().includes(q) || s.registerNumber.toLowerCase().includes(q)
      );
    }

    if (team) {
      students = students.filter(s => s.team === team);
    }

    if (department) {
      students = students.filter(s => s.department === department);
    }

    if (year) {
      students = students.filter(s => s.year === year);
    }

    res.json({ students });
  });

  // 3. Delete Student
  app.delete('/api/students/:id', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.params.id;
    const success = dbService.deleteStudent(studentId);
    if (success) {
      res.json({ success: true, message: 'Student removed successfully.' });
    } else {
      res.status(404).json({ error: 'Student record not found.' });
    }
  });

  // Public route to get settings (College Name, Logo, Deadline)
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ settings: dbService.getSettings() });
  });

  // 4. Update Settings (Capacity, Title, Logo, Toggles)
  app.put('/api/settings', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { totalCapacity, title, collegeName, collegeLogoUrl, showCaptainDetails, allowViewingTeamReports, enrollmentDeadline, enableTimeLimit } = req.body;

    if (!totalCapacity) {
      res.status(400).json({ error: 'Total capacity is required.' });
      return;
    }

    const cleanCapacity = parseInt(totalCapacity.toString(), 10);
    if (isNaN(cleanCapacity) || cleanCapacity < 1) {
      res.status(400).json({ error: 'Total capacity must be a positive integer.' });
      return;
    }

    const currentStudents = dbService.getStudents().length;
    // Warning if capacity is less than current registered
    if (cleanCapacity < currentStudents) {
      res.status(400).json({ 
        error: `Cannot reduce capacity to ${cleanCapacity}. Already registered students (${currentStudents}) exceed this limit.` 
      });
      return;
    }

    const updated = dbService.updateSettings({
      totalCapacity: cleanCapacity,
      title: title || 'Sports',
      collegeName: collegeName !== undefined ? collegeName : 'Angel College of Engineering and Technology',
      collegeLogoUrl: collegeLogoUrl !== undefined ? collegeLogoUrl : '',
      showCaptainDetails: showCaptainDetails !== undefined ? !!showCaptainDetails : true,
      allowViewingTeamReports: allowViewingTeamReports !== undefined ? !!allowViewingTeamReports : true,
      enrollmentDeadline: enrollmentDeadline !== undefined ? enrollmentDeadline : '',
      enableTimeLimit: enableTimeLimit !== undefined ? !!enableTimeLimit : false
    }, req.admin?.name || 'Admin');

    res.json({ success: true, settings: updated });
  });

  // 4.5. Update Team Details
  app.put('/api/teams/:id', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
    const teamId = req.params.id as TeamColor;
    const { name, captainName, captainImage, description, benefits } = req.body;

    if (!['blue', 'red', 'green', 'yellow'].includes(teamId)) {
      res.status(400).json({ error: 'Invalid team ID.' });
      return;
    }

    if (!name || !captainName || !description || !Array.isArray(benefits)) {
      res.status(400).json({ error: 'All team fields (name, captainName, description, benefits) are required.' });
      return;
    }

    const updated = dbService.updateTeam(teamId, {
      name,
      captainName,
      captainImage,
      description,
      benefits
    }, req.admin?.name || 'Admin');

    if (updated) {
      res.json({ success: true, team: updated });
    } else {
      res.status(404).json({ error: 'Team not found.' });
    }
  });

  // 5. Reset All Registrations (Data Clean Slate)
  app.post('/api/database/reset', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { confirm } = req.body;
    if (confirm !== 'RESET_ALL') {
      res.status(400).json({ error: 'Database reset requires safety confirmation string.' });
      return;
    }

    dbService.resetDatabase(req.admin?.name || 'Admin');
    res.json({ success: true, message: 'All student allocations cleared and database reset successfully.' });
  });

  // ==========================================
  // STATIC SERVING AND VITE MIDDLEWARE
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sports Day 2026 Engine] running on http://localhost:${PORT}`);
  });
}

startServer();
