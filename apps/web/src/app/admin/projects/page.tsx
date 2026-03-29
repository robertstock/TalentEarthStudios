"use client";

import { useState } from "react";
import Link from "next/link";

type ProjectHealth = "Green" | "Yellow" | "Red";
type ProjectStatus = "Planning" | "Active" | "In Review";

interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  health: ProjectHealth;
  progress: number;
  dueDate: string;
  teamMembers: { name: string; role: string; avatar: string }[];
  sow: string[];
}

const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-101",
    name: "CineVerse Immersive App",
    client: "Global Entertainment Studio",
    status: "Active",
    health: "Green",
    progress: 65,
    dueDate: "2026-10-15",
    teamMembers: [
      { name: "Alex R.", role: "Lead 3D Tech", avatar: "AR" },
      { name: "Jamie C.", role: "UX Engineer", avatar: "JC" },
      { name: "Sam N.", role: "Project Mgr", avatar: "SN" }
    ],
    sow: [
      "Objective: Deliver a full-stack immersive mobile app featuring interactive 3D environments synced to the upcoming film release.",
      "Phase 1 (Completed): Environment conceptualization, asset optimizations for mobile.",
      "Phase 2 (Active): Integration of live AR tracking and real-time lighting.",
      "Phase 3: Beta testing, QA, and global app store deployment."
    ]
  },
  {
    id: "proj-102",
    name: "Automotive VR Showroom",
    client: "Future Motors Inc.",
    status: "Active",
    health: "Yellow",
    progress: 42,
    dueDate: "2026-08-01",
    teamMembers: [
      { name: "Marcus W.", role: "Unreal Dev", avatar: "MW" },
      { name: "Lee H.", role: "3D Modeler", avatar: "LH" }
    ],
    sow: [
      "Objective: Build a high-fidelity VR showroom allowing customers to configure car interiors/exteriors in real-time.",
      "Key Features: Dynamic materials, realistic physics for doors/trunks, guided virtual tour.",
      "Current Blockers: Optimizing texture resolution for standalone VR headsets is causing minor delays."
    ]
  },
  {
    id: "proj-103",
    name: "Web3 NFT Marketplace V2",
    client: "CryptoCollectables",
    status: "In Review",
    health: "Green",
    progress: 90,
    dueDate: "2026-04-10",
    teamMembers: [
      { name: "Taylor P.", role: "Frontend Lead", avatar: "TP" },
      { name: "Dana S.", role: "Smart Contracts", avatar: "DS" },
      { name: "Morgan K.", role: "UI Designer", avatar: "MK" }
    ],
    sow: [
      "Objective: Redesign and deploy version 2 of the digital collectable marketplace.",
      "Deliverables: A sleek dark-mode UI, reduced gas fee optimizations on minting, cross-chain support.",
      "Status: Currently undergoing final security audit and client UX review."
    ]
  },
  {
    id: "proj-104",
    name: "AR Navigation System",
    client: "Metro City Transit",
    status: "Planning",
    health: "Green",
    progress: 15,
    dueDate: "2026-12-05",
    teamMembers: [
      { name: "Jordan M.", role: "Spatial Mapping", avatar: "JM" }
    ],
    sow: [
      "Objective: Initial prototyping for an AR overlay to help commuters navigate the underground transit system.",
      "Activities: Mapping key stations, building iOS/Android dual-prototypes, consulting with accessibility experts.",
      "Budget Alert: Discovery phase remains under budget."
    ]
  },
  {
    id: "proj-105",
    name: "eCommerce Replatform",
    client: "StyleBoutique Global",
    status: "Active",
    health: "Red",
    progress: 30,
    dueDate: "2026-05-20",
    teamMembers: [
      { name: "Chris D.", role: "Fullstack Eng", avatar: "CD" },
      { name: "Robin V.", role: "Backend Architect", avatar: "RV" },
      { name: "Eli F.", role: "QA Lead", avatar: "EF" }
    ],
    sow: [
      "Objective: Migrate legacy monolith eCommerce platform to a headless architecture using Next.js and Shopify.",
      "Challenges: Unforeseen complexities in migrating legacy customer data and integrating the custom inventory API.",
      "Action Required: Emergency sprint started to clear data-migration blockers. Due date is at risk."
    ]
  }
];

// Helper to determine tailwind colors based on health
const getHealthStyles = (health: ProjectHealth) => {
  switch (health) {
    case "Green": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Yellow": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Red": return "bg-red-500/20 text-red-400 border-red-500/30";
  }
};

