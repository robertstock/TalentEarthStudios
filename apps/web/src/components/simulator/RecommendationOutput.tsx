"use client";
import React from 'react';
import { Star, Clock, MapPin, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecommendationOutput({ result, isProcessing }: any) {
  if (isProcessing) {
    return (
      <div className="bg-wme-base border border-wme-border/50 rounded-xl p-6 md:p-8 backdrop-blur-sm flex items-center justify-center min-h-[350px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mx-auto mb-6 animate-pulse"></div>
          <div className="w-32 h-4 bg-white/5 mx-auto mb-3 rounded animate-pulse"></div>
          <div className="w-24 h-3 bg-white/5 mx-auto rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-wme-base border border-wme-border/50 rounded-xl p-6 md:p-8 backdrop-blur-sm flex flex-col justify-center min-h-[350px]">
        <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest text-center">Output Frame</div>
        <div className="text-gray-400 font-light text-center text-sm">
          Awaiting Engine Payload...
        </div>
      </div>
    );
  }

  const { sow, talent } = result;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-wme-base border border-wme-border/50 rounded-xl p-6 md:p-8 backdrop-blur-sm"
    >
      <div className="border-b border-wme-border/50 pb-4 mb-6">
        <h3 className="text-xs font-mono text-green-400 mb-1 uppercase tracking-widest">03 // Match Generated</h3>
        <p className="text-gray-400 text-sm font-light">Systemic evaluation of 12 compatibility parameters.</p>
      </div>

      {/* SOW Summary */}
      <div className="mb-6 bg-black/20 border border-white/5 rounded-lg p-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Verified SOW Directive</div>
        <p className="text-gray-200 text-sm font-light mb-4">{sow.objective}</p>
        
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Key Deliverables</div>
        <ul className="text-sm font-light text-gray-400 list-disc list-inside space-y-1">
          {sow.deliverables.map((item: string, idx: number) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Extracted Skill Attributes</div>
        <div className="flex flex-wrap gap-2">
          {sow.requiredSkills.map((skill: string, idx: number) => (
            <span key={idx} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Recommendation Card */}
      <div className="bg-black/40 border border-green-500/30 rounded-lg p-5 mt-4 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] -z-10" />
        
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xl text-white font-medium mb-1">{talent.name}</div>
            <div className="text-sm text-gray-400 font-light">{talent.role}</div>
          </div>
          <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star size={12} fill="currentColor" /> {talent.reliability}/10
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="text-xs flex items-center gap-1.5 text-gray-400 font-light">
            <MapPin size={12} className="text-gray-500" /> {talent.location}
          </div>
          <div className={`text-xs flex items-center gap-1.5 font-light ${talent.availability >= 8 ? 'text-green-400' : 'text-yellow-500'}`}>
            <Clock size={12} /> {talent.availability >= 8 ? "High Availability" : "Partial Availability"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-wme-border/50">
           <div>
             <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Index Score</span>
             <span className="text-lg text-blue-400 font-light">{talent.matchScore} / 10</span>
           </div>
           <div>
             <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Recent Execution</span>
             <span className="text-sm text-gray-200 font-light flex items-center gap-1 mt-1">
               {talent.recentUse ? <><Check size={14} className="text-green-500" /> Yes <span className="opacity-50 text-[10px] ml-1">(6 mo)</span></> : <><X size={14} className="text-gray-500" /> No</>}
             </span>
           </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-wme-border/50">
            <details className="text-xs text-gray-400 cursor-pointer group">
              <summary className="font-mono uppercase tracking-widest hover:text-gray-300 transition-colors list-none flex items-center justify-between">
                [View Engine Breakdown]
                <span className="opacity-50 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 p-3 bg-black/50 border border-white/5 rounded font-mono text-[10px] space-y-2">
                <div className="flex justify-between"><span>Skill Alignment:</span><span className="text-gray-300">{talent.scoreBreakdown['Skill Match']}</span></div>
                <div className="flex justify-between"><span>Budget Efficacy:</span><span className="text-gray-300">{talent.scoreBreakdown['Budget Fit']}</span></div>
                <div className="flex justify-between"><span>Complexity Factor:</span><span className="text-gray-300">{talent.scoreBreakdown['Complexity Fit']}</span></div>
              </div>
            </details>
        </div>
      </div>
    </motion.div>
  );
}
