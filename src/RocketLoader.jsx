import React, { useEffect, useState } from 'react';
import { Rocket, Sparkles, CheckCircle2, ShieldCheck, Database, LayoutDashboard } from 'lucide-react';
import logo from './assets/logo.png';

const RocketLoader = () => {
    const [phase, setPhase] = useState(1); // 1: Rocket Launch, 2: Loading Text
    const [loadingText, setLoadingText] = useState("Authenticating...");

    useEffect(() => {
        // 60-40 SPLIT
        // Total Time: 7000ms
        // Phase 1 (Rocket): 60% = 4200ms
        // Phase 2 (Loader): 40% = 2800ms

        // Switch to Phase 2 after 4.2s
        const timer = setTimeout(() => {
            setPhase(2);
        }, 4200);

        return () => clearTimeout(timer);
    }, []);

    // Cycling Text for Phase 2
    useEffect(() => {
        if (phase === 2) {
            const texts = [
                { msg: "Authenticating Securely...", icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
                { msg: "Fetching User Profile...", icon: <Database className="w-4 h-4 text-blue-400" /> },
                { msg: "Syncing Dashboard Widget...", icon: <LayoutDashboard className="w-4 h-4 text-purple-400" /> },
                { msg: "Almost There...", icon: <Sparkles className="w-4 h-4 text-amber-400" /> }
            ];

            let index = 0;
            setLoadingText(texts[0]); // Initial

            const interval = setInterval(() => {
                index = (index + 1) % texts.length;
                setLoadingText(texts[index]);
            }, 700); // Change text every 700ms (2800ms / 4 steps)

            return () => clearInterval(interval);
        }
    }, [phase]);

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-950 overflow-hidden flex flex-col items-center justify-center font-sans tracking-tight">

            {/* Background Stars - Persistent */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80"></div>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white/30 rounded-full w-[1px] md:w-0.5"
                        style={{
                            height: `${Math.random() * 80 + 20}px`,
                            left: `${Math.random() * 100}%`,
                            top: '-100px',
                            animation: `rain 0.8s linear infinite`,
                            animationDelay: `${Math.random() * 2}s`,
                            opacity: Math.random() * 0.4 + 0.1
                        }}
                    />
                ))}
            </div>

            {/* PHASE 1: ROCKET (60% Time = 4.2s) */}
            <div className={`transition-all duration-700 ease-in-out absolute inset-0 flex items-center justify-center ${phase === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                <div className="relative flex flex-col items-center animate-[rocket-fly_4.2s_cubic-bezier(0.4,0,0.2,1)_forwards]">

                    {/* ROCKET ICON */}
                    <div className="relative z-10 p-6">
                        <Rocket className="w-32 h-32 md:w-40 md:h-40 text-white fill-white drop-shadow-[0_0_35px_rgba(56,189,248,0.6)] -rotate-45" strokeWidth={1.5} />
                    </div>

                    {/* Flame Effect */}
                    <div className="relative -mt-8 z-0">
                        <div className="w-8 h-32 bg-gradient-to-t from-transparent via-orange-500 to-yellow-300 blur-md rounded-full animate-[exhaust_0.1s_infinite]"></div>
                    </div>
                </div>
            </div>

            {/* PHASE 2: ENHANCED LOADER (40% Time = 2.8s) */}
            {phase === 2 && (
                <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-md px-6 animate-in fade-in zoom-in-95 duration-500">

                    {/* Glass Card Container */}
                    <div className="w-full bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-10 shadow-2xl shadow-sky-900/20 relative overflow-hidden group ring-1 ring-white/10">

                        {/* Tech Corner Accents */}
                        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-sky-500/30 rounded-tl-[2rem]"></div>
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-indigo-500/30 rounded-br-[2rem]"></div>

                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56 bg-sky-500/10 rounded-full blur-[100px] group-hover:bg-sky-500/20 transition-all duration-1000"></div>

                        {/* Logo Area with Spinning Ring */}
                        <div className="relative z-10 flex flex-col items-center mb-10">
                            <div className="relative mb-6 group-hover:scale-105 transition-transform duration-700">
                                {/* Spinning Gradient Ring */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-purple-500 to-sky-400 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 animate-spin-slow"></div>

                                {/* Logo Container */}
                                <div className="w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center relative ring-1 ring-white/10 shadow-2xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                                    <img src={logo} alt="CloudAiLabs" className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]" />

                                    {/* Inner shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 animate-shine"></div>
                                </div>

                                {/* Verified Badge */}
                                <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1.5 border border-slate-700 shadow-sm flex items-center justify-center">
                                    <div className="bg-emerald-500 rounded-full p-0.5">
                                        <CheckCircle2 size={12} strokeWidth={3} className="text-white" />
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-4xl font-black text-white tracking-tighter text-center mb-2">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">Cloud</span>
                                <span className="text-slate-200">AiLabs</span>
                            </h2>
                            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                                <ShieldCheck size={10} className="text-sky-400" />
                                Secure Environment
                            </div>
                        </div>

                        {/* Dynamic Status Text */}
                        <div className="h-8 flex justify-center items-center mb-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-300" key={loadingText.msg}>
                                {loadingText.icon}
                                <span className="tracking-wide text-slate-200">{loadingText.msg}</span>
                            </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden relative shadow-inner backdrop-blur-sm border border-white/5">
                            {/* Progress Fill - 2.8s duration to match phase */}
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 w-full origin-left animate-[loading-bar_2.8s_ease-out_forwards] shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>

                            {/* Shimmer Overlay */}
                            <div className="absolute inset-0 bg-white/40 w-1/2 -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                        </div>

                        <div className="mt-6 flex justify-between text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                            <span>v2.4.0 (Stable)</span>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Connected
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Global Embedded Styles */}
            <style>{`
        @keyframes rain {
          0% { transform: translateY(-100px); }
          100% { transform: translateY(110vh); }
        }
        @keyframes rocket-fly {
          0% { transform: translateY(110vh) scale(0.8); opacity: 0; }
          10% { transform: translateY(30vh) scale(1); opacity: 1; }
          40% { transform: translateY(20vh) scale(1); } /* Hover longer */
          60% { transform: translateY(15vh) scale(1.1); } /* Prepare for launch */
          100% { transform: translateY(-120vh) scale(1.5); opacity: 0; }
        }
        @keyframes exhaust {
          0% { height: 20px; opacity: 0.8; }
          50% { height: 40px; opacity: 0.6; }
          100% { height: 80px; opacity: 0.2; }
        }
        @keyframes loading-bar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes shimmer {
          100% { transform: translateX(300%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shine {
            0% { transform: translateX(-150%) skewX(-12deg); }
            100% { transform: translateX(150%) skewX(-12deg); }
        }
      `}</style>
        </div>
    );
};

export default RocketLoader;
