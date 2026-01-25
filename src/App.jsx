import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Clock, LogOut, LayoutDashboard, History, FileText, ChevronRight, User, Briefcase, BarChart3, Search, Instagram, Linkedin, Paperclip, AlertTriangle, X, Camera, Lock, RefreshCw, Info, HelpCircle, Users, Eye, EyeOff, Moon, Sun, BookOpen, GraduationCap, ExternalLink, ArrowLeft, Trophy, Crown, Flame, Cloud, BrainCircuit } from 'lucide-react';
import logo from './assets/logo.png';

import { api } from './services/api';

/* --- HELPERS --- */
const getTodayDateString = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const getFormattedDateTime = () => {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  return `${date} • ${time}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  // Check if it's an ISO string (e.g. 2026-01-07T08:00...)
  if (dateString.includes('T') && dateString.includes('Z')) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).replace(',', ' •');
  }
  return dateString; // Return as-is if already formatted
};

const getTimeBasedGreeting = (name) => {
  if (!name) return "Welcome Back 👋"; // Safety Check
  const hour = new Date().getHours();
  if (hour < 5) return `Burning the midnight oil, ${name}? 🦉`;
  if (hour < 12) return `Good Morning, ${name} ☀️`;
  if (hour < 17) return `Good Afternoon, ${name} 👋`;
  if (hour < 22) return `Good Evening, ${name} 🌙`;
  return `Late night hustle, ${name}? 🚀`;
};

const getRandomSubtitle = () => {
  const subtitles = [
    "What did you accomplish today?",
    "Time to log your wins.",
    "Did you learn something new today?",
    "Let's capture your progress.",
    "Turning effort into history.",
    "Ready to document your day?"
  ];
  return subtitles[Math.floor(Math.random() * subtitles.length)];
};

const getRandomSuccessMessage = () => {
  const messages = [
    "Boom! Another day, another victory! 🚀",
    "Solid work today. Keep that streak alive! 🔥",
    "Log saved. You are crushing it!",
    "That's how it's done! 👊",
    "Progress recorded. See you tomorrow! ✨"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};



/* --- CONSTANTS --- */
const COURSES = [
  {
    id: 'basics1',
    title: 'Computer Basics (GCF Global)',
    provider: 'GCFGlobal',
    link: 'https://edu.gcfglobal.org/en/computerbasics/',
    url: 'https://edu.gcfglobal.org/en/computerbasics/',
    color: 'blue'
  },
  {
    id: 'basics2',
    title: 'IBM Skills Planning',
    provider: 'IBM Skills',
    link: 'https://skills.yourlearning.ibm.com/activity/PLAN-3E2A749669E2',
    url: 'https://skills.yourlearning.ibm.com/activity/PLAN-3E2A749669E2',
    color: 'indigo'
  },
  {
    id: 'aws',
    title: 'AWS Cloud Practitioner Essentials',
    provider: 'AWS Skill Builder',
    link: 'https://skillbuilder.aws/learn/94T2BEN85A/aws-cloud-practitioner-essentials/8D79F3AVR7',
    url: 'https://skillbuilder.aws/learn/94T2BEN85A/aws-cloud-practitioner-essentials/8D79F3AVR7',
    color: 'orange'
  },
  {
    id: 'ai',
    title: 'Microsoft AI For Beginners',
    provider: 'Microsoft',
    link: 'https://github.com/microsoft/AI-For-Beginners',
    url: 'https://github.com/microsoft/AI-For-Beginners',
    color: 'rose'
  }
];

/* --- API HELPERS --- */

export async function submitDailyLog(userName, formData) {
  try {
    const result = await api.submitLog({
      name: userName,
      internId: formData.internId, // [SECURITY] Pass ID

      date: getFormattedDateTime(),
      category: formData.course, // Backend expects 'category'
      time: formData.time,
      issues: formData.issues,
      summary: formData.learning, // Backend expects 'summary'
      summary: formData.learning, // Backend expects 'summary'
      proof: formData.proof || '', // [NEW] Pass Proof (Base64)
      file: formData.file || null // [NEW] Pass File (Base64) for Issues
    });
    return result;
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function fetchStudentHistory(studentName, internId) {
  return await api.getHistory(studentName, internId);
}

export async function fetchAllMembers() {
  const users = await api.fetchUsers();
  // Add placeholder data for Admin UI compatibility
  return users.filter(u => u.role === 'user').map(u => ({
    ...u,
    daysCompleted: u.daysCompleted || 0, // Use API value
    history: [] // History loaded on demand
  }));
}

/* --- COMPONENTS --- */

/* --- CUSTOM HOOK: IDLE TIMER --- */
const useIdleTimer = (onIdle, idleTime = 1800000) => { // Default 30 minutes
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onIdle, idleTime);
    };

    // Events to listen for activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Attach listeners
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start timer initially
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [onIdle, idleTime]);
};

class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Section Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-4 text-sm">We couldn't load this section.</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm">Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Application Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHardReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Error</h2>
            <p className="text-slate-500 mb-6 text-sm">Something went wrong. Try reloading or resetting.</p>
            <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 overflow-auto max-h-32">
              <code className="text-xs text-slate-600 break-all font-mono">{this.state.error?.toString()}</code>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" /> Reload Application
              </button>
              <button
                onClick={this.handleHardReset}
                className="w-full py-3 bg-white text-red-600 border border-red-200 font-bold rounded-xl hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 inline mr-2" /> Reset Data & Logout
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoginScreen = ({ onLogin, users, toggleTheme, theme }) => {
  const [name, setName] = useState('');
  const [internId, setInternId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // NEW: Success state
  const [error, setError] = useState('');

  /* --- CHANGED: Autocomplete Logic --- */
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // NEW: Password Visibility State

  // [NEW] Forgot ID State
  const [showForgotId, setShowForgotId] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ type: '', msg: '' });

  const filteredUsers = users.filter(u =>
    u.role !== 'admin' && u.name.toLowerCase().includes(name.toLowerCase())
  );

  // [NEW] Forgot ID Handler
  const handleForgotIdSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotStatus({ type: 'loading', msg: 'Checking records...' });

    try {
      const result = await api.sendInternId(forgotEmail);

      if (result && result.success) { // Handle "success: true" from backend
        setForgotStatus({ type: 'success', msg: 'Sent! Check your email inbox.' });
        setForgotEmail('');
      } else {
        setForgotStatus({ type: 'error', msg: result.error || 'Email not found.' });
      }
    } catch (e) {
      setForgotStatus({ type: 'error', msg: 'Connection failed.' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !internId) return;
    setLoading(true);
    setError('');

    await new Promise(r => setTimeout(r, 600)); // Network simulation

    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.internId === internId);

    if (user) {
      setSuccess(true);
      setTimeout(() => {
        onLogin(user);
      }, 1500); // 1.5s delay for feedback
    } else {
      setError("Invalid credentials or user not found.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 selection:bg-sky-100 selection:text-sky-900 overflow-hidden relative dark:bg-slate-900 transition-colors duration-300">
      {/* Background Decor - mimicking the website vibe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-sky-400/20 rounded-full blur-[100px] animate-blob dark:opacity-10"></div>
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000 dark:opacity-10"></div>
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-[9999]">
        <button
          onClick={() => {
            console.log("Toggle theme clicked");
            toggleTheme();
          }}
          className="p-3 bg-white/80 dark:bg-slate-800 backdrop-blur-xl rounded-full shadow-lg border border-white/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-sky-600" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-brand-glow border border-white/50 dark:border-slate-700 overflow-hidden transform transition-all hover:scale-[1.01] duration-500 relative z-10">
        <div className="p-10 text-center">
          {/* [NEW] Forgot ID MODAL OVERLAY */}
          {showForgotId && (
            <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col justify-center px-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => { setShowForgotId(false); setForgotStatus({ type: '', msg: '' }); }}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <X size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="text-sky-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Get Login ID</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                  Enter your registered email address. We'll send your Intern ID to your inbox.
                </p>
              </div>

              <form onSubmit={handleForgotIdSubmit} className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Registered Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    placeholder="name@example.com"
                    required
                    autoFocus
                  />
                </div>

                {forgotStatus.msg && (
                  <div className={`text-sm px-4 py-3 rounded-xl font-medium flex items-center gap-2 ${forgotStatus.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                    forgotStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                      'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300'
                    }`}>
                    {forgotStatus.type === 'success' && <CheckCircle2 size={16} />}
                    {forgotStatus.msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotStatus.type === 'loading' || forgotStatus.type === 'success'}
                  className="w-full bg-slate-900 dark:bg-sky-600 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-500 transition-all shadow-lg shadow-sky-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {forgotStatus.type === 'loading' ? 'Sending...' : 'Send to Inbox'}
                </button>
              </form>
            </div>
          )}

          <div className="relative z-10 animate-fly-in">
            <div className="w-40 h-40 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-sky-100 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-600 p-6 animate-float">
              <img src={logo} alt="CloudAiLabs Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">CloudAiLabs</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium tracking-wide text-sm uppercase">Activity Tracker</p>
          </div>
        </div>

        <div className="px-10 pb-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Profile</label>

              {/* Autocomplete Input */}
              <div className="relative group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                  placeholder="Type your name..."
                  className="w-full pl-4 pr-10 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-slate-700 dark:text-slate-200 font-medium group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm"
                />
                <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && name && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {filteredUsers.map((u, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 font-medium transition-colors"
                      onClick={() => { setName(u.name); setShowSuggestions(false); }}
                    >
                      {u.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Intern ID</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={internId}
                  onChange={(e) => setInternId(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm pr-12 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name || !internId || loading || success}
              className={`w-full py-4 px-4 font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 mt-4 
                ${success ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-brand-primary hover:bg-sky-600 shadow-sky-200'}
                text-white hover:-translate-y-1 active:translate-y-0 disabled:opacity-80 disabled:shadow-none disabled:transform-none`}
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span>
              ) : success ? (
                <><CheckCircle2 className="w-5 h-5" /> Welcome, {name.split(' ')[0]}!</>
              ) : (
                <>Sign In <ChevronRight className="w-5 h-5 opacity-80" /></>
              )}
            </button>
            {/* NEW: Forgot ID Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowForgotId(true)}
                className="text-xs text-slate-400 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400 transition-colors font-medium"
              >
                First time logging in? Get your ID here.
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Contact Info Footer */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-slate-500 text-sm font-medium">Having trouble?</p>
        <a href="mailto:akhil@cloudailabs.in" className="text-sky-600 font-bold bg-sky-50 px-4 py-2 rounded-lg border border-sky-100 inline-block hover:bg-sky-100 transition-colors">
          Contact: akhil@cloudailabs.in
        </a>
      </div>



      <p className="mt-8 text-slate-400 text-xs font-medium tracking-wide">© 2026 CloudAiLabs • Internal Tool</p>
    </div>
  );
};

// --- NEW COMPONENT: COURSE TRACKER ---
const CourseCard = ({ title, link, status, onToggle }) => {
  // Status: 'not_started' | 'pursuing' | 'done'
  const isPursuing = status === 'pursuing';
  const isDone = status === 'done';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all flex flex-col justify-between h-full group">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          {isDone ? (
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          ) : isPursuing ? (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-amber-200 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pursuing
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-slate-200">
              To Do
            </span>
          )}
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">{title}</h4>
        <a href={link} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline flex items-center gap-1 mb-4">
          View Course <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button
          onClick={() => onToggle('pursuing')}
          disabled={isDone} // Can't go back to pursuing if done? User might want to. Let's allow switching.
          className={`py-2 rounded-lg text-xs font-bold transition-all border ${isPursuing
            ? 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-100'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600'
            }`}
        >
          Pursuing
        </button>
        <button
          onClick={() => onToggle('done')}
          className={`py-2 rounded-lg text-xs font-bold transition-all border ${isDone
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-100'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
            }`}
        >
          Done
        </button>
      </div>
    </div>
  );
};

const CourseTracker = ({ user, progress, onUpdateStatus, onViewCourses }) => {
  // Removed internal state. Uses Props.
  const [loading, setLoading] = useState(true);

  // COURSES constant moved to global scope


  const handleToggle = (courseId, statusType) => {
    // Toggle Logic: If clicking same status, clear it (reset to 'not_started'). If different, set it.
    const current = progress[courseId];
    const newStatus = current === statusType ? 'not_started' : statusType;
    onUpdateStatus(courseId, newStatus);
  };

  const doneCount = COURSES.filter(c => progress[c.id] === 'done').length;
  const total = COURSES.length;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex justify-between items-end mb-4">
        <div className="flex-grow">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" /> Recommended Courses
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400"> curated for Monitor Group Interns</p>
          <button
            onClick={onViewCourses}
            className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
          >
            Explore Full Path <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Progress</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(doneCount / total) * 100}%` }}></div>
            </div>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{doneCount}/{total}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {COURSES.map(course => (
          <CourseCard
            key={course.id}
            {...course}
            status={progress[course.id] || 'not_started'}
            onToggle={(status) => handleToggle(course.id, status)}
          />
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout, onUpdateProfile, toggleTheme, theme, courseProgress, onUpdateCourseProgress }) => {
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'profile'

  /* --- NEW: Loading & Refresh State --- */
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false); // NEW: Lifted state to show in Navbar

  // Calculate progress based on UNIQUE days
  const uniqueDates = new Set();
  if (Array.isArray(history)) {
    history.forEach((item, index) => {
      // Robust check: Use 'date' if available, otherwise 'index' to ensure count
      let dKey = item.date;
      if (!dKey || dKey === "") {
        dKey = "fallback-" + index;
      } else {
        dKey = dKey.toString().trim();
      }
      uniqueDates.add(dKey);
    });
  }

  const daysCompleted = uniqueDates.size;
  const todayStr = getTodayDateString();

  // --- SMART LOCK LOGIC ---
  const [lockStatus, setLockStatus] = useState({ locked: false, reason: 'idle' });
  const [randomSuccessMsg, setRandomSuccessMsg] = useState("");
  const [greetingSubtitle, setGreetingSubtitle] = useState("");
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setGreetingSubtitle(getRandomSubtitle());
  }, []); // Run once on mount

  // --- NEW: Auto-Update Course Status based on Logs ---
  useEffect(() => {
    if (!history.length) return;

    COURSES.forEach(course => {
      // Check if user has ANY log for this course
      const hasLog = history.some(log => log.course === course.title);
      const currentStatus = courseProgress[course.id];

      // If found in history AND currently 'not_started' (or undefined), set to 'pursuing'
      if (hasLog && (!currentStatus || currentStatus === 'not_started')) {
        onUpdateCourseProgress(course.id, 'pursuing');
      }
    });
  }, [history, courseProgress]);

  useEffect(() => {
    // 1. Get Latest Log Time
    let lastLogDate = null;

    // Check History (First item is newest)
    if (history.length > 0) {
      const dStr = history[0].date;
      // [FIX] Robust Null Check to prevent Application Error
      if (dStr && dStr.includes('T') && dStr.includes('Z')) {
        lastLogDate = new Date(dStr); // ISO
      } else if (dStr) {
        // Custom Format: "Jan 8, 2026 • 10:30 PM" -> "Jan 8, 2026 10:30 PM"
        lastLogDate = new Date(dStr.replace(' •', ''));
      }
    }

    // Check LocalStorage (Fallback / More precise if just submitted)
    const localLastTime = localStorage.getItem(`lastLogTime_${user.name}`);
    if (localLastTime) {
      const localDate = new Date(localLastTime);
      // Use whichever is more recent
      if (!lastLogDate || localDate > lastLogDate) {
        lastLogDate = localDate;
      }
    }

    if (!lastLogDate) {
      setLockStatus({ locked: false, reason: 'idle' });
      return;
    }

    // 2. Calculate Lock Conditions
    const now = new Date();
    const msSinceLast = now - lastLogDate;
    const hoursSinceLast = msSinceLast / (1000 * 60 * 60);

    const isSameDay = now.toDateString() === lastLogDate.toDateString();
    const isCoolingDown = hoursSinceLast < 12;

    if (isSameDay) {
      setLockStatus({ locked: true, reason: 'same_day' });
    } else if (isCoolingDown) {
      const unlockTime = new Date(lastLogDate.getTime() + 12 * 60 * 60 * 1000);
      setLockStatus({
        locked: true,
        reason: 'cooldown',
        unlockTime: unlockTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      });
    } else {
      setLockStatus({ locked: false, reason: 'idle' });
    }

  }, [history, user.name, getTodayDateString()]); // Re-run when history changes or day changes


  useEffect(() => {
    // Initial fetch
    if (user.name && user.internId) {
      fetchStudentHistory(user.name, user.internId).then(data => {
        setHistory(data);
        // Artificial delay for premium feel
        setTimeout(() => setInitialLoading(false), 2000);
      });
    }
  }, [user.name, user.internId]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const data = await fetchStudentHistory(user.name, user.internId);
    setHistory(data);
    setTimeout(() => setIsRefreshing(false), 800); // Min spin time
  };

  // Optimistic update: Add new log immediately to state
  const handleLogSubmit = (newLog) => {
    // 1. Update State
    setHistory(prev => [newLog, ...prev]);

    // 2. Update LocalStorage (Instant Lock with ISO Time)
    localStorage.setItem(`lastLogTime_${user.name}`, new Date().toISOString());

    // 3. Re-fetch in background
    setTimeout(() => {
      fetchStudentHistory(user.name, user.internId).then(setHistory);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 pb-12 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 py-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">CloudAiLabs</h1>
                <p className="text-xs text-sky-500 font-semibold mt-0.5 tracking-wide uppercase">Activity Tracker</p>
              </div>
            </div>

            {/* Dynamic Greeting (Tablet/Desktop) */}
            <div className="hidden md:block text-center absolute left-1/2 -translate-x-1/2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name ? getTimeBasedGreeting(user.name.split(' ')[0]) : 'Welcome'}</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{greetingSubtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-amber-400 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setView('profile')}
                className="flex items-center gap-3 px-3 md:px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-xs ring-2 ring-white overflow-hidden shrink-0">
                  {/* Sync Photo Logic: Prioritize User Prop (State), then LocalStorage */}
                  {isPhotoUploading ? (
                    <div className="animate-spin text-sky-600"><RefreshCw className="w-4 h-4" /></div>
                  ) : user.photo || localStorage.getItem(`photo_${user.name}`) ? (
                    <img src={user.photo || localStorage.getItem(`photo_${user.name}`)} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-700 pr-1 group-hover:text-sky-600 transition-colors hidden sm:inline-block">{user.name}</span>
              </button>

              {/* Hide Logout when in Profile View */}
              {view === 'dashboard' && (
                <button
                  onClick={onLogout}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow">

        {view === 'profile' ? (
          <SectionErrorBoundary onReset={() => setView('dashboard')}>
            <ProfileSection
              user={user}
              onBack={() => setView('dashboard')}
              onUpdate={user.role !== 'admin' ? onUpdateProfile : null}
              onUploadStatusChange={setIsPhotoUploading} // NEW Prop
            />
          </SectionErrorBoundary>
        ) : view === 'courses' ? (
          <SectionErrorBoundary onReset={() => setView('dashboard')}>
            <CoursesSection
              user={user}
              statuses={courseProgress}
              onUpdateStatus={onUpdateCourseProgress}
              onBack={() => setView('dashboard')}
            />
          </SectionErrorBoundary>
        ) : (
          <>
            {/* --- NEW: Premium Welcome Loading Screen --- */
              initialLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-out fade-out duration-700 pointer-events-none">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-sky-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src={logo} alt="Loading" className="w-10 h-10 object-contain opacity-50 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-white tracking-tight animate-pulse">Loading your progress...</h2>
                  <p className="text-slate-400 text-sm font-medium mt-2">Connecting to CloudAiLabs Database</p>
                </div>
              )}

            {/* Welcome & Stats */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

              {/* Main Greeting Block */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 mb-2">
                  {getTimeBasedGreeting(user.name)}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{greetingSubtitle}</p>
              </div>

              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last updated: Just now</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Program Progress"
                  value={`${daysCompleted} / 90 Days`}
                  sub={`${Math.min((daysCompleted / 90) * 100, 100).toFixed(1)}% Completed`}
                  icon={<Clock className="w-6 h-6 text-sky-600" />}
                  progress={Math.min((daysCompleted / 90) * 100, 100)}
                  color="sky"
                  variant="circle"
                />
                <StatCard
                  label="Total Logs"
                  value={history ? history.length : 0}
                  sub="Entries Submitted"
                  icon={<FileText className="w-6 h-6 text-emerald-600" />}
                  color="emerald"
                  variant="circle"
                  progress={Math.min((history.length / 90) * 100, 100)}
                />
                {daysCompleted >= 90 ? (
                  <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-6 rounded-3xl shadow-sm border border-amber-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-sm font-bold text-amber-600 tracking-wider uppercase mb-1">Status</p>
                      <h3 className="text-2xl font-extrabold text-amber-900 tracking-tight">Certificate Unlocked!</h3>
                      <p className="text-xs font-bold text-amber-700 mt-2 bg-amber-200/50 inline-block px-2 py-1 rounded">Click to Download</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
                      <CheckCircle2 className="w-32 h-32 text-amber-600" />
                    </div>
                  </div>
                ) : (
                  <StatCard
                    label="Certificate Eligibility"
                    value={`${(Math.min(daysCompleted / 90, 1) * 100).toFixed(0)}%`}
                    sub={`${Math.max(90 - daysCompleted, 0)} Days Remaining`}
                    icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
                    progress={(daysCompleted / 90) * 100}
                    color="purple"
                    variant="circle"
                  />
                )}
              </div>
            </div>

            {/* --- NEW: COURSE TRACKER (ONLY FOR MONITOR MEMBERS) --- */}
            {user.isMonitor && (
              <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                <CourseTracker
                  user={user}
                  progress={courseProgress}
                  onUpdateStatus={onUpdateCourseProgress}
                  onViewCourses={() => setView('courses')}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">

              {/* Main Content Form - Wider */}
              <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400">
                        <FileText className="w-4 h-4" />
                      </span>
                      Submit Daily Log
                      <button
                        onClick={() => setShowRules(!showRules)}
                        className="ml-2 text-slate-300 hover:text-sky-500 transition-colors"
                        title="View Submission Rules"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </h3>
                    <span className="text-xs font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Rules Info Panel */}
                  {showRules && (
                    <div className="bg-sky-50/50 border-b border-sky-100 px-8 py-6 animate-in slide-in-from-top-2">
                      <h4 className="font-bold text-sky-900 text-sm mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Submission Protocol
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-sky-800/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0"></div>
                          <span><strong>One Log Per Day:</strong> Users can only submit one activity log per calendar day.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-sky-800/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0"></div>
                          <span><strong>12-Hour Reset:</strong> To prevent midnight spamming, a 12-hour cooldown applies between submissions. (e.g. If you submit at 11 PM, you cannot submit again at 12:01 AM).</span>
                        </li>
                        <li className="flex gap-3 text-sm text-sky-800/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0"></div>
                          <span><strong>Quality First:</strong> Brief, specific updates are better than long essays. Focus on what was learned or built.</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="p-8">
                    {lockStatus.locked ? (
                      <div className="text-center py-12 flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Daily Log Submitted!</h3>

                        {lockStatus.reason === 'cooldown' ? (
                          <div className="max-w-sm mx-auto mb-8">
                            <p className="text-slate-500 mb-2">You've worked correctly for this period.</p>
                            <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold inline-block border border-orange-100">
                              Next submission enabled at {lockStatus.unlockTime}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">12-hour rest period active</p>
                          </div>
                        ) : (
                          <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            {randomSuccessMsg || getRandomSuccessMessage()}
                          </p>
                        )}

                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-600 text-sm font-medium">
                          <Lock className="w-4 h-4" /> Submission Locked
                        </div>
                      </div>
                    ) : (
                      <DailyLogForm user={user} onSuccess={handleLogSubmit} />
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar / Recent History - Narrower */}
              <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[650px]">
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center z-10">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                        <History className="w-4 h-4" />
                      </span>
                      Recent Activity
                    </h3>
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Syncing...' : 'Sync History'}
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <HistoryList history={history} />
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Cloud AI Labs</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Cloud-native IT consulting and education NGO with a PAN-India presence, specializing in Cloud Pre-Sales, Project Delivery, and AI-driven solutions.
              </p>
              <div className="flex gap-3">
                <a href="https://www.linkedin.com/in/akhil-singh-gautam/" target="_blank" rel="noreferrer" className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-200 transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href="https://www.instagram.com/cloudailabs.in?igsh=cmVoNDEwZWhraWxi" target="_blank" rel="noreferrer" className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 hover:bg-pink-200 transition-colors"><Instagram className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-slate-500 font-medium">
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Home</a></li>
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Internship Program</a></li>
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Our Services</a></li>
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Request a Quote</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contact Us</h3>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-sky-600"><div className="w-2 h-2 bg-sky-500 rounded-full"></div></div>
                  PAN-India Presence
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-sky-600">@</div>
                  <a href="mailto:akhil@cloudailabs.in" className="hover:text-sky-600 transition-colors">akhil@cloudailabs.in</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 mt-12 pt-8 text-center text-xs text-slate-400 font-medium">
            © 2026 Cloud Ai Labs. All rights reserved. (NGO Reg. in process)
          </div>
        </div>
      </footer>
    </div>
  );
};

const CircularProgress = ({ progress, size = 120, strokeWidth = 10, color = "text-sky-600" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-slate-100 dark:text-slate-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};




const StatCard = ({ label, value, sub, icon, progress, color, variant }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col justify-between">
    {variant === 'circle' ? (
      <div className="flex flex-col items-center justify-center text-center h-full gap-4">
        <div className="flex justify-between w-full mb-2">
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">{label}</p>
          <div className={`p-2 rounded-xl bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>{icon}</div>
        </div>
        <CircularProgress progress={progress} color={`text-${color}-600 dark:text-${color}-400`} />
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{value}</h3>
          <p className={`text-xs font-bold text-${color}-600 dark:text-${color}-300 bg-${color}-50 dark:bg-${color}-900/30 px-2 py-1.5 rounded-md mt-2 inline-block`}>{sub}</p>
        </div>
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-100 dark:border-${color}-800 group-hover:bg-${color}-100 dark:group-hover:bg-${color}-900/50 transition-colors`}>{icon}</div>
        </div>
        <div className="flex items-center gap-3">
          {progress !== undefined && (
            <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden inset-shadow">
              <div className={`h-full bg-${color}-600 dark:bg-${color}-500 rounded-full`} style={{ width: `${progress}%` }}></div>
            </div>
          )}
          <p className={`text-xs font-bold text-${color}-600 dark:text-${color}-300 bg-${color}-50 dark:bg-${color}-900/30 px-2 py-1 rounded-md`}>{sub}</p>
        </div>
      </>
    )}
  </div>
);

const DailyLogForm = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    course: 'Computer Basics (GCF Global)',
    time: '',
    issues: 'No',
    time: '',
    issues: 'No',
    learning: '',
    proof: null, // [NEW] Proof File
    issueFile: null // [NEW] Issue content
  });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    // Optimistic Object
    const newLog = {
      name: user.name,
      internId: user.internId, // [SECURITY] Pass ID for Optimistic UI & API
      date: getFormattedDateTime(),
      course: formData.course,
      time: formData.time,
      issues: formData.issues,
      issues: formData.issues,
      learning: formData.learning,
      proof: formData.proof ? "Uploading..." : "", // Optimistic placeholder
      file: formData.issueFile ? "Uploading..." : null
    };

    // Helper: Convert to Base64
    const toBase64 = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

    let proof64 = null;
    let issue64 = null;

    if (formData.proof) proof64 = await toBase64(formData.proof);
    if (formData.issueFile) issue64 = await toBase64(formData.issueFile);

    const result = await submitDailyLog(user.name, {
      ...formData,
      internId: user.internId,
      proof: proof64,
      file: issue64
    });
    if (result.success) {
      setStatus('success');
      setFormData({ course: 'Computer Basics (GCF Global)', time: '', issues: 'No', learning: '', proof: null, issueFile: null });
      if (onSuccess) onSuccess(newLog);
      setTimeout(() => setStatus('idle'), 3000);
    } else setStatus('error');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Course Name</label>
          <div className="relative group">
            <select
              value={formData.course}
              onChange={e => setFormData({ ...formData, course: e.target.value })}
              className="w-full text-sm pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium dark:text-white"
            >
              {COURSES.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              <option value="Other">Other</option>
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Time Spent */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Time Spent (e.g. 2 hrs)</label>
          <input
            type="text"
            value={formData.time}
            onChange={e => setFormData({ ...formData, time: e.target.value })}
            placeholder="e.g. 40 mins"
            required
            className="w-full text-sm px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium dark:text-white"
          />
        </div>
      </div>

      {/* Any Issues? */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Any Issues?</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="issues"
              value="No"
              checked={formData.issues === 'No'}
              onChange={e => setFormData({ ...formData, issues: e.target.value })}
              className="accent-indigo-600 w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">No</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="issues"
              value="Yes"
              checked={formData.issues === 'Yes'}
              onChange={e => setFormData({ ...formData, issues: e.target.value })}
              className="accent-red-600 w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Yes</span>
          </label>
        </div>
      </div>

      {/* [NEW] Conditional Issue Screenshot Upload */}
      {formData.issues === 'Yes' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Upload Screenshot of Issue / Source <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input
              type="file"
              onChange={e => setFormData({ ...formData, issueFile: e.target.files[0] })}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-xl file:border-0
                file:text-xs file:font-semibold
                file:bg-red-50 file:text-red-700
                hover:file:bg-red-100
                dark:file:bg-red-900/30 dark:file:text-red-400
                cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
              accept="image/*"
              required
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 ml-1">Attach a screenshot of the error or the problem area.</p>
        </div>
      )}

      {/* [NEW] Optional Proof of Work */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Proof of Work <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <div className="relative group">
          <input
            type="file"
            onChange={e => setFormData({ ...formData, proof: e.target.files[0] })}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-xl file:border-0
              file:text-xs file:font-semibold
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100
              dark:file:bg-sky-900/30 dark:file:text-sky-400
              cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
            accept="image/*,application/pdf"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 ml-1">Upload a screenshot, certification, or badge showing your progress.</p>
      </div>

      {/* Learning Content */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">What did you learn today?</label>
        <textarea
          value={formData.learning}
          onChange={e => setFormData({ ...formData, learning: e.target.value })}
          placeholder="Describe topics covered..."
          required
          className="w-full text-sm p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px] resize-none font-medium dark:text-white"
        ></textarea>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="group w-full py-4 px-6 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-2xl transition-all shadow-xl flex justify-center items-center gap-2"
        >
          {status === 'submitting' ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : status === 'success' ? (
            <><CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600" /> Log Saved!</>
          ) : (
            <>Submit Daily Log <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </div>
    </form>
  );
};

const HistoryList = ({ history }) => {
  if (history.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-4">
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
        <History className="w-8 h-8 text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm font-medium">No activity found yet.</p>
    </div>
  );

  return (
    <div className="relative pl-8 space-y-8 my-4 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-700">
      {history.map((item, idx) => {
        const isAWS = item.course?.includes("AWS");
        const isAI = item.course?.includes("AI") || item.course?.includes("Intelligence");

        // Dynamic Icon Logic
        const Icon = isAWS ? Cloud : isAI ? BrainCircuit : BookOpen;
        // Note: Make sure Cloud/BrainCircuit are imported or use generic fallbacks if not. 
        // fallback to standard icons available in imports: BookOpen, FileText, Globe

        // [FIX] Group by Date ONLY (ignore time)
        const getJustDate = (d) => {
          if (!d) return "";
          // Handle "•" separator from optimistic updates or legacy data
          const cleanDate = d.includes("•") ? d.replace("•", "") : d;
          const dateObj = new Date(cleanDate);
          if (isNaN(dateObj.getTime())) return d; // Fallback to string if invalid
          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };
        const dateStr = getJustDate(item.date);

        // Check prior item for same date
        const prevItem = history[idx - 1];
        const prevDateStr = prevItem ? getJustDate(prevItem.date) : "";
        const showHeader = dateStr !== prevDateStr;

        return (
          <div key={idx} className={`relative group animate-in slide-in-from-bottom-2 duration-500 ${!showHeader ? 'mt-2' : ''}`} style={{ animationDelay: `${idx * 100}ms` }}>
            {/* Timeline Node */}
            <div className={`absolute -left-[29px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center z-10 
              ${isAWS ? 'bg-orange-100 text-orange-600' :
                isAI ? 'bg-purple-100 text-purple-600' :
                  'bg-blue-100 text-blue-600'}`}>
              <FileText className="w-3.5 h-3.5" />
            </div>

            {/* Date Header: Show ONLY if new date */}
            {showHeader && (
              <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900 pr-3 z-10">
                  {dateStr}
                </span>
                <div className="h-[1px] flex-grow bg-slate-100 dark:bg-slate-700"></div>
              </div>
            )}

            {/* If NOT showing header, show time inside card or above it? Let's keep card simple */}

            {/* Card Content */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:shadow-md group-hover:border-slate-200 dark:group-hover:border-slate-600 transition-all">

              {/* Course & Time Header */}
              <div className="mb-3 flex justify-between items-start gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide
                    ${isAWS ? "bg-orange-50 text-orange-700 border border-orange-100" :
                      isAI ? "bg-purple-50 text-purple-700 border border-purple-100" :
                        "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                    {item.course || "General Learning"}
                  </span>

                  {/* Duration Badge */}
                  {(item.duration || item.timeSpent) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide">
                      <Clock className="w-3 h-3" /> {item.duration || item.timeSpent}
                    </span>
                  )}
                </div>

                {/* Time Display */}
                {item.time && (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-md whitespace-nowrap">
                    {item.time}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                {item.learning || item.summary}
              </p>

              {/* Attachments / Footer */}
              {(item.proof || item.file || item.issues === "Yes") && (
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700 flex flex-wrap gap-2">
                  {item.issues === "Yes" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                      <AlertTriangle className="w-3 h-3" /> Issue Reported
                    </span>
                  )}
                  {item.proof && (
                    <a href={item.proof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-sky-600 transition-colors">
                      <ExternalLink className="w-3 h-3" /> Proof
                    </a>
                  )}
                  {item.file && (
                    <a href={item.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-sky-600 transition-colors">
                      <Paperclip className="w-3 h-3" /> File
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CategoryBadge = ({ category }) => {
  const styles = {
    Coding: "bg-blue-100 text-blue-700 border-blue-200",
    Learning: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Research: "bg-purple-100 text-purple-700 border-purple-200",
    Marketing: "bg-orange-100 text-orange-700 border-orange-200",
    "Status Update": "bg-red-100 text-red-700 border-red-200",
  }[category] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${styles} shadow-sm dark:bg-opacity-20`}>
      {category}
    </span>
  );
};

/* --- PROFILE SECTION --- */

const ProfileSection = ({ user, onBack, onUpdate, onUploadStatusChange }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [initialBio, setInitialBio] = useState(user.bio || ''); // NEW: Track initial for validation
  const [photo, setPhoto] = useState(user.photo || null);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatus, setReportStatus] = useState('idle');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [photoStatus, setPhotoStatus] = useState('idle'); // NEW: idle, uploading
  const [validationError, setValidationError] = useState(''); // NEW: For empty save

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoStatus('uploading');
      if (onUploadStatusChange) onUploadStatusChange(true); // Start Navbar Loader

      // 1. Image Processing (Resize & Convert to PNG)
      // This solves the backend issue where it forces ".png" extension.
      // We convert everything to PNG here so it matches the backend logic perfectly.
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = async () => {
          // Calculate new dimensions (Max 800px - good for profile, fast to load)
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get PNG Base64 (Guaranteed PNG for Backend)
          const pngBase64 = canvas.toDataURL('image/png');

          // 2. Optimistic Update (Instant feedback)
          setPhoto(pngBase64);

          // 3. Upload to Backend
          const result = await api.saveProfile({ name: user.name, internId: user.internId, bio, photo: pngBase64 });

          setPhotoStatus('idle');
          if (onUploadStatusChange) onUploadStatusChange(false); // Stop Navbar Loader

          // 4. Confirm with real URL from backend
          if (result.success && result.photo) {
            setPhoto(result.photo);
            if (onUpdate) onUpdate({ photo: result.photo }, true);
          }
        };
        img.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveBio = async () => {
    // 1. Validation: Check if changes were made
    if (bio.trim() === initialBio.trim()) {
      setValidationError("Please update anything for saving the profile");
      setTimeout(() => setValidationError(''), 3000); // Clear after 3s
      return;
    }

    setSaveStatus('saving');
    // Save to App State
    if (onUpdate) onUpdate({ bio });
    // Save to Backend
    const result = await api.saveProfile({ name: user.name, internId: user.internId, bio, photo });
    if (result.success) {
      setSaveStatus('saved');
      setInitialBio(bio); // Reset initial state to current
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReportInactive = async () => {
    if (!reportReason) return;
    setReportStatus('submitting');

    // Log as 'Status Update'
    await submitDailyLog(user.name, {
      category: 'Status Update',
      summary: `INACTIVE REPORT: ${reportReason}`,
      proof: '',
      file: null
    });

    setReportStatus('success');
    setTimeout(() => {
      setShowReportModal(false);
      setReportStatus('idle');
      setReportReason('');
    }, 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
      <button onClick={onBack} className="mb-6 flex items-center text-slate-500 hover:text-slate-800 font-bold text-sm gap-2 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-sky-400 to-blue-600 dark:from-sky-600 dark:to-blue-800"></div>

            <div className="relative z-10 mt-12 mx-auto w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-white dark:bg-slate-800 group-hover:scale-105 transition-transform duration-300">
              {/* Photo or Loader */}
              {photoStatus === 'uploading' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 text-white backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">Updating...</span>
                </div>
              ) : photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 text-4xl font-bold">{user.name.charAt(0)}</div>
              )}
            </div>

            {/* Update Photo Button */}
            <div className="mt-4 flex justify-center">
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" disabled={photoStatus === 'uploading'} />
                <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors text-xs font-bold ring-1 ring-sky-100 dark:ring-sky-800">
                  <Camera className="w-3.5 h-3.5" />
                  {photoStatus === 'uploading' ? 'Uploading...' : 'Update Photo'}
                </div>
              </label>
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{user.internId}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Active Intern
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Report Issue / Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" /> About Me
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none text-slate-700 dark:text-slate-300 font-medium"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <div className="flex flex-col items-end gap-3">
                {/* Validation Error Message */}
                {validationError && (
                  <div className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 animate-in slide-in-from-right-2 fade-in">
                    {validationError}
                  </div>
                )}
                <button
                  onClick={saveBio}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  className={`px-6 py-2 font-bold rounded-xl transition-all flex items-center gap-2 
                    ${saveStatus === 'saved' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'}
                    ${saveStatus === 'saving' ? 'opacity-80 cursor-wait' : ''}
                  `}
                >
                  {saveStatus === 'saving' ? (
                    <><span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></span> Saving...</>
                  ) : saveStatus === 'saved' ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved Successfully!</>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" /> Report Inactive
              </h3>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            {reportStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-slate-900">Report Submitted</h4>
                <p className="text-slate-500 mt-2">Admin has been notified.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-600 text-sm">If you are unable to continue or need a break, please let us know the reason. This will be logged for the admin.</p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none text-slate-700 font-medium"
                  placeholder="Reason for inactivity..."
                ></textarea>
                <button
                  onClick={handleReportInactive}
                  disabled={!reportReason || reportStatus === 'submitting'}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {reportStatus === 'submitting' ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

/* --- ADMIN DASHBOARD --- */

const AdminDashboard = ({ user, onLogout }) => {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]); // New Groups Sate
  const [view, setView] = useState('overview'); // 'overview' | 'monitors'
  const [selectedGroup, setSelectedGroup] = useState(null); // Drill-down state
  const [selectedMember, setSelectedMember] = useState(null); // For Modal
  const [selectedPhoto, setSelectedPhoto] = useState(null); // For Photo Viewer Modal
  const [memberHistory, setMemberHistory] = useState([]); // Logs for modal
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  /* --- CHANGED: Filter by Selected Group + Search --- */
  /* --- CHANGED: Ultra-Robust Name Matching --- */
  const normalize = (str) => {
    if (!str) return "";
    return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  // Helper to find a user object based on the Group Sheet name string
  // Expected format: "Name - Location" or just "Name"
  const findUserForGroupMember = (groupMemberStr) => {
    if (!groupMemberStr) return null;
    const nGroup = normalize(groupMemberStr);

    // 1. Exact Match (Best)
    let match = members.find(m => normalize(m.name) === nGroup);
    if (match) return match;

    // 2. Separator Split (Handle "Name - Location", "Name_Location")
    const separators = /[-_()]/;
    const simpleNameRaw = groupMemberStr.split(separators)[0].trim();
    if (simpleNameRaw && simpleNameRaw.length > 2) {
      const nSimple = normalize(simpleNameRaw);
      match = members.find(m => normalize(m.name) === nSimple);
      if (match) return match;

      // 3. StartsWith Check (Aggressive)
      match = members.find(m => normalize(m.name).startsWith(nSimple));
      if (match) return match;
    }

    // 4. Reverse Check: Does the User Sheet Name *contain* the Group Name?
    const nSimple = normalize(simpleNameRaw); // Recalc if needed
    match = members.find(m => normalize(m.name).includes(nSimple));
    if (match) return match;

    // 5. Permutation Match (Handle "Doe John" vs "John Doe")
    const groupParts = simpleNameRaw.toLowerCase().split(' ').filter(p => p.length > 2);
    if (groupParts.length > 1) {
      match = members.find(m => {
        const userParts = m.name.toLowerCase().split(' ');
        // Check if EVERY significant part of the group name exists in the user name
        return groupParts.every(gp => userParts.some(up => up.includes(gp) || gp.includes(up)));
      });
      if (match) return match;
    }

    return null;
  };

  // filteredMembers is ONLY used for Overview or Search matches now.
  // For Drill-down, we will map selectedGroup.members directly.
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.internId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewLogs = async (member) => {
    setSelectedMember(member);
    setLoadingHistory(true);
    try {
      // [FIX] Pass the ADMIN's Intern ID to unlock the door
      const history = await api.getHistory(member.name, user.internId);
      setMemberHistory(history);
    } catch (e) {
      console.error(e);
    }
    setLoadingHistory(false);
  };

  /* --- NEW: Reusable Group Data Fetcher --- */
  const fetchGroupsData = async () => {
    // 1. Fetch Groups
    const gData = await api.fetchGroups();

    // 2. Fetch Members (to cross-reference names)
    // We fetch members again to ensure we have the latest "Days Completed" stats
    const mData = await fetchAllMembers();
    const validMembers = mData.filter(m =>
      m.name &&
      !m.name.includes("Student Name") &&
      m.internId !== "Intern ID"
    );
    setMembers(validMembers); // Update global members list

    // 3. Process & Rank Groups
    const scoredGroups = gData.map((g, i) => {
      // Map member names to User Objects to get stats
      const groupStats = g.members.map(mStr => {
        // [FIX] ROBUST MATCHING: Handle "Name - Location" format
        const cleanMStr = normalize(mStr);

        let match = validMembers.find(u => {
          const cleanU = normalize(u.name);
          return cleanU === cleanMStr || cleanU.includes(cleanMStr) || cleanMStr.includes(cleanU);
        });

        if (!match) {
          const separators = /[-_()]/;
          const namePart = mStr.split(separators)[0].trim();
          if (namePart.length > 2) {
            const cleanNamePart = normalize(namePart);
            match = validMembers.find(u => {
              const cleanU = normalize(u.name);
              return cleanU === cleanNamePart || cleanU.startsWith(cleanNamePart);
            });
          }
        }
        return match;
      }).filter(Boolean);

      // Calculate Total Days (Sum)
      const totalDays = groupStats.reduce((sum, m) => sum + (m.daysCompleted || 0), 0);

      return { ...g, groupId: g.groupId || `M${i + 1}`, score: totalDays, memberObjects: groupStats };
    });

    // 4. Sort & Rank
    scoredGroups.sort((a, b) => b.score - a.score);

    const rankedGroups = scoredGroups.map((g, i) => ({
      ...g,
      rank: i + 1,
      members: [...g.members].sort((a, b) => a.localeCompare(b))
    }));

    setGroups(rankedGroups);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroupsData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-purple-100 selection:text-purple-900">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 py-3">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-none tracking-tight">Admin Console</h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-wide uppercase">CloudAiLabs</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Navigation Links */}
              <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => { setView('overview'); setSelectedGroup(null); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'overview' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => { setView('monitors'); setSelectedGroup(null); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'monitors' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Monitors
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                  <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-slate-200 pr-1">{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {view === 'monitors' && !selectedGroup ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-purple-500 pl-4">Monitor Groups</h2>
                <p className="text-slate-500 mt-1 pl-5">Displaying {groups.length} active monitor groups</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    const originalText = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = `<span class="animate-spin inline-block mr-2">⟳</span> Syncing...`;
                    await fetchGroupsData();
                    btn.innerHTML = `<span class="text-emerald-600">✔ Updated</span>`;
                    setTimeout(() => { btn.disabled = false; btn.innerHTML = originalText; }, 2000);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Sync Groups
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groups.map((group, idx) => (
                <div key={idx} onClick={() => setSelectedGroup(group)} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative ring-2 ring-transparent hover:ring-purple-500/20">
                  {/* Card Header with Total Days Badge */}
                  <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-100 flex justify-between items-center relative">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md relative ${group.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 ring-2 ring-yellow-200' :
                        group.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 ring-2 ring-slate-200' :
                          group.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-amber-700 ring-2 ring-orange-200' :
                            `bg-gradient-to-br ${idx % 4 === 0 ? 'from-emerald-400 to-teal-500' : idx % 4 === 1 ? 'from-blue-400 to-indigo-500' : idx % 4 === 2 ? 'from-purple-400 to-fuchsia-500' : 'from-orange-400 to-amber-500'}`
                        }`}>
                        {group.rank <= 3 ? (
                          <Trophy className="w-6 h-6 text-white drop-shadow-sm" />
                        ) : (
                          <span className="text-sm">{group.groupId}</span>
                        )}
                        {/* Rank Badge */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border border-slate-100">
                          #{group.rank}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1 flex items-center gap-1">
                          {group.monitor.split('–')[0].split('-')[0]}
                        </h3>
                        {/* [FIX] BIG TOTAL DAYS DISPLAY */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            {Math.round(group.score)} Days
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Total Output</span>
                        </div>
                      </div>
                    </div>
                    {/* Member Count */}
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md border border-slate-200 h-fit self-start">{group.members.length}</span>
                  </div>

                  {/* List */}
                  <div className="p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    {group.members.length > 0 ? (
                      <ul className="space-y-2">
                        {group.members.map((m, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-default">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            <span className="truncate">{m}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Users className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">No members assigned</p>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate px-2">{group.monitor}</p>
                  </div>
                </div>
              ))}
            </div>


          </div>
        ) : (
          <>
            {/* If we are in Monitor View AND have a Selected Group -> Show Header for Group */}
            {view === 'monitors' && selectedGroup && (
              <div className="flex items-center gap-4 mb-6 animate-in slide-in-from-left-4">
                <button onClick={() => setSelectedGroup(null)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-180 text-slate-500" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedGroup.monitor.split('–')[0].split('-')[0]}</h2>
                    <span className="px-3 py-1 bg-yellow-400/10 text-yellow-600 border border-yellow-400/30 rounded-full text-xs font-bold flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Rank #{selectedGroup.rank}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm">Monitor Group • {selectedGroup.members.length} Members</p>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{selectedGroup ? 'Group Members' : 'Total Members'}</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{selectedGroup ? selectedGroup.members.length : members.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Certificate Eligible</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{selectedGroup ? selectedGroup.members.filter(gm => {
                  const m = findUserForGroupMember(gm);
                  return m && m.daysCompleted >= 90;
                }).length : members.filter(m => m.daysCompleted >= 90).length}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Today</p>
                <h3 className="text-3xl font-extrabold text-slate-900">
                  {selectedGroup
                    ? selectedGroup.members.filter(gm => {
                      const m = findUserForGroupMember(gm);
                      // Check lastLogDate (YYYY-MM-DD from backend)
                      if (!m || !m.lastLogDate) return false;
                      return new Date(m.lastLogDate).toDateString() === new Date().toDateString();
                    }).length
                    : members.filter(m => {
                      if (!m.lastLogDate) return false;
                      return new Date(m.lastLogDate).toDateString() === new Date().toDateString();
                    }).length}
                </h3>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-800">Member Progress</h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-64 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading members...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100/80 dark:border-slate-700/80 sticky top-0 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Intern ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(selectedGroup ? [selectedGroup.monitor, ...selectedGroup.members] : filteredMembers).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                            No members found.
                          </td>
                        </tr>
                      ) : (
                        (selectedGroup ? [selectedGroup.monitor, ...selectedGroup.members] : filteredMembers).map((item, idx) => {
                          // LOGIC: If in Drill-down, 'item' is a String (Group Name). If Overview, 'item' is a User Object.
                          let displayMember = null;
                          let displayName = "";
                          const isGroupRow = !!selectedGroup;

                          if (isGroupRow) {
                            // USE THE PRE-CALCULATED OBJECTS!
                            // Note: 'item' here is the raw string from keys. 
                            // But we want to iterate over the RICH OBJECTS we created in Step 1.

                            // Wait, the map above iterates 'selectedGroup.members' (strings).
                            // We should change the iteration source to 'selectedGroup.memberObjects'!
                            // But wait, memberObjects excludes the Monitor if they aren't in the member list?
                            // Usually the Monitor is listed in the members list too?
                            // Let's check logic: groupStats = g.members.map(...)
                            // So yes, memberObjects corresponds 1:1 to members (if found).

                            // BETTER APPROACH:
                            // Find the object corresponding to this string 'item'
                            displayMember = findUserForGroupMember(item);
                            displayName = item;
                          } else {
                            displayMember = item;
                            displayName = item.name;
                          }

                          // If searching in drill-down, filter here
                          if (selectedGroup && searchQuery && !displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return null;
                          }

                          // If we have a user object (displayMember), show their data. Otherwise show placeholder.
                          const hasData = !!displayMember;
                          const m = displayMember || {};

                          return (
                            <tr key={idx} className="group hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 border-b border-slate-50 dark:border-slate-700 last:border-0 text-slate-600 dark:text-slate-300">
                              <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md bg-gradient-to-br overflow-hidden cursor-pointer ${m.photo ? 'bg-white' : (idx % 3 === 0 ? 'from-purple-500 to-indigo-500' :
                                  idx % 3 === 1 ? 'from-pink-500 to-rose-500' :
                                    'from-amber-500 to-orange-500')
                                  }`} onClick={(e) => {
                                    if (m.photo && !m.photo.startsWith('blob:')) {
                                      e.stopPropagation();
                                      setSelectedPhoto(m.photo);
                                    }
                                  }}>
                                  {m.photo && !m.photo.startsWith('blob:') ? (
                                    <img src={m.photo} alt={displayName} className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                  ) : (
                                    (displayName || "?").charAt(0)
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800" title={displayName}>
                                    {displayName}
                                    {/* Monitor Badge */}
                                    {isGroupRow && idx === 0 && (
                                      <span className="ml-2 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold border border-purple-200">
                                        MONITOR
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                    {isGroupRow ? (idx === 0 ? 'Group Lead' : 'Group Member') : 'Intern'}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 font-mono text-xs">
                                {hasData ? m.internId : <span className="text-slate-300 dark:text-slate-600">-</span>}
                              </td>
                              <td className="px-6 py-4">
                                {hasData ? (
                                  <>
                                    <div className="w-full max-w-[140px] h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5 inset-shadow">
                                      <div className={`h-full rounded-full ${m.daysCompleted >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{ width: `${(m.daysCompleted / 90) * 100}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">{m.daysCompleted} <span className="text-slate-300">/</span> 90 Days</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">No Activity Data</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {hasData ? (
                                  m.daysCompleted >= 90 ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" /> Eligible
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                      <Clock className="w-3 h-3" /> In Progress
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                    Unknown
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {hasData && (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => handleViewLogs(m)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-purple-50 hover:text-purple-600 transition-colors border border-slate-200 hover:border-purple-200">
                                      <FileText className="w-3.5 h-3.5" /> View Logs
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        {/* STUDENT LOGS MODAL */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md bg-gradient-to-br from-purple-500 to-indigo-500">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedMember.name}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Intern ID: {selectedMember.internId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-0 overflow-y-auto flex-1 bg-slate-50/30">
                {loadingHistory ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <p className="text-sm font-medium">Loading history...</p>
                  </div>
                ) : memberHistory.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {memberHistory.map((log, idx) => (
                      <div key={idx} className="p-6 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${(log.course || '').includes('Learning') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            (log.course || '').includes('Coding') ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                            {log.course || 'Log'}
                          </span>
                          {/* Duration Badge */}
                          {(log.duration || log.timeSpent) && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide">
                              <Clock className="w-3 h-3" /> {log.duration || log.timeSpent}
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-400">
                            {formatDateForDisplay(log.date)} {log.time && log.time !== "" ? `• ${log.time}` : ""}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">{log.learning}</p>
                        <div className="flex gap-2">
                          {log.proof && (
                            <a href={log.proof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 border border-slate-200 transition-colors">
                              <Paperclip className="w-3 h-3" /> Proof Link
                            </a>
                          )}
                          {log.file && (log.file.startsWith('http') || log.file.startsWith('data:')) && (
                            <a href={log.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-bold hover:bg-sky-100 border border-sky-200 transition-colors">
                              <FileText className="w-3 h-3" /> Attached File
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                    <History className="w-10 h-10 mb-3 opacity-20" />
                    <p>No activity logs found for this user.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PHOTO VIEWER MODAL */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedPhoto(null)}>
            <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
              <img src={selectedPhoto} alt="Full Size" className="max-w-full max-h-full rounded-2xl shadow-2xl border-4 border-white/10" />
              <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* --- COURSES SECTION --- */

// COURSES is now global


// Refactored to use Props for State (Shared Source of Truth)
const CoursesSection = ({ user, statuses, onUpdateStatus, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Learning Path</h2>
          <p className="text-slate-500 dark:text-slate-400">Curated courses for your professional growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {COURSES.map((course) => {
          const status = statuses[course.id] || 'not_started';
          const isCompleted = status === 'completed';
          const isPursuing = status === 'pursuing';

          return (
            <div key={course.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              {/* Decorative Background Blob */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-${course.color}-50 dark:bg-${course.color}-900/10 blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    isPursuing ? 'bg-sky-100 text-sky-700 border-sky-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                    {isCompleted ? 'Completed' : isPursuing ? 'In Progress' : 'Not Started'}
                  </span>
                  <div className={`p-2 rounded-lg bg-${course.color}-50 text-${course.color}-600 dark:bg-slate-700 dark:text-${course.color}-400`}>
                    <ExternalLink className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 transition-colors">{course.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">Provided by {course.provider}</p>

                <div className="mt-auto space-y-3">
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-purple-600 shadow-md hover:shadow-purple-500/25 transition-all"
                  >
                    Start Course
                  </a>

                  {/* Status Toggles */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onUpdateStatus(course.id, 'pursuing')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${isPursuing ? 'bg-white shadow text-sky-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      Pursuing
                    </button>
                    <button
                      onClick={() => onUpdateStatus(course.id, 'completed')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${isCompleted ? 'bg-white shadow text-emerald-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivation & Next Steps */}
      <div className="mt-12 mb-8 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-8 relative overflow-hidden text-center shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-24 h-24 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-indigo-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Coming Soon
          </div>

          <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice."
          </h3>

          <p className="text-indigo-200 text-lg font-medium leading-relaxed">
            You are building the foundation of your future. Complete these core modules to unlock <span className="text-white font-bold decoration-wavy underline decoration-purple-400">Advanced GenAI & Cloud Architecture</span> specializations. The next level awaits!
          </p>
        </div>
      </div>
    </div>
  );
};

/* --- MAIN APP SECTION --- */

const App = () => {
  const [user, setUser] = useState(null);
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // --- DARK MODE LOGIC ---
  const [theme, setTheme] = useState(() => {
    // 1. Check LocalStorage
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    // 2. Check System Preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // --- SHARED COURSE STATE (Frontend Only Fix) ---
  const [courseProgress, setCourseProgress] = useState({});

  useEffect(() => {
    // Apply class to HTML root
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load Course Progress on User Load (Cloud Sync)
  useEffect(() => {
    if (user && user.name) {
      // 1. Try to load from Cloud
      api.fetchCourseProgress(user.name).then(cloudProgress => {
        // 2. Merge with Local if needed, but Cloud is source of truth
        // For simple sync, let's just use cloud.
        if (cloudProgress && Object.keys(cloudProgress).length > 0) {
          setCourseProgress(cloudProgress);
          // Also update local for backup/offline-first feel (optional)
          localStorage.setItem(`courses_${user.name}`, JSON.stringify(cloudProgress));
        } else {
          // Fallback to local if cloud is empty (first time migration)
          const saved = localStorage.getItem(`courses_${user.name}`);
          if (saved) {
            setCourseProgress(JSON.parse(saved));
            // Migrating local to cloud
            api.saveCourseProgress(user.name, JSON.parse(saved));
          }
        }
      });
    }
  }, [user]);

  const updateCourseProgress = (courseId, status) => {
    setCourseProgress(prev => {
      const next = { ...prev, [courseId]: status };

      // Update Local
      localStorage.setItem(`courses_${user?.name}`, JSON.stringify(next));

      // Update Cloud (Background Sync)
      if (user?.name) {
        api.saveCourseProgress(user.name, user.internId, next);
      }

      return next;
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };


  // Auto-Logout on Idle (30 Minutes)
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('intern_user');
  };

  useIdleTimer(() => {
    if (user) {
      console.log("User idle for 30 mins. Logging out.");
      handleLogout();
    }
  }, 30 * 60 * 1000); // 30 Minutes

  // Fetch users from Google Sheet on load
  useEffect(() => {
    // 1. Check LocalStorage for session WITH SAFETY CHECK
    try {
      const savedUser = localStorage.getItem('intern_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);

        // Session Expiry Check (1 Hour)
        const SESSION_DURATION_MS = 60 * 60 * 1000;
        const now = new Date().getTime();
        const loginTime = u.loginTimestamp || 0;

        if (now - loginTime > SESSION_DURATION_MS) {
          console.log("Session expired. Logging out.");
          localStorage.removeItem('intern_user');
          return; // Stop here, user stays null
        }

        setUser(u);
        // Fetch profile to sync photo
        api.getProfile(u.name)
          .then(p => {
            if (p && p.photo) setUser(prev => ({ ...prev, photo: p.photo, bio: p.bio }));
          })
          .catch(err => console.log('Profile fetch failed silently:', err));
      }
    } catch (e) {
      console.error("Session corrupted. Clearing storage.", e);
      localStorage.removeItem('intern_user');
    }

    // 2. Fetch fresh data
    api.fetchUsers()
      .then(data => {
        setDbUsers(data);
        setLoadingUsers(false);

        // [FIX] Sync current user with fresh data (e.g. isMonitor flag)
        const stored = localStorage.getItem('intern_user');
        if (stored) {
          const u = JSON.parse(stored);
          const freshUser = data.find(d => d.name === u.name);
          if (freshUser) {
            // Merge fresh data (like isMonitor) into current session
            const merged = { ...u, ...freshUser };
            // Only update if something changed (deep check is overkill, just set it)
            if (JSON.stringify(u) !== JSON.stringify(merged)) {
              setUser(merged);
              localStorage.setItem('intern_user', JSON.stringify(merged));
            }
          }
        }
      })
      .catch(() => setLoadingUsers(false));
  }, []);

  const handleLogin = (userData) => {
    // Fetch profile on login
    api.getProfile(userData.name).then(p => {
      const fullUser = {
        ...userData,
        ...p,
        loginTimestamp: new Date().getTime() // Store Login Time
      };
      setUser(fullUser);
      localStorage.setItem('intern_user', JSON.stringify(fullUser));
    });
  };

  const updateProfile = (newData, saveToStorage = true) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      // Preserve timestamp if it exists, else add it
      if (!updated.loginTimestamp) updated.loginTimestamp = prev.loginTimestamp || new Date().getTime();

      if (saveToStorage) {
        try {
          localStorage.setItem('intern_user', JSON.stringify(updated));
        } catch (e) {
          console.error("LocalStorage Update Failed:", e);
        }
      }
      return updated;
    });
  };

  return (
    <GlobalErrorBoundary>
      {user ? (
        user.role === 'admin' ? (
          <AdminDashboard user={user} onLogout={handleLogout} toggleTheme={toggleTheme} theme={theme} />
        ) : (
          <Dashboard
            user={user}
            onLogout={handleLogout}
            onUpdateProfile={updateProfile}
            toggleTheme={toggleTheme}
            theme={theme}
            courseProgress={courseProgress}
            onUpdateCourseProgress={updateCourseProgress}
          />
        )
      ) : loadingUsers ? (
        <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">Loading Intern Portal...</div>
      ) : (
        <LoginScreen onLogin={handleLogin} users={dbUsers} toggleTheme={toggleTheme} theme={theme} />
      )}
    </GlobalErrorBoundary>
  );
};

export default App;
