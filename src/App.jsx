import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Clock, LogOut, LayoutDashboard, History, FileText, ChevronRight, User, Briefcase, BarChart3, Search, Instagram, Linkedin, Paperclip, AlertTriangle, X, Camera, Lock, RefreshCw } from 'lucide-react';
import logo from './assets/logo.png';

import { api } from './services/api';

/* --- HELPERS --- */
const getTodayDateString = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const getFormattedDateTime = () => {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).replace(',', ' •');
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


/* --- API HELPERS --- */

export async function submitDailyLog(userName, formData) {
  try {
    const result = await api.submitLog({
      name: userName,
      date: getFormattedDateTime(), // Send full date & time
      category: formData.category,
      summary: formData.summary,
      proof: formData.proof,
      file: formData.file
    });
    return result;
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function fetchStudentHistory(studentName) {
  return await api.getHistory(studentName);
}

export async function fetchAllMembers() {
  const users = await api.fetchUsers();
  // Add placeholder data for Admin UI compatibility
  return users.filter(u => u.role === 'user').map(u => ({
    ...u,
    daysCompleted: 0,
    history: []
  }));
}

/* --- COMPONENTS --- */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Profile Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-4 text-sm">We couldn't load this section.</p>
          <button onClick={this.props.onReset} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm">Go Back</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoginScreen = ({ onLogin, users }) => {
  const [name, setName] = useState('');
  const [internId, setInternId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // NEW: Success state
  const [error, setError] = useState('');

  /* --- CHANGED: Autocomplete Logic --- */
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredUsers = users.filter(u =>
    u.role !== 'admin' && u.name.toLowerCase().includes(name.toLowerCase())
  );

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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 selection:bg-sky-100 selection:text-sky-900 overflow-hidden relative">
      {/* Background Decor - mimicking the website vibe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-sky-400/20 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-brand-glow border border-white/50 overflow-hidden transform transition-all hover:scale-[1.01] duration-500 relative z-10">
        <div className="p-10 text-center">
          <div className="relative z-10 animate-fly-in">
            <div className="w-40 h-40 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-sky-100 ring-1 ring-slate-100 p-6 animate-float">
              <img src={logo} alt="CloudAiLabs Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">CloudAiLabs</h2>
            <p className="text-slate-500 mt-2 font-medium tracking-wide text-sm uppercase">Activity Tracker</p>
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
                  className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-slate-700 font-medium group-hover:bg-white group-hover:shadow-sm"
                />
                <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && name && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {filteredUsers.map((u, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 hover:bg-sky-50 cursor-pointer text-slate-700 font-medium transition-colors"
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
                  type="password"
                  value={internId}
                  onChange={(e) => setInternId(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 font-medium group-hover:bg-white group-hover:shadow-sm"
                />
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

const Dashboard = ({ user, onLogout, onUpdateProfile }) => {
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'profile'

  /* --- NEW: Loading & Refresh State --- */
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate progress based on history
  const daysCompleted = history.length;
  const todayStr = getTodayDateString();

  // --- SMART LOCK LOGIC ---
  const [lockStatus, setLockStatus] = useState({ locked: false, reason: 'idle' });

  useEffect(() => {
    // 1. Get Latest Log Time
    let lastLogDate = null;

    // Check History (First item is newest)
    if (history.length > 0) {
      const dStr = history[0].date;
      if (dStr.includes('T') && dStr.includes('Z')) {
        lastLogDate = new Date(dStr); // ISO
      } else {
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
    fetchStudentHistory(user.name).then(data => {
      setHistory(data);
      // Artificial delay for premium feel
      setTimeout(() => setInitialLoading(false), 2000);
    });
  }, [user.name]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const data = await fetchStudentHistory(user.name);
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
      fetchStudentHistory(user.name).then(setHistory);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/80 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 py-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-none tracking-tight">CloudAiLabs</h1>
                <p className="text-xs text-sky-500 font-semibold mt-0.5 tracking-wide uppercase">Activity Tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('profile')}
                className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-xs ring-2 ring-white overflow-hidden">
                  {/* Show Profile Photo if available locally, else Initial */}
                  {localStorage.getItem(`photo_${user.name}`) ? (
                    <img src={localStorage.getItem(`photo_${user.name}`)} alt={user.name} className="w-full h-full object-cover" />
                  ) : user.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-slate-700 pr-1 group-hover:text-sky-600 transition-colors">{user.name}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow">

        {view === 'profile' ? (
          <ErrorBoundary onReset={() => setView('dashboard')}>
            <ProfileSection user={user} onBack={() => setView('dashboard')} onUpdate={user.role !== 'admin' ? onUpdateProfile : null} />
          </ErrorBoundary>
        ) : (
          <>
            {/* --- NEW: Premium Welcome Loading Screen --- */
              initialLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl animate-out fade-out duration-700 pointer-events-none">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-sky-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src={logo} alt="Loading" className="w-10 h-10 object-contain opacity-50 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="mt-8 text-xl font-bold text-slate-800 tracking-tight animate-pulse">Loading your progress...</h2>
                  <p className="text-slate-400 text-sm font-medium mt-2">Connecting to CloudAiLabs Database</p>
                </div>
              )}

            {/* Welcome & Stats */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
                <p className="text-sm font-medium text-slate-500">Last updated: Just now</p>
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
                  label="Logs Submitted"
                  value={daysCompleted}
                  sub="Total Active Days"
                  icon={<FileText className="w-6 h-6 text-emerald-600" />}
                  color="emerald"
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Main Content Form - Wider */}
              <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600">
                        <FileText className="w-4 h-4" />
                      </span>
                      Submit Daily Log
                    </h3>
                    <span className="text-xs font-bold px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
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
                            Great job! You've successfully recorded your activity today. Come back tomorrow to keep your streak alive.
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
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[650px]">
                  <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center z-10">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600">
                        <History className="w-4 h-4" />
                      </span>
                      Recent Activity
                    </h3>
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
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
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Cloud AI Labs</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Cloud-native IT consulting and education NGO with a PAN-India presence, specializing in Cloud Pre-Sales, Project Delivery, and AI-driven solutions.
              </p>
              <div className="flex gap-3">
                <a href="https://www.linkedin.com/in/akhil-singh-gautam/" target="_blank" rel="noreferrer" className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-200 transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href="https://www.instagram.com/cloudailabs.in?igsh=cmVoNDEwZWhraWxi" target="_blank" rel="noreferrer" className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 hover:bg-pink-200 transition-colors"><Instagram className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-slate-500 font-medium">
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Home</a></li>
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Internship Program</a></li>
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Our Services</a></li>
                <li><a href="https://www.cloudailabs.in" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors">Request a Quote</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Us</h3>
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
          <div className="border-t border-slate-100 mt-12 pt-8 text-center text-xs text-slate-400 font-medium">
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
          className="text-slate-100"
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
        <span className="text-2xl font-bold text-slate-800">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, progress, color, variant }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col justify-between">
    {variant === 'circle' ? (
      <div className="flex flex-col items-center justify-center text-center h-full gap-4">
        <div className="flex justify-between w-full mb-2">
          <p className="text-sm font-bold text-slate-400 tracking-wider uppercase">{label}</p>
          <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600`}>{icon}</div>
        </div>
        <CircularProgress progress={progress} color={`text-${color}-600`} />
        <div>
          <h3 className="text-xl font-bold text-slate-900">{value}</h3>
          <p className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-1.5 rounded-md mt-2 inline-block`}>{sub}</p>
        </div>
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-${color}-50 border border-${color}-100 group-hover:bg-${color}-100 transition-colors`}>{icon}</div>
        </div>
        <div className="flex items-center gap-3">
          {progress !== undefined && (
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden inset-shadow">
              <div className={`h-full bg-${color}-600 rounded-full`} style={{ width: `${progress}%` }}></div>
            </div>
          )}
          <p className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-1 rounded-md`}>{sub}</p>
        </div>
      </>
    )}
  </div>
);

const DailyLogForm = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({ category: 'Learning', summary: '', proof: '', file: null });
  const [status, setStatus] = useState('idle');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, file: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    // Construct log object for optimistic update
    const newLog = {
      name: user.name,
      date: getFormattedDateTime(), // Use full date-time for immediate feedback
      category: formData.category,
      summary: formData.summary,
      proof: formData.proof,
      file: formData.file
    };

    const result = await submitDailyLog(user.name, formData);
    if (result.success) {
      setStatus('success');
      setFormData({ category: 'Learning', summary: '', proof: '', file: null });
      if (onSuccess) onSuccess(newLog); // Pass data back
      setTimeout(() => setStatus('idle'), 3000);
    } else setStatus('error');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
          <div className="relative group">
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-sm pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none font-medium group-hover:bg-slate-100"
            >
              <option>Learning</option>
              <option>Coding</option>
              <option>Marketing</option>
              <option>Research</option>
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 rotate-90 pointer-events-none group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">Proof Link <span className="text-slate-400 font-normal">(Optional)</span></label>
          <div className="relative group">
            <input
              type="text"
              value={formData.proof}
              onChange={e => setFormData({ ...formData, proof: e.target.value })}
              placeholder="https://github.com/..."
              className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium group-hover:bg-slate-100"
            />
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Upload Files</label>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer relative">
          <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-1">
              <Upload className="w-5 h-5" />
            </div>
            {formData.file ? (
              <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> File Selected</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500">SVG, PNG, JPG or PDF (max. 5MB)</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Work Summary</label>
        <div className="relative group">
          <textarea
            value={formData.summary}
            onChange={e => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Describe what you accomplished today..."
            required
            className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[180px] resize-none transition-all placeholder:text-slate-400 leading-relaxed font-medium group-hover:bg-slate-100"
          ></textarea>
        </div>
        <p className="text-right text-xs text-slate-400 mt-2 font-medium">Be specific and concise.</p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="group w-full py-4 px-6 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-75 disabled:shadow-none disabled:transform-none flex justify-center items-center gap-2"
        >
          {status === 'submitting' ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : status === 'success' ? (
            <><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Log Saved!</>
          ) : (
            <>Submit Daily Log <span className="bg-white/10 p-1 rounded-md group-hover:translate-x-1 transition-transform"><ChevronRight className="w-4 h-4" /></span></>
          )}
        </button>
      </div>
    </form>
  );
};

const HistoryList = ({ history }) => {
  if (history.length === 0) return <div className="p-12 text-center text-slate-400 text-sm font-medium">No activity found.</div>;

  return (
    <div className="divide-y divide-slate-50">
      {history.map((item, idx) => (
        <div key={idx} className="p-6 hover:bg-slate-50 transition-colors group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{formatDateForDisplay(item.date)}</span>
            <CategoryBadge category={item.category} />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed mb-4 font-medium">{item.summary}</p>
          <div className="flex gap-2">
            {item.proof && (
              <a href={item.proof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-indigo-100 border border-indigo-100">
                <Upload className="w-3 h-3" /> View Proof
              </a>
            )}
            {item.file && (
              <a href={item.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-emerald-100 border border-emerald-100">
                <Paperclip className="w-3 h-3" /> View Upload
              </a>
            )}
          </div>
        </div>
      ))}
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
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${styles} shadow-sm`}>
      {category}
    </span>
  );
};

/* --- PROFILE SECTION --- */

const ProfileSection = ({ user, onBack, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [photo, setPhoto] = useState(user.photo || null);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatus, setReportStatus] = useState('idle'); // idle, submitting, success
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newPhoto = reader.result;
        setPhoto(newPhoto);
        if (onUpdate) onUpdate({ photo: newPhoto }); // Optimistic Local Update (Base64)

        // Save to backend & Get Drive URL
        const result = await api.saveProfile({ name: user.name, bio, photo: newPhoto });

        // If successful, update state with the PERMANENT Drive URL to free up memory
        if (result.success && result.photo) {
          setPhoto(result.photo);
          if (onUpdate) onUpdate({ photo: result.photo });

          // Also update LocalStorage with the clean URL, not the heavy Base64
          localStorage.setItem(`photo_${user.name}`, result.photo);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveBio = async () => {
    setSaveStatus('saving');
    // Save to App State
    if (onUpdate) onUpdate({ bio });
    // Save to Backend
    const result = await api.saveProfile({ name: user.name, bio, photo });
    if (result.success) {
      setSaveStatus('saved');
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
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-sky-400 to-blue-600"></div>

            <div className="relative z-10 mt-12 mx-auto w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white group-hover:scale-105 transition-transform duration-300">
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-4xl font-bold">{user.name.charAt(0)}</div>
              )}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <Camera className="w-8 h-8" />
                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
              </label>
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 font-medium text-sm">{user.internId}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Active Intern
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2 px-4 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Report Issue / Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" /> About Me
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none text-slate-700 font-medium"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveBio}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  className={`px-6 py-2 font-bold rounded-xl transition-all flex items-center gap-2 
                    ${saveStatus === 'saved' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-900 text-white hover:bg-slate-800'}
                    ${saveStatus === 'saving' ? 'opacity-80 cursor-wait' : ''}
                  `}
                >
                  {saveStatus === 'saving' ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllMembers().then(data => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-purple-100 selection:text-purple-900">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <LayoutDashboard className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-none tracking-tight">Admin Console</h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-wide uppercase">CloudAiLabs</p>
              </div>
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
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Members</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{members.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Certificate Eligible</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{members.filter(m => m.daysCompleted >= 90).length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Today</p>
            <h3 className="text-3xl font-extrabold text-slate-900">
              {members.filter(m => m.history.some(h => new Date(h.date).toDateString() === new Date().toDateString())).length}
            </h3>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Member Progress</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Search members..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-64" />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading members...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Intern ID</th>
                    <th className="px-6 py-4">Progress (Days)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {members.map((member, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">{member.name.charAt(0)}</div>
                        {member.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{member.internId}</td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[140px] h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                          <div className={`h-full rounded-full ${member.daysCompleted >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${(member.daysCompleted / 90) * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{member.daysCompleted} / 90 Days</span>
                      </td>
                      <td className="px-6 py-4">
                        {member.daysCompleted >= 90 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline mr-4">View Logs</button>
                        <button className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline">Files</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users from Google Sheet on load
  useEffect(() => {
    // 1. Check LocalStorage for session
    const savedUser = localStorage.getItem('intern_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      // Fetch profile to sync photo
      api.getProfile(u.name)
        .then(p => {
          if (p && p.photo) setUser(prev => ({ ...prev, photo: p.photo, bio: p.bio }));
        })
        .catch(err => console.log('Profile fetch failed silently:', err));
    }

    // 2. Fetch fresh data
    api.fetchUsers()
      .then(data => {
        setDbUsers(data);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  }, []);

  const handleLogin = (userData) => {
    // Fetch profile on login
    api.getProfile(userData.name).then(p => {
      const fullUser = { ...userData, ...p };
      setUser(fullUser);
      localStorage.setItem('intern_user', JSON.stringify(fullUser));
    });
  };

  const updateProfile = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('intern_user', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('intern_user');
  };

  if (user) {
    if (user.role === 'admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    }
    return <Dashboard user={user} onLogout={handleLogout} onUpdateProfile={updateProfile} />;
  }

  if (loadingUsers) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Intern Portal...</div>;
  }

  return <LoginScreen onLogin={handleLogin} users={dbUsers} />;
}

export default App;
