import React, { useState, useEffect, useMemo } from 'react';
import { IsolatedProfile } from './IsolatedProfile'; // [NEW]
import {
    LogOut, Clock, FileText, CheckCircle2, ChevronRight,
    ArrowLeft, Calendar, BarChart3, Quote, Sparkles,
    BookOpen, Target, History, PenTool, X, User, Camera, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import logo from '../assets/logo.png';
import { ENGLISH_MOTIVATION, HINDI_MOTIVATION } from './MotivationalData'; // [NEW]

// --- CONSTANTS ---
const UPSC_COURSES = [
    { id: 'polity', title: 'Polity', color: 'orange', icon: '⚖️' },
    { id: 'geography', title: 'Geography', color: 'emerald', icon: '🌍' },
    { id: 'economy', title: 'Economy', color: 'indigo', icon: '💰' },
    { id: 'science_tech', title: 'Science and Technology', color: 'blue', icon: '🚀' },
    { id: 'environment', title: 'Environment', color: 'green', icon: '🌳' },
    { id: 'history_modern', title: 'Modern History', color: 'amber', icon: '📜' },
    { id: 'history_ancient', title: 'Ancient History', color: 'yellow', icon: '🏺' },
    { id: 'history_medieval', title: 'Medieval History', color: 'yellow', icon: '🏰' },
    { id: 'history_world', title: 'World History', color: 'slate', icon: '🗺️' },
    { id: 'art_culture', title: 'Art & Culture', color: 'pink', icon: '🎨' },
    { id: 'ethics', title: 'Ethics, Integrity and Aptitude', color: 'purple', icon: '🧘' },
    { id: 'ir', title: 'International Relations', color: 'cyan', icon: '🤝' },
    { id: 'society', title: 'Society, Social Issues, Social Justice', color: 'rose', icon: '👥' },
    { id: 'security', title: 'Internal Security', color: 'red', icon: '🛡️' },
    { id: 'governance', title: 'Governance', color: 'teal', icon: '🏛️' },
    { id: 'disaster_mgmt', title: 'Disaster Management', color: 'stone', icon: '🚑' },
    { id: 'post_independence', title: 'Post Independence', color: 'orange', icon: '🇮🇳' },
    { id: 'essay', title: 'Essay', color: 'violet', icon: '✍️' },
    { id: 'current_affairs', title: 'Current Affairs', color: 'sky', icon: '📰' },
    { id: 'samvaad', title: 'Samvaad', color: 'lime', icon: '🗨️' }
];


// --- HELPERS ---
const isHindi = (text) => {
    return /[\u0900-\u097F]/.test(text);
};

const getFormattedDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return `${date} • ${time}`;
};

const parseHours = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
};

