export const demoScenarios = [
  {
    id: 1,
    title: "Trade show booth activation",
    preset: {
      description: "Need a comprehensive design, build, and installation for a 20x20 custom trade show booth in Las Vegas this November.",
      timeline: "3 months",
      location: "Las Vegas, NV",
      budget: "$50k - $100k",
      category: "Experiential & Fabrication"
    }
  },
  {
    id: 2,
    title: "Video production for a brand launch",
    preset: {
      description: "Looking for an agile production team to shoot a 60-second hero spot and vertical social cutdowns. We have the creative concept.",
      timeline: "1 month",
      location: "Los Angeles, CA",
      budget: "$25k - $50k",
      category: "Film/Video"
    }
  },
  {
    id: 3,
    title: "Large-format print and install campaign",
    preset: {
      description: "City-wide OOH campaign requiring high-resolution printing, wild posting, and building wraps across 15 locations.",
      timeline: "4 weeks",
      location: "New York, NY",
      budget: "$100k+",
      category: "Print Production"
    }
  },
  {
    id: 4,
    title: "Custom fabrication build for event",
    preset: {
      description: "Need a specialized scenic team to construct oversized brand props and interactive LED installations for a pop-up store.",
      timeline: "6 weeks",
      location: "Austin, TX",
      budget: "$25k - $50k",
      category: "Fabrication"
    }
  }
];

