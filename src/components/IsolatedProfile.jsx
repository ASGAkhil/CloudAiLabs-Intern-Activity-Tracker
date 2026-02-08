import React, { useState } from 'react';
import { User, AlertTriangle, Camera, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { PHOTO_COMPLIMENTS } from './MotivationalData'; // [NEW]

export const IsolatedProfile = ({ user, onBack, onUpdate }) => {
    const [bio, setBio] = useState(user.bio || '');
    const [initialBio, setInitialBio] = useState(user.bio || '');
    const [photo, setPhoto] = useState(user.photo || null);

    const [reportReason, setReportReason] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportStatus, setReportStatus] = useState('idle');

    const [saveStatus, setSaveStatus] = useState('idle');
    const [photoStatus, setPhotoStatus] = useState('idle');
    const [validationError, setValidationError] = useState('');
    const [showCompliment, setShowCompliment] = useState(null); // [NEW] Compliment Toast

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoStatus('uploading');

            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = async () => {
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
                    const pngBase64 = canvas.toDataURL('image/png');

                    setPhoto(pngBase64); // Optimistic

                    // [NEW] Trigger Special Compliment
                    const randomCompliment = PHOTO_COMPLIMENTS[Math.floor(Math.random() * PHOTO_COMPLIMENTS.length)];
                    setShowCompliment(randomCompliment);
                    setTimeout(() => setShowCompliment(null), 5000); // Hide after 5s

                    const result = await api.saveProfile({ name: user.name, internId: user.internId, bio, photo: pngBase64 });
                    setPhotoStatus('idle');

                    if (result.success && result.photo) {
                        setPhoto(result.photo);
                        if (onUpdate) onUpdate({ photo: result.photo });
                    }
                };
                img.src = readerEvent.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const saveBio = async () => {
        if (bio.trim() === initialBio.trim()) {
            setValidationError("Please update something to save.");
            setTimeout(() => setValidationError(''), 3000);
            return;
        }

        setSaveStatus('saving');
        // Optimistic
        if (onUpdate) onUpdate({ bio });

        const result = await api.saveProfile({ name: user.name, internId: user.internId, bio, photo });
        if (result.success) {
            setSaveStatus('saved');
            setInitialBio(bio);
            setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
            setSaveStatus('error');
        }
    };

    const handleReportInactive = async () => {
        if (!reportReason) return;
        setReportStatus('submitting');

        // Using api.submitLog directly since we are isolated
        await api.submitLog({
            action: 'submitLog',
            name: user.name,
            internId: user.internId,
            date: new Date().toLocaleDateString(),
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
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-400 to-purple-600"></div>

                        <div className="relative z-10 mt-12 mx-auto w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white group-hover:scale-105 transition-transform duration-300">
                            {photoStatus === 'uploading' ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 text-white backdrop-blur-sm">
                                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                                </div>
                            ) : photo ? (
                                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-4xl font-bold">{user.name.charAt(0)}</div>
                            )}
                        </div>

                        <div className="mt-4 flex justify-center">
                            <label className="cursor-pointer">
                                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" disabled={photoStatus === 'uploading'} />
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-xs font-bold">
                                    <Camera className="w-3.5 h-3.5" />
                                    {photoStatus === 'uploading' ? 'Uploading...' : 'Update Photo'}
                                </div>
                            </label>
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-slate-900">{user.name}</h2>
                        <p className="text-slate-500 font-medium text-sm">{user.internId}</p>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="w-full py-2 px-4 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" /> Report Issue
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-500" /> About Me
                        </h3>
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium"
                                placeholder="Tell us about your UPSC journey..."
                            ></textarea>

                            {validationError && (
                                <p className="text-red-500 text-xs font-bold">{validationError}</p>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={saveBio}
                                    disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                                    className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-slate-900 hover:bg-black'
                                        }`}
                                >
                                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Report Issue / Inactive</h3>
                        <p className="text-slate-500 text-sm mb-4">Let the admin know if you are facing issues or need time off.</p>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Reason for inactivity or issue..."
                            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none mb-4"
                        ></textarea>
                        <div className="flex gap-3">
                            <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200">Cancel</button>
                            <button onClick={handleReportInactive} className="flex-1 py-3 bg-red-600 font-bold text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-200">
                                {reportStatus === 'submitting' ? 'Sending...' : reportStatus === 'success' ? 'Sent' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* [NEW] Special Compliment Toast */}
            {showCompliment && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-6 py-4 rounded-full shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 flex items-center gap-3">
                    <span className="text-2xl">💖</span>
                    <p className="font-bold text-lg">{showCompliment}</p>
                </div>
            )}
        </div>
    );
};
