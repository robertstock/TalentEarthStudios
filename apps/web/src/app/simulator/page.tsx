"use client";
import React, { useState } from 'react';
import IntakeForm from '../../components/simulator/IntakeForm';
import ProcessingBox from '../../components/simulator/ProcessingBox';
import RecommendationOutput from '../../components/simulator/RecommendationOutput';
import { generateSOW, runMatchingEngine } from '../../utils/simulator/matchingEngine';

export default function SimulatorPage() {
  const [formData, setFormData] = useState({
    description: '',
    timeline: '',
    location: '',
    budget: '',
    category: ''
  });

  const [processStage, setProcessStage] = useState(0); 
  const [result, setResult] = useState<any>(null);

  const startSimulation = () => {
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
        // Compute final results
        const sow = generateSOW(formData);
        const talent = runMatchingEngine(formData, sow.requiredSkills);
        setResult({ sow, talent });
      }
    }, 600); // 600ms per simulated step
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh' }}>
      <header className="header" style={{ paddingTop: '40px' }}>
        <h1>TalentEarth Operations Simulator</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Automated Intake, Scoping, and Team Assignment Demo</p>
      </header>

      <main className="main-layout">
        <IntakeForm 
          formData={formData} 
          setFormData={setFormData}
          onSimulate={startSimulation}
          isProcessing={processStage > 0 && processStage < 7}
        />
        
        <ProcessingBox 
          processStage={processStage} 
        />
        
        <RecommendationOutput 
          result={result} 
          isProcessing={processStage > 0 && processStage < 7}
        />
      </main>
    </div>
  );
}