export const mockTalents = [
  { id: 't1', name: 'Studio Vertex', type: 'team', role: 'Full-Service Experiential Team', skills: ['fabrication', 'scenic installer', 'experiential lead', '3D artist'], location: 'National', availability: 10, reliability: 9.4, recentUse: true, budgetLevel: 'high', industries: ['Tech', 'Automotive'], isUnion: false, travelCapable: true, scoreModifier: 1.2 },
  { id: 't2', name: 'Lenscrafters Media', type: 'team', role: 'Commercial Production Team', skills: ['producer', 'director', 'editor', 'cinematography'], location: 'Los Angeles, CA', availability: 8, reliability: 9.8, recentUse: false, budgetLevel: 'medium', industries: ['Lifestyle', 'Fashion'], isUnion: false, travelCapable: true, scoreModifier: 1.1 },
  { id: 't3', name: 'MegaPrint Bros', type: 'team', role: 'OOH Print & Install Crew', skills: ['print production manager', 'installer', 'vinyl tech'], location: 'New York, NY', availability: 9, reliability: 8.5, recentUse: true, budgetLevel: 'low', industries: ['Retail', 'FMCG'], isUnion: true, travelCapable: false, scoreModifier: 0.9 },
  { id: 'i1', name: 'Elena Rosas', type: 'individual', role: 'Experiential Lead / Producer', skills: ['experiential lead', 'producer', 'client management'], location: 'Remote', availability: 10, reliability: 9.9, recentUse: true, budgetLevel: 'medium', industries: ['Tech', 'Entertainment'], isUnion: false, travelCapable: true, scoreModifier: 1.3 },
  { id: 'i2', name: 'Marcus Chen', type: 'individual', role: 'Lead 3D Artist', skills: ['3D artist', 'motion graphics', 'rendering'], location: 'Remote', availability: 5, reliability: 9.1, recentUse: false, budgetLevel: 'low', industries: ['Gaming', 'Tech'], isUnion: false, travelCapable: false, scoreModifier: 1.0 },
  { id: 'i3', name: 'David Kim', type: 'individual', role: 'Technical Director', skills: ['technical director', 'LED mapping', 'AV setup'], location: 'Las Vegas, NV', availability: 10, reliability: 9.5, recentUse: true, budgetLevel: 'high', industries: ['Events', 'Concerts'], isUnion: true, travelCapable: true, scoreModifier: 1.15 },
  { id: 'i4', name: 'Sarah Jenkins', type: 'individual', role: 'Senior Editor', skills: ['editor', 'color grading', 'post-production'], location: 'Remote', availability: 8, reliability: 8.8, recentUse: false, budgetLevel: 'medium', industries: ['Commercial', 'Documentary'], isUnion: false, travelCapable: false, scoreModifier: 1.05 },
  { id: 'i5', name: 'Tom Hardy', type: 'individual', role: 'Master Fabricator', skills: ['fabrication', 'scenic installer', 'woodworking', 'metalwork'], location: 'Austin, TX', availability: 9, reliability: 8.2, recentUse: false, budgetLevel: 'medium', industries: ['Events', 'Retail'], isUnion: false, travelCapable: true, scoreModifier: 0.95 },
  // ... more mock records to easily cross minimum requirement
  { id: 't4', name: 'Neon Dreamers', type: 'team', role: 'Creative Direction & Post', skills: ['creative direction', 'post-production', '3D artist'], location: 'Remote', availability: 7, reliability: 9.0, recentUse: true, budgetLevel: 'medium', industries: ['Beauty', 'Tech'], isUnion: false, travelCapable: false, scoreModifier: 1.1 },
  { id: 't5', name: 'Iron & Wood Fabrication', type: 'team', role: 'Custom Build Team', skills: ['fabrication', 'technical production'], location: 'Chicago, IL', availability: 8, reliability: 8.9, recentUse: false, budgetLevel: 'medium', industries: ['Events', 'Museums'], isUnion: true, travelCapable: true, scoreModifier: 0.98 },
  { id: 't6', name: 'Flash Forward Films', type: 'team', role: 'Agile Video Crew', skills: ['producer', 'editor', 'camera operator'], location: 'Atlanta, GA', availability: 10, reliability: 9.2, recentUse: true, budgetLevel: 'medium', industries: ['Sports', 'Corporate'], isUnion: false, travelCapable: true, scoreModifier: 1.05 },
  { id: 'i6', name: 'James Wilson', type: 'individual', role: 'Print Production Manager', skills: ['print production manager', 'vendor management'], location: 'Remote', availability: 10, reliability: 9.6, recentUse: true, budgetLevel: 'high', industries: ['OOH', 'Retail'], isUnion: false, travelCapable: true, scoreModifier: 1.1 },
  { id: 'i7', name: 'Amanda Clarke', type: 'individual', role: 'Experiential Producer', skills: ['producer', 'experiential lead'], location: 'New York, NY', availability: 9, reliability: 9.3, recentUse: false, budgetLevel: 'medium', industries: ['Fashion', 'Tech'], isUnion: false, travelCapable: true, scoreModifier: 1.08 },
  { id: 'i8', name: 'Carlos Gutierrez', type: 'individual', role: 'Scenic Installer', skills: ['scenic installer', 'fabrication'], location: 'Las Vegas, NV', availability: 7, reliability: 8.7, recentUse: false, budgetLevel: 'low', industries: ['Trade Shows'], isUnion: true, travelCapable: true, scoreModifier: 0.95 },
  { id: 'i9', name: 'Lisa Ray', type: 'individual', role: 'Creative Director', skills: ['creative direction', 'branding'], location: 'Remote', availability: 6, reliability: 9.8, recentUse: true, budgetLevel: 'high', industries: ['Lifestyle'], isUnion: false, travelCapable: true, scoreModifier: 1.2 },
  { id: 'i10', name: 'Mark Evans', type: 'individual', role: 'Technical Producer', skills: ['technical production', 'technical director'], location: 'Los Angeles, CA', availability: 9, reliability: 9.4, recentUse: true, budgetLevel: 'medium', industries: ['Entertainment'], isUnion: false, travelCapable: true, scoreModifier: 1.12 },
  { id: 'i11', name: 'Zoe Kravitz', type: 'individual', role: 'Lead Editor', skills: ['editor', 'post-production'], location: 'Remote', availability: 10, reliability: 9.0, recentUse: false, budgetLevel: 'medium', industries: ['Commercial'], isUnion: false, travelCapable: false, scoreModifier: 1.0 },
  { id: 'i12', name: 'Brian Sparks', type: 'individual', role: '3D Animator', skills: ['3D artist', 'post-production'], location: 'Remote', availability: 8, reliability: 8.6, recentUse: true, budgetLevel: 'low', industries: ['Gaming'], isUnion: false, travelCapable: false, scoreModifier: 0.9 }
];
