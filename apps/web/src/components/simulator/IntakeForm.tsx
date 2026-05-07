"use client";
import React from 'react';
import { demoScenarios } from '../../utils/simulator/mockData';

const IntakeForm = ({ formData, setFormData, onSimulate, isProcessing }: any) => {
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const loadScenario = (scenario: any) => {
    setFormData(scenario.preset);
  };

  return (
    <div className="panel">
      <div className="panel-header">Business Request</div>
      <div className="panel-subtitle">
        Tell us what you need, and TalentEarth will define the scope, identify the right skills, and recommend the right talent or team.
      </div>

      <div className="demo-scenarios">
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Demo Scenarios</div>
        {demoScenarios.map((scenario) => (
          <button 
            key={scenario.id} 
            className="scenario-btn"
            onClick={() => loadScenario(scenario)}
            disabled={isProcessing}
          >
            {scenario.title}
          </button>
        ))}
      </div>

      <div className="input-group">
        <label className="input-label">Project Description</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          className="input-field" 
          placeholder="Describe your project needs..."
          disabled={isProcessing}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Timeline</label>
        <input 
          type="text" 
          name="timeline" 
          value={formData.timeline} 
          onChange={handleChange} 
          className="input-field" 
          placeholder="e.g., 4 weeks"
          disabled={isProcessing}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Location</label>
        <input 
          type="text" 
          name="location" 
          value={formData.location} 
          onChange={handleChange} 
          className="input-field" 
          placeholder="e.g., Los Angeles, CA or Remote"
          disabled={isProcessing}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label className="input-label">Budget Range</label>
          <select name="budget" value={formData.budget} onChange={handleChange} className="input-field" disabled={isProcessing}>
            <option value="">Select Range...</option>
            <option value="Under $25k">Under $25k</option>
            <option value="$25k - $50k">$25k - $50k</option>
            <option value="$50k - $100k">$50k - $100k</option>
            <option value="$100k+">$100k+</option>
          </select>
        </div>
        <div>
          <label className="input-label">Category (Optional)</label>
          <select name="category" value={formData.category} onChange={handleChange} className="input-field" disabled={isProcessing}>
            <option value="">Select Category...</option>
            <option value="Film/Video">Film/Video</option>
            <option value="Experiential & Fabrication">Experiential & Fabrication</option>
            <option value="Print Production">Print Production</option>
            <option value="Creative & Design">Creative & Design</option>
          </select>
        </div>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={onSimulate}
        disabled={isProcessing || !formData.description}
      >
        {isProcessing ? 'Processing Request...' : 'Build Recommendation'}
      </button>

    </div>
  );
};

export default IntakeForm;
