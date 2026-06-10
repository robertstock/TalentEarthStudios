"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const compressImage = (file: File, maxW: number = 1000, maxH: number = 1000): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxW || height > maxH) {
                    if (width > height) {
                        height = Math.round((height * maxW) / width);
                        width = maxW;
                    } else {
                        width = Math.round((width * maxH) / height);
                        height = maxH;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            if (blob.size < file.size) {
                                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                                    type: "image/jpeg",
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        } else {
                            resolve(file);
                        }
                    },
                    "image/jpeg",
                    0.75
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

export default function WelcomeClient() {
    // Onboarding Form States
    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");

    // Social Links
    const [instagram, setInstagram] = useState("");
    const [youtube, setYoutube] = useState("");
    const [behance, setBehance] = useState("");
    const [soundcloud, setSoundcloud] = useState("");
    const [website, setWebsite] = useState("");

    // File Uploads
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string>("");
    const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
    
    // UI Status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const profileInputRef = useRef<HTMLInputElement>(null);

    // Form Navigation
    const nextStep = () => {
        if (step === 1) {
            if (!firstName || !lastName || !email || !location || !headline) {
                setErrorMsg("Please fill in all required fields.");
                return;
            }
        }
        setErrorMsg("");
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setErrorMsg("");
        setStep(prev => prev - 1);
    };

    // Profile Photo Handling
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    // Portfolio File Handling
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setPortfolioFiles(prev => [...prev, ...filesArray]);
        }
    };

    const removePortfolioFile = (index: number) => {
        setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Form Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");
        setUploadProgress(10);

        try {
            // Compress profile image on client side
            let finalProfileImage = profileImage;
            if (profileImage && profileImage.type.startsWith("image/")) {
                setUploadProgress(15);
                finalProfileImage = await compressImage(profileImage);
            }

            // Compress portfolio images on client side
            const finalPortfolioFiles = [];
            for (let i = 0; i < portfolioFiles.length; i++) {
                const file = portfolioFiles[i];
                if (file.type.startsWith("image/")) {
                    setUploadProgress(15 + Math.round((i / portfolioFiles.length) * 15));
                    const compressed = await compressImage(file);
                    finalPortfolioFiles.push(compressed);
                } else {
                    finalPortfolioFiles.push(file);
                }
            }

            // Verify payload size is under Vercel's 4.5MB limit
            const totalSize = (finalProfileImage?.size || 0) + finalPortfolioFiles.reduce((acc, f) => acc + f.size, 0);
            if (totalSize > 4.2 * 1024 * 1024) { // 4.2 MB threshold
                throw new Error(`The total size of your uploaded media (${(totalSize / (1024 * 1024)).toFixed(2)} MB) exceeds the 4.5 MB serverless limit. Please remove large files or upload smaller images.`);
            }

            const formData = new FormData();
            formData.append("firstName", firstName);
            formData.append("lastName", lastName);
            formData.append("email", email);
            formData.append("location", location);
            formData.append("headline", headline);
            formData.append("bio", bio);
            formData.append("instagram", instagram);
            formData.append("youtube", youtube);
            formData.append("behance", behance);
            formData.append("soundcloud", soundcloud);
            formData.append("website", website);

            if (finalProfileImage) {
                formData.append("profileImage", finalProfileImage);
            }

            finalPortfolioFiles.forEach(file => {
                formData.append("portfolioFiles", file);
            });

            setUploadProgress(40);

            const res = await fetch("/api/onboard", {
                method: "POST",
                body: formData
            });

            setUploadProgress(80);

            let data;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                data = { error: text || `Server error: ${res.status}` };
            }

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit profile");
            }

            setUploadProgress(100);
            setIsSuccess(true);
        } catch (err: any) {
            console.error("Submission error:", err);
            setErrorMsg(err.message || "Something went wrong. Please check your connection and try again.");
            setStep(4); // Keep on last step to show error
        } finally {
            setIsSubmitting(false);
        }
    };

    const stepsTotal = 4;

    return (
        <div className="w-full flex flex-col items-center">
            {/* Onboarding Section */}
            <section className="w-full max-w-4xl px-6 pt-32 pb-16 flex flex-col items-center relative z-20">
                
                {/* Header Welcome */}
                <div className="text-center mb-10 max-w-2xl">
                    <span className="text-brand-blue text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase mb-4 block animate-pulse">
                        CURATED TALENT INVITE ONLY
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">TalentEarth.</span>
                    </h1>
                    <p className="text-slate-400 font-light leading-relaxed text-sm md:text-base">
                        You’ve been invited to join our curated network. Setup is simple: provide your core details and links to the visual platforms you already maintain. No endless forms required.
                    </p>
                </div>

                {/* Onboarding Wizard Card */}
                <div className="w-full bg-[#0B0F15]/90 border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />

                    {!isSuccess ? (
                        <div className="relative z-10 flex flex-col min-h-[400px]">
                            {/* Step Indicators */}
                            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                                    Step {step} of {stepsTotal} // {step === 1 ? "Core Details" : step === 2 ? "Creative Links" : step === 3 ? "Showcase Media" : "Bio & Submit"}
                                </div>
                                <div className="flex gap-1.5">
                                    {Array.from({ length: stepsTotal }).map((_, idx) => (
                                        <div 
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                idx + 1 === step 
                                                    ? "w-8 bg-brand-blue" 
                                                    : idx + 1 < step 
                                                        ? "w-4 bg-brand-green/80" 
                                                        : "w-2 bg-slate-800"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Error Alert */}
                            {errorMsg && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-light flex items-center gap-3">
                                    <i className="ph ph-warning-circle text-lg"></i>
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Step Content */}
                            <div className="flex-1">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                        >
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">First Name <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={firstName} 
                                                    onChange={e => setFirstName(e.target.value)} 
                                                    className="w-full bg-slate-900/50 border border-slate-700 focus:border-brand-blue/60 text-white rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-slate-600"
                                                    placeholder="e.g. John" 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Last Name <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={lastName} 
                                                    onChange={e => setLastName(e.target.value)} 
                                                    className="w-full bg-slate-900/50 border border-slate-700 focus:border-brand-blue/60 text-white rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-slate-600"
                                                    placeholder="e.g. Doe" 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Email Address <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="email" 
                                                    value={email} 
                                                    onChange={e => setEmail(e.target.value)} 
                                                    className="w-full bg-slate-900/50 border border-slate-700 focus:border-brand-blue/60 text-white rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-slate-600"
                                                    placeholder="e.g. john.doe@example.com" 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Location / Base <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={location} 
                                                    onChange={e => setLocation(e.target.value)} 
                                                    className="w-full bg-slate-900/50 border border-slate-700 focus:border-brand-blue/60 text-white rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-slate-600"
                                                    placeholder="e.g. Los Angeles, CA or London, UK" 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2 md:col-span-2">
                                                <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Primary Creative Discipline / Headline <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={headline} 
                                                    onChange={e => setHeadline(e.target.value)} 
                                                    className="w-full bg-slate-900/50 border border-slate-700 focus:border-brand-blue/60 text-white rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-slate-600"
                                                    placeholder="e.g. Master Fabricator, VR Content Director, Scenic Designer" 
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-5"
                                        >
                                            <p className="text-xs text-slate-500 italic mb-2">
                                                Tip: Paste links to your creative platforms. We’ll showcase these profiles so clients can inspect your active portfolios.
                                            </p>
                                            <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1">
                                                <i className="ph ph-instagram-logo text-xl text-pink-400/80"></i>
                                                <input 
                                                    type="url" 
                                                    value={instagram} 
                                                    onChange={e => setInstagram(e.target.value)} 
                                                    className="w-full bg-transparent border-none text-white outline-none py-2 text-sm placeholder:text-slate-700" 
                                                    placeholder="Instagram URL (e.g. https://instagram.com/yourhandle)" 
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1">
                                                <i className="ph ph-youtube-logo text-xl text-red-500/80"></i>
                                                <input 
                                                    type="url" 
                                                    value={youtube} 
                                                    onChange={e => setYoutube(e.target.value)} 
                                                    className="w-full bg-transparent border-none text-white outline-none py-2 text-sm placeholder:text-slate-700" 
                                                    placeholder="YouTube / Vimeo Portfolio URL" 
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1">
                                                <i className="ph ph-behance-logo text-xl text-blue-500/80"></i>
                                                <input 
                                                    type="url" 
                                                    value={behance} 
                                                    onChange={e => setBehance(e.target.value)} 
                                                    className="w-full bg-transparent border-none text-white outline-none py-2 text-sm placeholder:text-slate-700" 
                                                    placeholder="Behance / Dribbble / ArtStation URL" 
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1">
                                                <i className="ph ph-waveform text-xl text-orange-500/80"></i>
                                                <input 
                                                    type="url" 
                                                    value={soundcloud} 
                                                    onChange={e => setSoundcloud(e.target.value)} 
                                                    className="w-full bg-transparent border-none text-white outline-none py-2 text-sm placeholder:text-slate-700" 
                                                    placeholder="SoundCloud / Audio Reel URL (optional)" 
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1">
                                                <i className="ph ph-globe text-xl text-emerald-400/80"></i>
                                                <input 
                                                    type="url" 
                                                    value={website} 
                                                    onChange={e => setWebsite(e.target.value)} 
                                                    className="w-full bg-transparent border-none text-white outline-none py-2 text-sm placeholder:text-slate-700" 
                                                    placeholder="Personal Portfolio Website URL" 
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-6"
                                        >
                                            {/* Profile Image Uploader */}
                                            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-900/30 border border-white/5 rounded-xl">
                                                <div className="w-24 h-24 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden relative group">
                                                    {profileImagePreview ? (
                                                        <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <i className="ph ph-user text-3xl text-slate-600"></i>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col gap-2">
                                                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Profile Photo</label>
                                                    <p className="text-xs text-slate-500">Provide a clean headshot or logo representing your creative discipline.</p>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => profileInputRef.current?.click()} 
                                                        className="w-fit text-xs font-semibold uppercase tracking-wider text-brand-blue border border-brand-blue/30 px-4 py-2 rounded hover:bg-brand-blue hover:text-white transition-colors mt-1"
                                                    >
                                                        Choose Photo
                                                    </button>
                                                    <input 
                                                        type="file" 
                                                        ref={profileInputRef}
                                                        onChange={handleProfileChange}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>

                                            {/* Portfolio Files Uploader */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Direct Media Showcase</label>
                                                <p className="text-xs text-slate-500 mb-2">Upload visual evidence (photos, video clips, or PDF resumes/portfolio decks) directly to our server.</p>
                                                
                                                <div 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-900/20 group"
                                                >
                                                    <i className="ph ph-cloud-arrow-up text-4xl text-slate-600 group-hover:text-brand-blue transition-colors mb-2"></i>
                                                    <p className="text-sm font-semibold text-slate-300">Drag files here or click to browse</p>
                                                    <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, MP4, MOV, and PDF (Max 15MB/file)</p>
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        multiple
                                                        accept="image/*,video/*,application/pdf"
                                                        className="hidden"
                                                    />
                                                </div>

                                                {/* Uploaded Files List */}
                                                {portfolioFiles.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Queue ({portfolioFiles.length} files)</h4>
                                                        <div className="max-h-[160px] overflow-y-auto pr-2 space-y-1.5">
                                                            {portfolioFiles.map((file, idx) => {
                                                                const isImage = file.type.startsWith("image/");
                                                                const isVideo = file.type.startsWith("video/");
                                                                const isPdf = file.type === "application/pdf";
                                                                
                                                                let icon = "ph-file";
                                                                let iconColor = "text-slate-500";
                                                                if (isImage) { icon = "ph-image"; iconColor = "text-blue-400"; }
                                                                else if (isVideo) { icon = "ph-video-camera"; iconColor = "text-red-400"; }
                                                                else if (isPdf) { icon = "ph-file-pdf"; iconColor = "text-orange-400"; }

                                                                return (
                                                                    <div key={idx} className="flex justify-between items-center bg-[#11161F]/60 border border-white/5 rounded-lg px-4 py-2 text-xs">
                                                                        <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                                                                            <i className={`ph ${icon} ${iconColor} text-lg`}></i>
                                                                            <span className="text-white font-medium truncate">{file.name}</span>
                                                                            <span className="text-slate-500 font-mono">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                                                        </div>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => removePortfolioFile(idx)} 
                                                                            className="text-slate-500 hover:text-red-400 p-1"
                                                                        >
                                                                            <i className="ph ph-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 4 && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-6"
                                        >
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Short Bio / Background (Optional)</label>
                                                <textarea 
                                                    value={bio} 
                                                    onChange={e => setBio(e.target.value)} 
                                                    rows={4}
                                                    className="w-full bg-slate-900/50 border border-slate-700 focus:border-brand-blue/60 text-white rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-slate-600 text-sm resize-none"
                                                    placeholder="Briefly state your history, types of projects you enjoy, or credentials..." 
                                                />
                                            </div>

                                            {/* Summary Preview */}
                                            <div className="bg-[#11161F]/60 border border-white/5 rounded-xl p-5 text-xs text-slate-400 space-y-3">
                                                <h4 className="text-white font-semibold uppercase tracking-wider">Confirm Your Submission Details</h4>
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-white/5 pt-3">
                                                    <div><span className="text-slate-500">Name:</span> <strong className="text-white font-medium">{firstName} {lastName}</strong></div>
                                                    <div><span className="text-slate-500">Email:</span> <strong className="text-white font-medium">{email}</strong></div>
                                                    <div><span className="text-slate-500">Discipline:</span> <strong className="text-white font-medium">{headline}</strong></div>
                                                    <div><span className="text-slate-500">Location:</span> <strong className="text-white font-medium">{location}</strong></div>
                                                </div>
                                                <div className="border-t border-white/5 pt-3">
                                                    <span className="text-slate-500">Links: </span>
                                                    {instagram && <span className="bg-slate-950 px-2 py-1 rounded text-white border border-white/5 mr-1.5 inline-block mt-1">Instagram</span>}
                                                    {youtube && <span className="bg-slate-950 px-2 py-1 rounded text-white border border-white/5 mr-1.5 inline-block mt-1">YouTube</span>}
                                                    {behance && <span className="bg-slate-950 px-2 py-1 rounded text-white border border-white/5 mr-1.5 inline-block mt-1">Behance</span>}
                                                    {soundcloud && <span className="bg-slate-950 px-2 py-1 rounded text-white border border-white/5 mr-1.5 inline-block mt-1">SoundCloud</span>}
                                                    {website && <span className="bg-slate-950 px-2 py-1 rounded text-white border border-white/5 mr-1.5 inline-block mt-1">Website</span>}
                                                    {!instagram && !youtube && !behance && !soundcloud && !website && <span className="text-slate-600 font-light italic">None provided</span>}
                                                </div>
                                                <div className="border-t border-white/5 pt-3 flex gap-4">
                                                    <div><span className="text-slate-500">Profile Photo:</span> <strong className="text-white font-medium">{profileImage ? "Uploaded" : "None"}</strong></div>
                                                    <div><span className="text-slate-500">Showcase Assets:</span> <strong className="text-white font-medium">{portfolioFiles.length} files</strong></div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Wizard Footer Controls */}
                            <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
                                {step > 1 ? (
                                    <button 
                                        type="button" 
                                        onClick={prevStep}
                                        disabled={isSubmitting}
                                        className="px-6 py-3 border border-white/10 hover:bg-white/5 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {step < stepsTotal ? (
                                    <button 
                                        type="button" 
                                        onClick={nextStep}
                                        className="px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(0,174,239,0.3)]"
                                    >
                                        Continue <i className="ph ph-arrow-right"></i>
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-brand-green hover:bg-brand-green/90 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(122,201,67,0.3)] disabled:opacity-55"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className="ph ph-spinner animate-spin"></i> Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Complete Setup <i className="ph ph-check-circle"></i>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Simulated Upload Progress for Large Media */}
                            {isSubmitting && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900">
                                    <div className="h-full bg-brand-green transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Success Animation & Thank You State */
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 flex flex-col items-center justify-center py-12 text-center"
                        >
                            <div className="w-20 h-20 rounded-full border border-brand-green flex items-center justify-center text-brand-green bg-brand-green/10 mb-6 shadow-[0_0_30px_rgba(122,201,67,0.2)]">
                                <i className="ph ph-check text-4xl"></i>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">Onboarding Submitted!</h2>
                            <p className="text-slate-400 font-light max-w-md leading-relaxed text-sm md:text-base">
                                Thank you, {firstName}. Your profile details and portfolio assets have been successfully transmitted to the TalentEarth curation team.
                            </p>
                            <p className="text-slate-500 font-light mt-4 text-xs max-w-sm">
                                We are a curated, invite-only site. Robert and the administration team will review your visual portfolios shortly, and you will receive an email notice when approved.
                            </p>
                            <Link href="/" className="mt-10 px-8 py-4 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white rounded-md text-xs font-semibold tracking-widest uppercase transition-colors">
                                Return to Homepage
                            </Link>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Traditional Homepage Stuff Underneath */}
            <div className="w-full relative z-10 border-t border-white/5 bg-[#030508]/80 backdrop-blur-sm">
                
                {/* Traditional Homepage Hero Section (adapted for subpage representation) */}
                <section className="py-24 flex items-center px-6 md:px-16 lg:px-24">
                    <div className="max-w-4xl w-full mx-auto">
                        <span className="text-brand-blue text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase mb-6 block">
                            WHERE TALENT AND OPPORTUNITY COME TOGETHER.
                        </span>
                        
                        <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1] mb-4 tracking-tight">
                            From Idea to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">
                                Delivered Project.
                            </span>
                        </h2>

                        <h3 className="text-xl md:text-3xl text-slate-400 font-light mb-8">
                            A representation layer for those who create.
                        </h3>

                        <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed max-w-2xl mb-12">
                            TalentEarthStudios acts as the operating system for advanced physical and digital builds. We standardize contracts, compliance, insurance, and matching, letting creatives create and clients deploy with absolute certainty.
                        </p>

                        {/* Process Graphics */}
                        <div className="flex items-center gap-4 md:gap-8 mb-4 overflow-x-auto pb-4 hide-scrollbar">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center text-brand-blue">
                                    <i className="ph ph-lightbulb text-xl"></i>
                                </div>
                                <span className="text-[10px] text-white">Idea In</span>
                            </div>
                            <i className="ph ph-caret-right text-slate-700 text-base -mt-4"></i>
                            
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center text-brand-blue">
                                    <i className="ph ph-users text-xl"></i>
                                </div>
                                <span className="text-[10px] text-white">Team Aligned</span>
                            </div>
                            <i className="ph ph-caret-right text-slate-700 text-base -mt-4"></i>

                            <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center text-brand-green">
                                    <i className="ph ph-calendar-blank text-xl"></i>
                                </div>
                                <span className="text-[10px] text-white">Schedule Built</span>
                            </div>
                            <i className="ph ph-caret-right text-slate-700 text-base -mt-4"></i>

                            <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-full border border-brand-green flex items-center justify-center text-brand-green">
                                    <i className="ph ph-check-circle text-xl"></i>
                                </div>
                                <span className="text-[10px] text-white">Project Delivered</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Information Panels */}
                <section className="bg-gradient-to-b from-transparent via-wme-base/90 to-wme-base pb-32">
                    <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-12 space-y-12 md:space-y-16">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-6 md:p-8 min-h-[220px] md:min-h-[280px] flex flex-col justify-between group hover:border-slate-700 transition-colors duration-500 cursor-default">
                                <div className="text-xs font-mono text-slate-600 mb-4">01 // REPRESENTATION</div>
                                <div>
                                    <h3 className="text-white text-lg font-normal mb-3">Managed Talent</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-light select-text">
                                        We represent the technical and creative architects behind global production. Not a roster of faces, but a network of verified capabilities.
                                    </p>
                                </div>
                                <div className="w-full h-px bg-slate-800 mt-6 group-hover:bg-slate-600 transition-colors"></div>
                            </div>

                            <div className="glass-panel p-6 md:p-8 min-h-[220px] md:min-h-[280px] flex flex-col justify-between group hover:border-slate-700 transition-colors duration-500 cursor-default">
                                <div className="text-xs font-mono text-slate-600 mb-4">02 // ASSEMBLY</div>
                                <div>
                                    <h3 className="text-white text-lg font-normal mb-3">Team Construction</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-light select-text">
                                        Deploy complete operational units. From experiential fabrication to virtual production, teams are scoped and deployed as single entities.
                                    </p>
                                </div>
                                <div className="w-full h-px bg-slate-800 mt-6 group-hover:bg-slate-600 transition-colors"></div>
                            </div>

                            <div className="glass-panel p-6 md:p-8 min-h-[220px] md:min-h-[280px] flex flex-col justify-between group hover:border-slate-700 transition-colors duration-500 cursor-default">
                                <div className="text-xs font-mono text-slate-600 mb-4">03 // DELIVERY</div>
                                <div>
                                    <h3 className="text-white text-lg font-normal mb-3">Oversight & Scope</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-light select-text">
                                        TalentEarthStudios acts as the operating layer. Contracts, insurance, and technical riders are standardized, removing friction from complex builds.
                                    </p>
                                </div>
                                <div className="w-full h-px bg-slate-800 mt-6 group-hover:bg-slate-600 transition-colors"></div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 md:p-8 border border-wme-border">
                            <div className="text-xs font-mono text-slate-600 mb-4">EXECUTION DOMAINS</div>
                            <div className="flex flex-wrap gap-2 text-[10px] md:text-xs font-mono text-slate-400 select-none">
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Build</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Fabrication</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Technical Direction</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Systems</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Media</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Interactive</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Installation</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Operations</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Compliance</span>
                                <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Specialized</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