export const IsolatedDashboard = ({ user, onLogout }) => {
    // --- STATE ---
    // Core Data
    const [history, setHistory] = useState(() => {
        if (typeof window !== 'undefined' && window.__PRELOADED_HISTORY__) {
            const data = window.__PRELOADED_HISTORY__;
            window.__PRELOADED_HISTORY__ = null;
            return data;
        }
        return [];
    });
    const [loading, setLoading] = useState(() => history.length === 0);

    // UI State
    const [selectedSubject, setSelectedSubject] = useState(null); // null = Home, Object = Subject View
    const [subjectTab, setSubjectTab] = useState('log'); // 'log' or 'history'
    const [showProfile, setShowProfile] = useState(false); // [NEW] Profile View

    // Random Content - Single Quote State
    const [dailyQuote, setDailyQuote] = useState("");
    const [dailyMotivation, setDailyMotivation] = useState("");

    // User Profile State (Local Override)
    const [localUser, setLocalUser] = useState(user);

    // Form State
    const [formParams, setFormParams] = useState({
        time: '',
        issues: 'No',
        learning: '',
        proof: null,
        issueFile: null
    });
    const [submitStatus, setSubmitStatus] = useState('idle');

    // --- EFFECTS ---
    useEffect(() => {
        // Toggle Logic for Quote Language
        // Default to 'English' if no preference
        const lastLang = localStorage.getItem('urbashi_quote_lang');
        let nextLang = 'english'; // Default first

        if (lastLang === 'english') {
            nextLang = 'hindi';
        } else if (lastLang === 'hindi') {
            nextLang = 'english';
        }

        // Save for next refresh
        localStorage.setItem('urbashi_quote_lang', nextLang);

        // Pick Quote
        if (nextLang === 'english') {
            setDailyQuote(ENGLISH_MOTIVATION[Math.floor(Math.random() * ENGLISH_MOTIVATION.length)]);
        } else {
            setDailyQuote(HINDI_MOTIVATION[Math.floor(Math.random() * HINDI_MOTIVATION.length)]);
        }

        // Motivation uses separate internal list or just generic welcome
        setDailyMotivation(ENGLISH_MOTIVATION[Math.floor(Math.random() * ENGLISH_MOTIVATION.length)]); // Re-using english list for sub-header
        fetchHistory();
    }, []);

    // Scroll to top when switching views
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedSubject, subjectTab]);

    const fetchHistory = async () => {
        if (!loading && history.length > 0) return;
        try {
            if (user.name && user.internId) {
                const data = await api.getHistory(user.name, user.internId);
                setHistory(data);
            }
        } catch (e) {
            console.error("Failed to fetch history", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setSubjectTab('log'); // Default to log view
        setFormParams({ time: '', issues: 'No', learning: '', proof: null, issueFile: null }); // Reset form
    };

    const handleBack = () => {
        setSelectedSubject(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus('submitting');

        // Use the selected subject's title
        const courseTitle = selectedSubject.title;

        // File Handling
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        let proof64 = null;
        let issue64 = null;
        if (formParams.proof) proof64 = await toBase64(formParams.proof);
        if (formParams.issueFile) issue64 = await toBase64(formParams.issueFile);

        try {
            await api.submitLog({
                name: user.name,
                internId: user.internId,
                date: getFormattedDateTime(),
                category: courseTitle,
                time: formParams.time,
                issues: formParams.issues,
                summary: formParams.learning,
                proof: proof64,
                file: issue64
            });

            const newLog = {
                date: getFormattedDateTime(),
                course: courseTitle,
                time: formParams.time,
                issues: formParams.issues,
                learning: formParams.learning,
                proof: proof64 ? "uploaded" : "",
                file: issue64 ? "uploaded" : ""
            };

            setHistory(prev => [newLog, ...prev]);
            localStorage.setItem(`lastLogTime_${user.name}`, new Date().toISOString());

            setSubmitStatus('success');
            setFormParams({ time: '', issues: 'No', learning: '', proof: null, issueFile: null });

            // Switch to history tab after success to show the log
            setTimeout(() => {
                setSubmitStatus('idle');
                setSubjectTab('history');
            }, 1000);

        } catch (e) {
            console.error(e);
            setSubmitStatus('error');
        }
    };

    // --- DERIVED DATA ---
    // Filter history for the selected subject
    const subjectHistory = useMemo(() => {
        if (!selectedSubject) return [];
        return history.filter(h => {
            const c = h.course || h.category;
            return c && c.toLowerCase().includes(selectedSubject.title.toLowerCase());
        });
    }, [history, selectedSubject]);

    // Stats
    const totalDaysActive = useMemo(() => {
        const uniqueDays = new Set(history.map(h => h.date?.split('•')[0].trim()));
        return uniqueDays.size;
    }, [history]);

    const totalLogs = history.length;

    // Mastery Calculations
    const getSubjectLevel = (subjectTitle) => {
        const relevantLogs = history.filter(h => {
            const c = h.course || h.category;
            return c && c.toLowerCase().includes(subjectTitle.toLowerCase());
        });

        const totalHours = relevantLogs.reduce((acc, curr) => acc + parseHours(curr.time), 0);

        if (totalHours > 50) return { level: 'Master', color: 'text-purple-600 bg-purple-50', hours: totalHours, width: '100%' };
        if (totalHours > 20) return { level: 'Expert', color: 'text-indigo-600 bg-indigo-50', hours: totalHours, width: '66%' };
        if (totalHours > 5) return { level: 'Intermediate', color: 'text-blue-600 bg-blue-50', hours: totalHours, width: '33%' };
        return { level: 'Novice', color: 'text-slate-500 bg-slate-50', hours: totalHours, width: '5%' };
    };

    // Heatmap Data (Last 90 Days)
    const heatmapData = useMemo(() => {
        const days = [];
        const today = new Date();
        const activeDates = new Set(history.map(h => {
            const dateStr = h.date ? h.date.split('•')[0].trim() : '';
            return new Date(dateStr).toDateString();
        }));

        for (let i = 89; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const isToday = i === 0;
            days.push({
                date: d,
                active: activeDates.has(d.toDateString()),
                isToday
            });
        }
        return days;
    }, [history]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 leading-none">CloudAiLabs</h1>
                                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Civil Services Wing</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowProfile(true)} className="relative group transition-all" title="Profile">
                                {localUser.photo ? (
                                    <div className="w-10 h-10 rounded-full border-2 border-indigo-100 p-0.5 hover:border-indigo-300 transition-colors">
                                        <img src={localUser.photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </button>
                            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">

                {/* Profile Section */}
                {showProfile && (
                    <IsolatedProfile
                        user={localUser}
                        onBack={() => setShowProfile(false)}
                        onUpdate={(updates) => setLocalUser(prev => ({ ...prev, ...updates }))}
                    />
                )}

                {/* Header Section */}
                {!selectedSubject && !showProfile && (
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-all duration-500">
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        {localUser.photo ? (
                                            <div className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg overflow-hidden">
                                                <img src={localUser.photo} alt="Profile" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <span className="text-4xl">✨</span>
                                        )}
                                        <div>
                                            <h1 className="text-xl md:text-2xl font-bold text-indigo-100">Hello, {localUser.name.split(' ')[0]}!</h1>
                                            <p className="text-white text-lg md:text-xl font-medium mt-1 leading-relaxed">"{dailyMotivation}"</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-8 mt-6">
                                        <div>
                                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Total Days Active</p>
                                            <p className="text-3xl font-bold">{totalDaysActive}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Total Logs</p>
                                            <p className="text-3xl font-bold">{totalLogs}</p>
                                        </div>
                                        <div className="hidden md:block w-px bg-indigo-500/30 mx-4"></div>
                                        <div className="flex-1 min-w-[200px]">
                                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">
                                                {isHindi(dailyQuote) ? "आज का विचार" : "Thought for the Day"}
                                            </p>
                                            <p className="text-sm text-indigo-100 italic">"{dailyQuote}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Consistency Heatmap */}
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 self-end md:self-auto">
                                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2 text-right">Study Consistency</p>
                                    <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
                                        {heatmapData.map((d, i) => (
                                            <div
                                                key={i}
                                                title={d.date.toDateString()}
                                                className={`w-2 h-2 rounded-sm transition-all ${d.active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' :
                                                    d.isToday ? 'bg-white/20 animate-pulse' : 'bg-white/5'
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Pattern */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                )}

                {/* --- HOME VIEW: Subject Grid --- */}
                {!selectedSubject && !showProfile && (
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" /> Your Subjects
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {UPSC_COURSES.map((course) => {
                                const stats = getSubjectLevel(course.title);
                                return (
                                    <button
                                        key={course.id}
                                        onClick={() => handleSubjectClick(course)}
                                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all text-left group relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${course.color}-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`}></div>
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div className={`w-12 h-12 rounded-xl bg-${course.color}-50 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                                                {course.icon}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{course.title}</h3>

                                        {/* Mastery Level Badge */}
                                        <div className="mt-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold ${stats.color.split(' ')[0]}`}>{stats.level}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{Math.round(stats.hours)}h</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${stats.color.replace('bg-', 'bg-').split(' ')[0].replace('text-', 'bg-')}`}
                                                    style={{ width: stats.width }}
                                                ></div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- SUBJECT DETAIL VIEW --- */}
                {selectedSubject && !showProfile && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Detail Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={handleBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="text-3xl">{selectedSubject.icon}</span> {selectedSubject.title}
                                </h2>
                                <p className="text-slate-500 text-sm">Track your progress and logs for this subject.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Left: Navigation Panel */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm">
                                    <button
                                        onClick={() => setSubjectTab('log')}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-3 font-bold transition-all ${subjectTab === 'log'
                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subjectTab === 'log' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100'}`}>
                                            <PenTool className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="leading-none mb-1">Make an Entry</div>
                                            <div className="text-[10px] opacity-70 font-normal">Log today's study session</div>
                                        </div>
                                        {subjectTab === 'log' && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>

                                    <button
                                        onClick={() => setSubjectTab('history')}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-3 font-bold transition-all ${subjectTab === 'history'
                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subjectTab === 'history' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100'}`}>
                                            <History className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="leading-none mb-1">View History</div>
                                            <div className="text-[10px] opacity-70 font-normal">{subjectHistory.length} logs recorded</div>
                                        </div>
                                        {subjectTab === 'history' && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                </div>

                                {/* Mini Stats for Subject */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Subject Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">Total Sessions</span>
                                            <span className="text-xl font-bold text-slate-900">{subjectHistory.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">Last Studied</span>
                                            <span className="text-sm font-bold text-indigo-600">
                                                {subjectHistory.length > 0 ? subjectHistory[0].date?.split('•')[0] : 'Never'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Content Area */}
                            <div className="lg:col-span-8">

                                {subjectTab === 'log' && (
                                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-slate-800">Log Activity</h3>
                                            <p className="text-slate-500 text-sm">What did you study in {selectedSubject.title} today?</p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Time Spent</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 2 Hours"
                                                        value={formParams.time}
                                                        onChange={e => setFormParams({ ...formParams, time: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Issues?</label>
                                                    <select
                                                        value={formParams.issues}
                                                        onChange={e => setFormParams({ ...formParams, issues: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none"
                                                    >
                                                        <option value="No">No Issues</option>
                                                        <option value="Yes">Yes, I faced an issue</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Summary / Topics Covered</label>
                                                <textarea
                                                    placeholder={`Enter detailed summary of ${selectedSubject.title}...`}
                                                    value={formParams.learning}
                                                    onChange={e => setFormParams({ ...formParams, learning: e.target.value })}
                                                    className="w-full p-4 h-32 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                                    required
                                                ></textarea>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submitStatus === 'submitting'}
                                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                            >
                                                {submitStatus === 'submitting' ? (
                                                    <span>Saving...</span>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span>Save Entry</span>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {subjectTab === 'history' && (
                                    <div className="space-y-4">
                                        {subjectHistory.length === 0 ? (
                                            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 border-dashed">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                                    📜
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">No History Yet</h3>
                                                <p className="text-slate-500 text-sm mt-1">
                                                    You haven't logged any activity for {selectedSubject.title} yet.
                                                </p>
                                                <button onClick={() => setSubjectTab('log')} className="mt-4 text-indigo-600 font-bold hover:underline">
                                                    Log your first session
                                                </button>
                                            </div>
                                        ) : (
                                            subjectHistory.map((item, idx) => (
                                                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{item.date?.split('•')[0]}</span>
                                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{item.time || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{item.learning || item.summary}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};