const getProgressBarColor = (health: ProjectHealth) => {
  switch (health) {
    case "Green": return "bg-emerald-500";
    case "Yellow": return "bg-yellow-500";
    case "Red": return "bg-red-500";
  }
};

export default function ActiveProjects() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(MOCK_PROJECTS[0].id);
  const selectedProject = MOCK_PROJECTS.find(p => p.id === selectedProjectId) || MOCK_PROJECTS[0];

  return (
    <div className="container mx-auto pt-32 pb-12 px-6 text-white min-h-screen flex flex-col">
      {/* Header section */}
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2 mb-4 w-fit">
          <i className="ph ph-arrow-left"></i> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">Active Projects Tracker</h1>
            <p className="text-gray-400 mt-2">Manage ongoing engagements, team allocation, and project health.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-center">
              <span className="block text-2xl font-bold text-white">5</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Total</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-center">
              <span className="block text-2xl font-bold text-emerald-400">3</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-500/70">On Track</span>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg text-center">
              <span className="block text-2xl font-bold text-red-400">1</span>
              <span className="text-[10px] uppercase tracking-wider text-red-500/70">At Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* LEFT COLUMN: Project List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {MOCK_PROJECTS.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`text-left w-full p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                selectedProjectId === project.id 
                  ? "bg-blue-900/30 border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {/* Highlight bar for selected */}
              {selectedProjectId === project.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
              )}

              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-lg ${selectedProjectId === project.id ? "text-white" : "text-gray-200"}`}>
                  {project.name}
                </h3>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${getHealthStyles(project.health)}`}>
                  {project.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-4 line-clamp-1">{project.client}</p>
              
              <div className="flex justify-between items-end">
                <div className="w-full mr-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className={selectedProjectId === project.id ? "text-blue-300" : "text-gray-400"}>{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getProgressBarColor(project.health)}`}
                      style={{ width: \`\${project.progress}%\` }}
                    ></div>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {project.teamMembers.slice(0, 3).map((member, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-[#030508] flex items-center justify-center text-[8px] font-bold text-white z-10" title={member.name}>
                      {member.avatar}
                    </div>
                  ))}
                  {project.teamMembers.length > 3 && (
                     <div className="w-6 h-6 rounded-full bg-slate-800 border border-[#030508] flex items-center justify-center text-[8px] font-bold text-gray-400 z-10">
                       +{project.teamMembers.length - 3}
                     </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* RIGHT COLUMN: Project Details */}
        <div className="lg:col-span-8">
          <div className="bg-[#0B0F15]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 h-full shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Ambient Background Glow based on health */}
            <div className={`absolute top-0 right-0 w-96 h-96 opacity-10 blur-[120px] rounded-full pointer-events-none ${getProgressBarColor(selectedProject.health)} translate-x-1/3 -translate-y-1/3`}></div>

            {/* Header Details */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10 border-b border-white/5 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-white">{selectedProject.name}</h2>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${getHealthStyles(selectedProject.health)}`}>
                    Health: {selectedProject.health}
                  </span>
                </div>
                <p className="text-lg text-gray-400">Client: <span className="text-gray-200">{selectedProject.client}</span></p>
              </div>

              <div className="flex flex-row md:flex-col gap-4 md:gap-2 text-sm md:text-right">
                <div>
                  <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Due Date</span>
                  <span className="text-white font-mono bg-white/5 px-3 py-1.5 rounded">{selectedProject.dueDate}</span>
                </div>
              </div>
            </div>

            {/* SOW & Team */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 flex-1">
              
              {/* Main Info */}
              <div className="md:col-span-2 flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                    <i className="ph ph-file-text"></i> Statement of Work
                  </h3>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
                    {selectedProject.sow.map((paragraph, index) => (
                      <p key={index} className="text-gray-300 leading-relaxed text-sm">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                   <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                    <i className="ph ph-chart-line-up"></i> Completion Details
                  </h3>
                   <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-light text-white">{selectedProject.progress}<span className="text-lg text-gray-500">%</span></span>
                        <span className="text-sm text-gray-400">{selectedProject.status}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-4">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(selectedProject.health)}`}
                          style={{ width: \`\${selectedProject.progress}%\` }}
                        ></div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="flex flex-col gap-6">
                 <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                    <i className="ph ph-users"></i> Project Team
                  </h3>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                    {selectedProject.teamMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-default">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-indigo-900 border border-blue-500/30 flex items-center justify-center font-bold text-blue-200">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{member.name}</div>
                          <div className="text-xs text-blue-400/80">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto">
                    <button className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg transition duration-300 text-sm font-medium flex items-center justify-center gap-2">
                        <i className="ph ph-envelope-simple"></i> Message Team
                    </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
