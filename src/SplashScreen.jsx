import React, { useState, useEffect } from 'react';
import logo from './assets/logo.png';
import { Loader2 } from 'lucide-react';

const SplashScreen = ({ onFinish, dataReady }) => {
    const [phase, setPhase] = useState('branding'); // 'branding' | 'loading' | 'exiting'
    const [showLoadingText, setShowLoadingText] = useState(false);

    useEffect(() => {
        // Phase 1: Branding (Mandatory 2.5s)
        const brandTimer = setTimeout(() => {
            if (dataReady) {
                // Data is ready, we can exit
                setPhase('exiting');
                setTimeout(onFinish, 700); // Wait for exit animation
            } else {
                // Data not ready, switch to "Loading..." text
                setPhase('loading');
                setShowLoadingText(true);
            }
        }, 2500);

        return () => clearTimeout(brandTimer);
    }, [dataReady]); // We only care about the initial timer, but dataReady triggers the "Next Step" check

    // If we are in 'loading' phase and data finally becomes ready
    useEffect(() => {
        if (phase === 'loading' && dataReady) {
            // Artificial delay to prevent glitchy text flash (e.g. if it loads at 2.6s)
            setTimeout(() => {
                setPhase('exiting');
                setTimeout(onFinish, 700);
            }, 800);
        }
    }, [phase, dataReady, onFinish]);

    if (phase === 'exiting') {
        // Logic handled via CSS transition in return
    }

    return (
        <div className={`fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center transition-opacity duration-700 ${phase === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-sky-500/20 dark:bg-sky-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-indigo-600/20 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse animation-delay-2000"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-4">

                {/* Animated Logo Container */}
                <div className="relative w-52 h-52 mb-12 animate-float">
                    <div className="absolute inset-0 bg-sky-600/30 dark:bg-sky-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <img
                        src={logo}
                        alt="CloudAiLabs"
                        className="w-full h-full object-contain relative z-10 drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Brand Text */}
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards select-none">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                            CloudAiLabs<span className="text-sky-500">.in</span>
                        </h1>
                        <p className="text-lg md:text-xl font-medium text-slate-600 dark:text-slate-300 mt-3 tracking-wide flex items-center justify-center gap-2">
                            A Tech NGO <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span> <span className="italic text-sky-600 dark:text-sky-400 font-serif">Yes, you heard right.</span>
                        </p>
                    </div>

                    <div className="h-12 flex items-center justify-center pt-2">
                        {showLoadingText ? (
                            <div className="flex items-center gap-2 text-slate-400 animate-in fade-in duration-300 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700/50">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                                <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">Loading Intern Portal</span>
                            </div>
                        ) : (
                            <p className="text-sm font-black bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-[0.25em] uppercase animate-pulse drop-shadow-sm">
                                Forming a bunch of freelancers
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-8 text-[10px] text-slate-300 dark:text-slate-700 font-bold tracking-[0.4em] opacity-60">
                EST. 2025
            </div>
        </div>
    );
};

export default SplashScreen;
