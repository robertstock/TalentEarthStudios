"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProcessingBox from "../../components/simulator/ProcessingBox";
import RecommendationOutput from "../../components/simulator/RecommendationOutput";
import { generateSOW, runMatchingEngine } from "../../utils/simulator/matchingEngine";

export default function RequestForm() {
    const searchParams = useSearchParams();
    const talentSlug = searchParams.get("talent");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        projectType: "Film Production",
        timeline: "Immediate",
        budgetRange: "$10k - $50k",
        message: ""
    });
    
    // Status tracking
    const [status, setStatus] = useState<"IDLE" | "SIMULATING" | "SIMULATION_COMPLETE" | "SUBMITTING" | "SUCCESS" | "ERROR">("IDLE");
    
    // Simulator states
    const [processStage, setProcessStage] = useState(0); 
    const [result, setResult] = useState<any>(null);

    const startSimulation = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure required fields are present
        if (!formData.name || !formData.email || !formData.message) return;

        setStatus("SIMULATING");
        setResult(null);
        setProcessStage(0);

        // Sequence stages 1 through 7
        let step = 1;
        setProcessStage(step);
        
        const interval = setInterval(() => {
            step += 1;
            setProcessStage(step);
            
            if (step === 7) {
                clearInterval(interval);
                // Map the projectType to the category required by the generator
                const matchFormData = {
                    ...formData,
                    category: formData.projectType,
                    description: formData.message,
                    budget: formData.budgetRange,
                    timeline: formData.timeline
                };
                
                const sow = generateSOW(matchFormData);
                const talent = runMatchingEngine(matchFormData, sow.requiredSkills);
                setResult({ sow, talent });
                setStatus("SIMULATION_COMPLETE");
            }
        }, 600);
    };

    const handleFinalSubmit = async () => {
        setStatus("SUBMITTING");

        try {
            const res = await fetch("/api/intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    company: formData.company,
                    projectType: formData.projectType,
                    timeline: formData.timeline,
                    budgetRange: formData.budgetRange,
                    message: formData.message,
                    talentSlug: result?.talent?.id || talentSlug // Override with recommended
                })
            });

            if (res.ok) {
                setStatus("SUCCESS");
                setFormData({
                    name: "",
                    email: "",
                    company: "",
                    projectType: "Film Production",
                    timeline: "Immediate",
                    budgetRange: "$10k - $50k",
                    message: ""
                });
            } else {
                setStatus("ERROR");
            }
        } catch {
            setStatus("ERROR");
        }
    };

    if (status === "SUCCESS") {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-wme-surface border border-green-500/20 p-8 rounded-2xl"
                >
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-light text-white mb-2">Request Secured</h2>
                    <p className="text-gray-400 mb-8 font-light">
                        The simulated routing has been validated and submitted. Our execution team will initialize contact shortly.
                    </p>
                    <button
                        onClick={() => {
                            setStatus("IDLE");
                            setProcessStage(0);
                            setResult(null);
                        }}
                        className="text-sm text-green-400 hover:text-green-300 transition-colors uppercase tracking-widest"
                    >
                        Initialize New Request
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pt-32 pb-12 px-6">
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-light text-white mb-4">
                    TalentEarth Operations Simulator
                </h1>
                <p className="text-gray-400 max-w-xl mx-auto font-light">
                    Submit your project parameters and allow our intelligence ecosystem to dynamically assemble the precise execution unit required.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Side: The Form */}
                <form onSubmit={startSimulation} className="space-y-8">
                    {/* Contact Information */}
                    <div className="bg-wme-base border border-wme-border/50 rounded-xl p-6 md:p-8 backdrop-blur-sm">
                        <h3 className="text-xs font-mono text-slate-500 mb-6 uppercase tracking-widest">01 // Contact Parameters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
                                    placeholder="Your Name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    disabled={status !== "IDLE" && status !== "ERROR"}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={status !== "IDLE" && status !== "ERROR"}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Company / Organization</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
                                    placeholder="Entity Name (Optional)"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    disabled={status !== "IDLE" && status !== "ERROR"}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Project Details */}
                    <div className="bg-wme-base border border-wme-border/50 rounded-xl p-6 md:p-8 backdrop-blur-sm">
                        <h3 className="text-xs font-mono text-slate-500 mb-6 uppercase tracking-widest">02 // Project Scope</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Discipline</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
                                        value={formData.projectType}
                                        onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                                        disabled={status !== "IDLE" && status !== "ERROR"}
                                    >
                                        <option>Film Production</option>
                                        <option>Experiential & Fabrication</option>
                                        <option>Print Production</option>
                                        <option>Audio / Score</option>
                                        <option>VFX / Post</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Timeline</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
                                        value={formData.timeline}
                                        onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                                        disabled={status !== "IDLE" && status !== "ERROR"}
                                    >
                                        <option>Immediate (&lt; 1 month)</option>
                                        <option>Short Term (1-3 months)</option>
                                        <option>Mid Term (3-6 months)</option>
                                        <option>Long Term (6+ months)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Budget Range</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
                                        value={formData.budgetRange}
                                        onChange={e => setFormData({ ...formData, budgetRange: e.target.value })}
                                        disabled={status !== "IDLE" && status !== "ERROR"}
                                    >
                                        <option>Under $25k</option>
                                        <option>$25k - $50k</option>
                                        <option>$50k - $100k</option>
                                        <option>$100k - $500k</option>
                                        <option>$500k+</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Project Brief</label>
                            <textarea
                                required
                                rows={6}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700 resize-none"
                                placeholder="Describe your project requirements, scope, and objectives..."
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                disabled={status !== "IDLE" && status !== "ERROR"}
                            />
                        </div>
                    </div>

                    {(status === "IDLE" || status === "ERROR") && (
                        <div className="flex justify-center pt-4">
                            <button
                                type="submit"
                                className="px-8 py-4 bg-white text-black text-sm uppercase tracking-widest font-semibold rounded hover:bg-gray-200 transition-colors w-full min-w-[200px]"
                            >
                                Simulate Project Routing
                            </button>
                        </div>
                    )}

                    {status === "ERROR" && (
                        <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg mx-auto">
                            <p className="text-red-400 text-sm">System Error: Transmission failed. Please retry.</p>
                        </div>
                    )}
                </form>

                {/* Right Side: The Simulator Output */}
                <div className="space-y-8">
                    <ProcessingBox processStage={processStage} />
                    
                    <AnimatePresence>
                        {status === "SIMULATION_COMPLETE" && result && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6"
                            >
                                <RecommendationOutput result={result} isProcessing={false} />
                                
                                <div className="p-6 bg-blue-900/10 border border-blue-500/30 rounded-xl text-center space-y-4">
                                    <p className="text-sm font-light text-gray-300">
                                        The engine has assigned <strong>{result.talent.name}</strong> as the optimal fulfillment entity. 
                                        Click below to officially initiate contact and bind this task order.
                                    </p>
                                    <button
                                        onClick={handleFinalSubmit}
                                        disabled={status === "SUBMITTING"}
                                        className="w-full px-8 py-4 bg-blue-600 text-white text-sm uppercase tracking-widest font-semibold rounded hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
                                    >
                                        {status === "SUBMITTING" ? "Transmitting Secure payload..." : "SEND SECURE REQUEST"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {status === "SIMULATING" && (
                             <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                             >
                                <RecommendationOutput result={null} isProcessing={true} />
                             </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
