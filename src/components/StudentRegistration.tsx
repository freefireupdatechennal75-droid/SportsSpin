import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Award, User, Hash, Briefcase, Calendar, Phone, Users, ArrowRight,
  Camera, Upload, Sparkles, RefreshCw, Trash2, Check, X, Clock
} from 'lucide-react';
import { Student } from '../types';
import SportsDayBanner from './SportsDayBanner';

const compressImage = (dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
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

interface StudentRegistrationProps {
  onRegisterSuccess: (student: Student) => void;
  onNavigateToLogin: () => void;
}

export default function StudentRegistration({ onRegisterSuccess, onNavigateToLogin }: StudentRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    department: 'Computer Science (CSE)',
    year: '1st Year',
    phone: '',
    gender: 'Male',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateCheck, setDuplicateCheck] = useState<{ checked: boolean; isDup: boolean }>({ checked: false, isDup: false });

  const [idCardPhoto, setIdCardPhoto] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isReviewing, setIsReviewing] = useState(false);

  const [appSettings, setAppSettings] = useState<{
    collegeName: string;
    collegeLogoUrl: string;
    enableTimeLimit: boolean;
    enrollmentDeadline: string;
  } | null>(null);

  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Fetch settings on load
  React.useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.settings) {
          setAppSettings(data.settings);
        }
      })
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  // Countdown timer logic
  React.useEffect(() => {
    if (!appSettings || !appSettings.enableTimeLimit || !appSettings.enrollmentDeadline) {
      return;
    }

    const calculateTimeLeft = () => {
      const deadlineTime = new Date(appSettings.enrollmentDeadline).getTime();
      const now = Date.now();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setTimeLeftStr('00d 00h 00m 00s');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const dStr = days > 0 ? `${days}d ` : '';
      const hStr = hours.toString().padStart(2, '0') + 'h ';
      const mStr = minutes.toString().padStart(2, '0') + 'm ';
      const sStr = seconds.toString().padStart(2, '0') + 's';

      setTimeLeftStr(`${dStr}${hStr}${mStr}${sStr}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [appSettings]);

  const indoorSports = [
    'Chess / Checkers',
    'Carrom',
    'Ludo',
    'Table Tennis'
  ];

  const outdoorSports = [
    'Athletics',
    'Cricket',
    'Football',
    'Volleyball',
    'Basketball',
    'Discus throw',
    'Throwball'
  ];

  const [selectedIndoor, setSelectedIndoor] = useState<string[]>([]);
  const [selectedOutdoor, setSelectedOutdoor] = useState<string[]>([]);

  const handleIndoorToggle = (sport: string) => {
    setSelectedIndoor(prev => 
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
    setError('');
  };

  const handleOutdoorToggle = (sport: string) => {
    setSelectedOutdoor(prev => 
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
    setError('');
  };

  // Camera & Image Scan functions
  const startCamera = async () => {
    try {
      setError('');
      setScanSuccess('');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser context. Please click 'Open in new tab' to grant camera access, or upload an ID card image instead.");
      }

      let stream: MediaStream;
      try {
        // Try with ideal constraints first (prefer back camera/high res)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (firstErr: any) {
        console.warn("First camera attempt failed, trying fallback constraints", firstErr);
        // If it's a permission denied, don't retry with different constraints since it'll just fail again
        if (firstErr.name === 'NotAllowedError' || firstErr.name === 'PermissionDeniedError' || firstErr.message?.includes('Permission denied')) {
          throw firstErr;
        }
        // Fallback to simple video: true
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied')) {
        setError(
          "[English]\nCamera permission is blocked or denied in this preview frame.\n💡 Solution:\n1. Click the 'Open in new tab' button at the top-right of your screen to grant browser camera access directly.\n2. Or click 'Upload ID Photo' to select/drag-and-drop an ID card image!\n\n" +
          "[Tamil / தமிழ்]\nகேமரா அனுமதி மறுக்கப்பட்டுள்ளது.\n💡 தீர்வு:\n1. நேரடி கேமராவை பயன்படுத்த திரையின் வலது மேல் மூலையில் உள்ள 'Open in new tab' பட்டனை கிளிக் செய்யவும்.\n2. அல்லது, 'Upload ID Photo' மூலமாக உங்கள் ஐடி கார்டு புகைப்படத்தை பதிவேற்றி எளிதாக பதிவு செய்யலாம்!"
        );
      } else if (err.name === 'NotReadableError' || err.message?.includes('Could not start video source')) {
        setError(
          "[English]\nCould not start video source. Your camera might be in use by another application (e.g. Zoom, Meet, Teams, or another browser tab).\n💡 Solution:\nPlease close other camera apps, refresh the page, or click 'Upload ID Photo' to select/drag-and-drop an ID card image instead.\n\n" +
          "[Tamil / தமிழ்]\nகேமராவை இயக்க முடியவில்லை. உங்கள் கேமரா வேறு ஏதேனும் செயலியில் (Zoom, Meet, Teams) பயன்பாட்டில் இருக்கலாம்.\n💡 தீர்வு:\nபிற கேமரா செயலிகளை மூடிவிட்டு பக்கத்தை ரிஃப்ரெஷ் செய்யவும் அல்லது 'Upload ID Photo' மூலம் புகைப்படத்தை பதிவேற்றவும்!"
        );
      } else {
        setError(
          `[English]\nFailed to access camera: ${err.message || 'Unknown error'}\n💡 Solution: Try clicking 'Open in new tab' at the top-right of the screen, or use 'Upload ID Photo' to scan an image.\n\n` +
          `[Tamil / தமிழ்]\nகேமராவை இயக்க முடியவில்லை. 'Open in new tab' கிளிக் செய்து முயற்சிக்கவும் அல்லது 'Upload ID Photo' பயன்படுத்தவும்.`
        );
      }
    }
  };

  const stopCamera = (streamToStop?: MediaStream | null) => {
    const activeStream = streamToStop || cameraStream;
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        compressImage(dataUrl)
          .then((compressed) => {
            setIdCardPhoto(compressed);
            stopCamera();
            scanIDCard(compressed);
          })
          .catch((err) => {
            console.error("Compression failed, using original dataUrl", err);
            setIdCardPhoto(dataUrl);
            stopCamera();
            scanIDCard(dataUrl);
          });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError('');
      setScanSuccess('');
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        try {
          const compressed = await compressImage(dataUrl);
          setIdCardPhoto(compressed);
          scanIDCard(compressed);
        } catch (err) {
          console.error("Error compressing image, using original", err);
          setIdCardPhoto(dataUrl);
          scanIDCard(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const scanIDCard = async (imageData: string) => {
    setScanning(true);
    setError('');
    setScanSuccess('');
    try {
      const res = await fetch('/api/students/scan-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });
      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Failed to scan ID card (Server did not return JSON).');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to scan ID card.');
      }

      const { name, registerNumber, department, year, gender, phone } = data.details;

      const normGender = gender || 'Male';
      setFormData({
        name: name || '',
        registerNumber: (registerNumber || '').toUpperCase().trim(),
        department: department || 'Computer Science (CSE)',
        year: year || '1st Year',
        phone: phone || '',
        gender: normGender
      });

      setSelectedIndoor(prev => prev.filter(sport => indoorSports.includes(sport)));
      setSelectedOutdoor(prev => prev.filter(sport => outdoorSports.includes(sport)));

      setDuplicateCheck({ checked: false, isDup: false });
      setScanSuccess('College ID scanned & details auto-filled with Gemini AI!');
    } catch (err: any) {
      console.error(err);
      setError('Failed to auto-scan ID card. Please enter details manually or try uploading another clear image.');
    } finally {
      setScanning(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const departments = [
    'Computer Science (CSE)',
    'Electronics (ECE)',
    'Mechanical (MECH)',
    'Civil (CIVIL)',
    'Electrical (EEE)',
    'Fashion Technology (FT)'
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const genders = ['Male', 'Female', 'Other'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'registerNumber') {
      setDuplicateCheck({ checked: false, isDup: false });
    }
    if (name === 'gender') {
      setSelectedIndoor(prev => prev.filter(sport => indoorSports.includes(sport)));
      setSelectedOutdoor(prev => prev.filter(sport => outdoorSports.includes(sport)));
    }
    setError('');
  };

  const handleBlurRegNumber = async () => {
    const regNum = formData.registerNumber.trim();
    if (!regNum) return;

    try {
      const res = await fetch('/api/students/check-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerNumber: regNum })
      });
      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Non-JSON response received');
      }
      if (data.exists) {
        setDuplicateCheck({ checked: true, isDup: true });
        setError('This Register Number is already registered!');
      } else {
        setDuplicateCheck({ checked: true, isDup: false });
      }
    } catch (err) {
      console.error('Error checking duplicate register number', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.name.trim()) return setError('Student Name is required');
    if (!formData.registerNumber.trim()) return setError('Register Number is required');

    if (!formData.phone.trim()) {
      return setError(
        "[English] Mobile Number is required!\n" +
        "[Tamil / தமிழ்] அலைபேசி எண் தேவை!"
      );
    }
    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(formData.phone.trim())) {
      return setError(
        "[English] Please enter a valid 10-digit Mobile Number starting with 6, 7, 8, or 9\n" +
        "[Tamil / தமிழ்] தயவுசெய்து 6, 7, 8 அல்லது 9 இல் தொடங்கும் சரியான 10 இலக்க அலைபேசி எண்ணை உள்ளிடவும்!"
      );
    }
    
    if (!idCardPhoto) {
      return setError(
        "[English] College ID Card photo is required! Please upload your ID Card.\n" +
        "[Tamil / தமிழ்] கல்லூரி ஐடி கார்டு புகைப்படம் தேவை! தயவுசெய்து உங்கள் ஐடி கார்டை பதிவேற்றவும்!"
      );
    }

    if (selectedIndoor.length < 1) {
      return setError(
        "[English] Please select a minimum of 1 Indoor Game!\n" +
        "[Tamil / தமிழ்] தயவுசெய்து குறைந்தபட்சம் 1 உள்விளையாட்டைத் தேர்ந்தெடுக்கவும்!"
      );
    }

    if (selectedOutdoor.length < 3) {
      return setError(
        "[English] Please select a minimum of 3 Outdoor Games!\n" +
        "[Tamil / தமிழ்] தயவுசெய்து குறைந்தபட்சம் 3 வெளிவிளையாட்டுகளைத் தேர்ந்தெடுக்கவும்!"
      );
    }

    if (duplicateCheck.isDup) {
      return setError('Cannot register: Register Number is already in use.');
    }

    // Enter Review state first
    setIsReviewing(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Re-verify registration on submit just in case
      const checkRes = await fetch('/api/students/check-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerNumber: formData.registerNumber })
      });
      let checkData: any = {};
      const checkContentType = checkRes.headers.get('content-type');
      if (checkContentType && checkContentType.includes('application/json')) {
        checkData = await checkRes.json();
      } else {
        const text = await checkRes.text();
        throw new Error(text || 'Non-JSON response received');
      }
      if (checkData.exists) {
        setLoading(false);
        setError('This Register Number has just been registered! Double-check your ID.');
        return;
      }

      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sports: [...selectedIndoor, ...selectedOutdoor],
          idCardPhoto: idCardPhoto || undefined
        })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Failed to register student (Server did not return JSON)');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register student');
      }

      onRegisterSuccess(data.student);
    } catch (err: any) {
      setError(err.message || 'Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isReviewing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-12 px-4 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full glass-card rounded-3xl p-8 border border-white/10 bg-slate-900/80 shadow-2xl space-y-6 text-white"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400 uppercase">
              Review Details / விவரங்கள் மதிப்பாய்வு
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Please review and submit details below / தயவுசெய்து உங்கள் விவரங்களை சரிபார்த்து சமர்ப்பிக்கவும்
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Register Number / பதிவு எண்</p>
              <p className="text-lg font-bold text-slate-100 font-mono">{formData.registerNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Student Name / பெயர்</p>
              <p className="text-lg font-bold text-slate-100">{formData.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Department / துறை</p>
              <p className="text-sm font-semibold text-slate-200">{formData.department}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Year of Study / ஆண்டு</p>
              <p className="text-sm font-semibold text-slate-200">{formData.year}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone / தொலைபேசி</p>
              <p className="text-sm font-semibold text-slate-200">{formData.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gender / பாலினம்</p>
              <p className="text-sm font-semibold text-slate-200">{formData.gender}</p>
            </div>
          </div>

          {/* ID Card Thumbnail */}
          {idCardPhoto && (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center space-x-4">
              <img src={idCardPhoto} className="w-20 h-12 object-cover rounded-lg border border-white/10" alt="ID Card Thumbnail" referrerPolicy="no-referrer" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">College ID Card / கல்லூரி ஐடி கார்டு</p>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Attached & Scanned</p>
              </div>
            </div>
          )}

          {/* Selected Sports summary */}
          <div className="space-y-3 bg-white/5 p-6 rounded-2xl border border-white/5">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1.5">Indoor Games / உள்விளையாட்டுகள்</p>
              <div className="flex flex-wrap gap-2">
                {selectedIndoor.map(s => (
                  <span key={s} className="px-3 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold uppercase">{s}</span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-white/5">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1.5">Outdoor Games / வெளிவிளையாட்டுகள்</p>
              <div className="flex flex-wrap gap-2">
                {selectedOutdoor.map(s => (
                  <span key={s} className="px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold uppercase">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => setIsReviewing(false)}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              ← Edit Details / திருத்தவும்
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Submit & Continue to Spin / சமர்ப்பிக்கவும் →</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-950/50 text-red-200 border border-red-500/30 rounded-2xl p-4 text-xs font-semibold">
              <p className="font-bold text-red-400 uppercase tracking-wider text-[9px] mb-1">Alert / அறிவிப்பு:</p>
              <p className="leading-relaxed whitespace-pre-line text-red-200/95">{error}</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-6 px-4 sm:px-6 lg:px-8 flex flex-col justify-between text-slate-100 relative overflow-hidden select-none">
      
      {/* Immersive Stadium Spotlight Background Effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full filter blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full filter blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full filter blur-[150px] pointer-events-none -translate-x-1/2 translate-y-1/3"></div>

      {/* Floating Athlete Silhouette SVGs (Faint, high-quality, thematic) */}
      <div className="absolute top-1/4 right-8 sm:right-24 w-44 sm:w-64 h-44 sm:h-64 opacity-[0.03] sm:opacity-[0.05] pointer-events-none select-none">
        {/* Runner silhouette */}
        <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-indigo-400">
          <path d="M45,15 C47.5,15 49.5,13 49.5,10.5 C49.5,8 47.5,6 45,6 C42.5,6 40.5,8 40.5,10.5 C40.5,13 42.5,15 45,15 Z M25,50 L35,32 L20,38 L16,35 L33,23 C35.5,21.5 39,22.5 40.5,25.5 L44,32.5 L55,27 L55,34 L44,40 L38,55 L25,50 Z M46,41 L53,52 L68,49 L70,54 L51,60 L41,45 L46,41 Z M33,56 L35,76 L25,82 L22,78 L31,70 L28,58 L33,56 Z" />
        </svg>
      </div>

      <div className="absolute bottom-12 left-8 sm:left-24 w-44 sm:w-64 h-44 sm:h-64 opacity-[0.03] sm:opacity-[0.05] pointer-events-none select-none">
        {/* Football Player / Athlete silhouette */}
        <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-emerald-400">
          <path d="M50,16 C52.5,16 54.5,14 54.5,11.5 C54.5,9 52.5,7 50,7 C47.5,7 45.5,9 45.5,11.5 C45.5,14 47.5,16 50,16 Z M30,42 L42,26 L35,24 L25,32 L21,28 L36,18 C38.5,16.5 42,17.5 43.5,20.5 L48.5,30 L60,34 L58,41 L47,38 L43,54 L58,68 L54,74 L37,58 L33,44 L30,42 Z M46,55 L49,80 L42,84 L39,80 L43,72 L41,57 L46,55 Z" />
        </svg>
      </div>

      {/* Floating Stadium Confetti Particles */}
      <div className="absolute top-10 left-[15%] w-3 h-3 bg-indigo-500/20 rotate-12 rounded-xs pointer-events-none animate-bounce" style={{ animationDuration: '6s' }}></div>
      <div className="absolute top-[40%] left-[5%] w-2.5 h-2.5 bg-rose-500/20 rotate-45 pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 right-[12%] w-2 h-2 bg-amber-500/20 rounded-full pointer-events-none animate-ping" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[15%] right-[25%] w-3.5 h-3.5 bg-emerald-500/20 -rotate-12 rounded-sm pointer-events-none animate-bounce" style={{ animationDuration: '8s' }}></div>
      
      {/* College Logo Banner */}
      <div className="max-w-5xl w-full mx-auto mb-2 no-print z-10">
        <SportsDayBanner />
      </div>

      {/* Enrollment Deadline Countdown Banner */}
      {appSettings?.enableTimeLimit && (
        <div className="max-w-md w-full mx-auto mb-4 no-print z-10">
          <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg ${
            isExpired 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 animate-pulse'
          }`}>
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${isExpired ? 'text-rose-400' : 'text-indigo-400'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isExpired ? 'Enrollment Ended / சேர்க்கை முடிவடைந்தது' : 'Enrollment Time Limit / சேர்க்கை கால வரம்பு'}
              </span>
            </div>
            <div className="mt-1.5 font-mono text-xl font-bold tracking-wider">
              {isExpired ? (
                <span className="text-rose-400 uppercase font-sans text-xs font-black">Registration Closed / பதிவு முடிந்தது</span>
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-blue-300 to-white">{timeLeftStr}</span>
              )}
            </div>
            {!isExpired && appSettings.enrollmentDeadline && (
              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Deadline / இறுதி நாள்: {new Date(appSettings.enrollmentDeadline).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex justify-between items-center no-print mb-4">
        <div className="flex items-center space-x-2">
          <Award className="w-8 h-8 text-indigo-500 animate-pulse" />
          <span className="font-extrabold tracking-tight text-lg italic text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase">Sports</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToLogin}
            className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 cursor-pointer"
          >
            Admin Portal
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md no-print">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Glow Effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full filter blur-3xl opacity-30 -ml-12 -mb-12"></div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Student Registration</h2>
            <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Enter your details to initiate Sports team allocation.
            </p>
          </div>

          {isExpired ? (
            <div className="text-center py-10 px-4 space-y-8 relative overflow-hidden">
              {/* Pulsing Outer Neon ring */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-rose-950/60 border border-rose-500/40 rounded-full w-20 h-20 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                  <Clock className="w-10 h-10 text-rose-400" />
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/20">
                  Timeline Finished
                </span>
                <h3 className="text-4xl font-black uppercase text-rose-500 tracking-tight leading-none mt-2 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                  REGISTRATION CLOSED
                </h3>
                <p className="text-sm font-bold text-rose-300 uppercase tracking-widest">
                  பதிவு முடிவடைந்தது
                </p>
              </div>

              <div className="max-w-xs mx-auto bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  The official deadline set by the College Sports Committee has expired. Student enrollment and team allocation are now deactivated.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-1">
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                  Central Sports Committee Admin Control
                </p>
                <p className="text-[9px] text-slate-400 font-medium font-mono">
                  Angel College of Engineering and Technology
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
            {/* AI ID Card Scanning & Auto-Fill Section */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full filter blur-xl"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">AI Quick Registration</span>
                </div>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Fast Scan
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upload a photo of your College ID card. Gemini AI will instantly scan the card and fill in the details for you!
                </p>

                {cameraActive ? (
                  /* Camera Active Viewport */
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/30 aspect-video flex flex-col items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border border-indigo-500/20 pointer-events-none flex items-center justify-center">
                      {/* ID Card Framing Overlay */}
                      <div className="w-4/5 h-3/5 border-2 border-dashed border-indigo-400/60 rounded-lg flex items-center justify-center relative">
                        <span className="text-[9px] font-bold text-indigo-300/80 uppercase tracking-wider bg-slate-950/80 px-2 py-1 rounded">
                          Align ID Card Here
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2.5 px-4">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center space-x-1.5 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture & Scan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => stopCamera()}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : idCardPhoto ? (
                  /* ID Card Photo Preview & Scanning State */
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-white/5 aspect-video flex items-center justify-center">
                    <img
                      src={idCardPhoto}
                      alt="College ID Preview"
                      className={`w-full h-full object-cover transition-all duration-300 ${scanning ? 'blur-[2px] opacity-40' : ''}`}
                    />
                    
                    {scanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-slate-950/40">
                        <div className="relative">
                          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                          <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 animate-ping" />
                        </div>
                        <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest animate-pulse">
                          Reading ID Card...
                        </p>
                        <p className="text-[8px] text-slate-400">Gemini AI is parsing card contents</p>
                      </div>
                    )}

                    {!scanning && (
                      <div className="absolute bottom-3 right-3 flex space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIdCardPhoto(null);
                            setScanSuccess('');
                          }}
                          className="p-1.5 bg-rose-950/90 hover:bg-rose-900 border border-rose-500/20 rounded-lg text-rose-300 hover:text-white cursor-pointer transition-all"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Option Selection Buttons */
                  <div className="w-full">
                    <label className="flex flex-col items-center justify-center p-6 bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl space-y-2.5 transition-all cursor-pointer text-center group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white">Upload ID Photo / ஐடி கார்டு பதிவேற்றம்</span>
                      <span className="text-[9px] text-slate-400">Drag & drop or click to browse files</span>
                    </label>
                  </div>
                )}

                {scanSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-[10px] font-bold leading-relaxed"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span>{scanSuccess}</span>
                      <p className="text-[8px] text-emerald-400/70 font-medium italic mt-0.5">Note: Double check all auto-filled fields before submitting!</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Register Number Field */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Register Number (Unique ID) <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="registerNumber"
                  value={formData.registerNumber}
                  onChange={handleChange}
                  onBlur={handleBlurRegNumber}
                  required
                  placeholder="e.g. 21CS001"
                  className={`block w-full pl-11 pr-3 py-3 rounded-xl border glass-input text-white text-sm focus:ring-2 focus:border-indigo-500 ${
                    duplicateCheck.checked
                      ? duplicateCheck.isDup
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-emerald-500 focus:ring-emerald-500'
                      : 'border-white/10 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {duplicateCheck.checked && (
                <p className={`text-xs mt-1.5 font-bold uppercase tracking-wider ${duplicateCheck.isDup ? 'text-red-400' : 'text-emerald-400'}`}>
                  {duplicateCheck.isDup ? '❌ Register number taken' : '✅ ID is available'}
                </p>
              )}
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Student Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="block w-full pl-11 pr-3 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Mobile Number Field */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Mobile Number / அலைபேசி எண் <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 9876543210"
                  className="block w-full pl-11 pr-3 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Department Selector */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-3 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year & Gender Split */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Academic Year
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-3 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Gender
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-3 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    {genders.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Indoor Games Selection Checkboxes */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Select Indoor Games (Minimum 1 Required) <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {indoorSports.map((sport) => {
                  const isChecked = selectedIndoor.includes(sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => handleIndoorToggle(sport)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                          : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600'
                      }`}>
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 stroke-[4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-semibold">{sport}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic pt-1">
                Selected: {selectedIndoor.length} of {indoorSports.length} (Need at least 1)
              </p>
            </div>

            {/* Outdoor Games Selection Checkboxes */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Select Outdoor Games (Minimum 3 Required) <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {outdoorSports.map((sport) => {
                  const isChecked = selectedOutdoor.includes(sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => handleOutdoorToggle(sport)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                          : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600'
                      }`}>
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 stroke-[4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-semibold">{sport}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic pt-1">
                Selected: {selectedOutdoor.length} of {outdoorSports.length} (Need at least 3)
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-950/50 text-red-200 border border-red-500/30 rounded-xl p-4 text-xs font-semibold relative flex items-start space-x-2.5"
              >
                <div className="flex-1 text-left">
                  <div className="font-bold text-red-400 uppercase tracking-wider text-[9px] mb-1">Alert / அறிவிப்பு:</div>
                  <p className="leading-relaxed whitespace-pre-line text-red-200/90">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="p-1 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg cursor-pointer transition-colors shrink-0"
                  title="Dismiss / தவிர்"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Review and Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-2xl shadow-indigo-500/20 text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
              >
                <span className="flex items-center space-x-2">
                  <span>Review and Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </form>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 mt-8 no-print">
        &copy; 2026 College Sports Committee. All Rights Reserved.
      </div>
    </div>
  );
}
