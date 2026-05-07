"use client";
import React from 'react';
import { 
  FileText, 
  Target, 
  Calculator, 
  Users, 
  ShieldCheck, 
  CheckCircle 
} from 'lucide-react';

export default function ProcessingBox({ processStage }: any) {
  // processStage: 0 (idle), 1-6 (steps), 7 (complete)
  
  const steps = [
    { id: 1, label: 'Interpreting Request & Generating SOW', icon: <FileText size={18} /> },
    { id: 2, label: 'Extracting Skill Requirements', icon: <Target size={18} /> },
    { id: 3, label: 'Running Pricing Logic', icon: <Calculator size={18} /> },
    { id: 4, label: 'Drafting Team Assembly', icon: <Users size={18} /> },
    { id: 5, label: 'Automated Risk Review', icon: <ShieldCheck size={18} /> },
    { id: 6, label: 'Finalizing Recommendation', icon: <CheckCircle size={18} /> },
  ];

  return (
    <div className="bg-wme-base border border-wme-border/50 rounded-xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden text-white flex flex-col min-h-[350px]">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-light tracking-wide text-white">
          TalentEarth<span className="font-semibold text-blue-400">Studios</span>
        </h2>
        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-mono">
          Intelligence Engine
        </div>
      </div>
      
      {!processStage ? (
        <div className="flex-1 flex items-center justify-center opacity-50 text-center">
          <div>
            <div className="text-4xl mb-4 opacity-50 text-blue-500">⚡️</div>
            <p className="text-gray-400 font-light text-sm uppercase tracking-widest">Awaiting Project Initialization</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center space-y-3 mt-4 relative z-10 w-full max-w-sm mx-auto">
          {steps.map(step => {
            const isActive = processStage === step.id;
            const isCompleted = processStage > step.id;
            
            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-300
                  ${isActive ? 'opacity-100 border-blue-500/30 bg-blue-500/10 translate-x-2' : ''}
                  ${isCompleted ? 'opacity-70 border-white/5 bg-white/5' : ''}
                  ${!isActive && !isCompleted ? 'opacity-30 border-transparent' : ''}
                `}
              >
                <div className={`${isActive ? 'text-blue-400' : isCompleted ? 'text-green-500' : 'text-gray-500'}`}>
                  {step.icon}
                </div>
                <div className="font-medium text-sm text-gray-200">
                  {step.label}
                  {isActive && <span className="inline-flex tracking-widest text-blue-400 opacity-60 ml-2 animate-pulse">...</span>}
                </div>
                {isCompleted && (
                  <div className="ml-auto text-green-500">✓</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {processStage > 0 && processStage < 7 && (
        <div className="mt-8 text-center text-xs opacity-60 animate-pulse text-blue-400 font-mono uppercase">
          [ Simulating Ecosystem Traversal ]
        </div>
      )}
      {processStage === 7 && (
        <div className="mt-8 text-center text-xs text-green-400 font-mono uppercase tracking-widest transition-opacity duration-1000">
          [ Optimal Execution Unit Secured ]
        </div>
      )}

      {/* Background glow when active */}
      {processStage > 0 && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      )}
    </div>
  );
}
