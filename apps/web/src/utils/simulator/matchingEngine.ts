import { mockTalents } from './mockData';

export const generateSOW = (request: any) => {
  // Simple extraction for demo format
  const category = request.category || "General / Integrated";
  let deliverables = ["Project Management", "Final Delivery & Handoff"];
  let requiredSkills: string[] = [];

  if (category.toLowerCase().includes('fabrication') || category.toLowerCase().includes('experiential')) {
    deliverables = ["Custom Build Layout", "Structural Engineering Review", "Material Sourcing", "On-site Installation"];
    requiredSkills = ["fabrication", "experiential lead", "3D artist", "scenic installer", "technical director"];
  } else if (category.toLowerCase().includes('video') || category.toLowerCase().includes('film')) {
    deliverables = ["Pre-production & Casting", "Principal Photography", "Editing & Color Grading", "Final Exports"];
    requiredSkills = ["producer", "editor", "creative direction", "post-production"];
  } else if (category.toLowerCase().includes('print')) {
    deliverables = ["File Pre-flight", "Proofing", "Large Format Printing", "Location Installation Verification"];
    requiredSkills = ["print production manager", "scenic installer"];
  } else {
    requiredSkills = ["producer", "project management"];
  }

  return {
    objective: `Execute a successful ${category.toLowerCase()} project within ${request.timeline}.`,
    deliverables,
    assumptions: ["Client provides brand assets within 48h.", "Standard 2 rounds of revisions."],
    requiredSkills
  };
};

export const runMatchingEngine = (request: any, requiredSkills: string[]) => {
  // Simulated matching logic
  
  // 1. Gather all talents
  let scoredTalents = mockTalents.map(talent => {
    let score = {
      total: 0,
      breakdown: {}
    };

    // Calculate Skill Match (0-10)
    const matchedSkills = talent.skills.filter(s => requiredSkills.includes(s)).length;
    const skillScore = requiredSkills.length > 0 
      ? Math.min(10, (matchedSkills / requiredSkills.length) * 10 + (talent.type === 'team' ? 2 : 0)) // Teams get slight skill bonus simulating breadth
      : 8;
    score.breakdown['Skill Match'] = Number(skillScore.toFixed(1));

    // Calculate Availability (0-10)
    const availScore = talent.availability; 
    score.breakdown['Availability'] = Number(availScore.toFixed(1));

    // Calculate Reliability (0-10)
    score.breakdown['Reliability'] = Number(talent.reliability.toFixed(1));

    // Budget Fit (simulated)
    let budgetFit = 8.5; // default good
    if (request.budget.includes('100k') && talent.budgetLevel === 'low') budgetFit = 6.0; // Underpriced / maybe wrong tier
    if (request.budget.includes('25k') && talent.budgetLevel === 'high') budgetFit = 4.0; // Overpriced
    score.breakdown['Budget Fit'] = Number(budgetFit.toFixed(1));

    // Industry / Complexity
    score.breakdown['Complexity Fit'] = Number((talent.reliability * talent.scoreModifier).toFixed(1));
    score.breakdown['Industry Fit'] = talent.scoreModifier > 1.0 ? 9.2 : 8.0;
    
    // Communication & Team Compat
    score.breakdown['Communication Fit'] = talent.type === 'team' ? 9.5 : (talent.reliability - 0.5);

    // Filter out completely unfit ones early
    if (skillScore < 3) return { ...talent, matchScore: 0 };

    // Final weighted score calculation
    let weightedTotal = 
      (score.breakdown['Skill Match'] * 0.35) +
      (score.breakdown['Reliability'] * 0.25) +
      (score.breakdown['Availability'] * 0.20) +
      (score.breakdown['Budget Fit'] * 0.10) +
      (score.breakdown['Complexity Fit'] * 0.10);

    // Recent Use bump (simulated policy: prefer recently proven teams)
    if (talent.recentUse) weightedTotal += 0.2;

    weightedTotal = Math.min(10, weightedTotal);

    return {
      ...talent,
      matchScore: Number(weightedTotal.toFixed(1)),
      scoreBreakdown: score.breakdown
    };
  });

  // Sort by score
  scoredTalents.sort((a, b) => b.matchScore - a.matchScore);

  return scoredTalents[0]; // the top recommendation
};
