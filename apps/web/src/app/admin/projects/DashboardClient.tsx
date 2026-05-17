"use client";

import { useState } from "react";
import Link from "next/link";

export type ProjectHealth = "Green" | "Yellow" | "Red";

export interface DashboardProject {
  id: string;
  name: string;
  client: string;
  status: string;
  health: ProjectHealth;
  progress: number;
  dueDate: string;
  isAutoRouted: boolean;
  requiresRpmReview: boolean;
  aiConfidenceScore: number;
  teamMembers: { name: string; role: string; avatar: string }[];
  sow: string[];
  budgetRange: string;
  vendorBills: { amount: number, vendorName: string, status: string }[];
  invoice: { amount: number, status: string } | null;
  meetingNotes: { id: string, title: string, content: string, createdAt: Date }[];
}

interface DashboardClientProps {
    projects: DashboardProject[];
}

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

export default function DashboardClient({ projects }: DashboardClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"SCOPE" | "FINANCIALS" | "MEETING_NOTES">("SCOPE");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const statOnTrack = projects.filter(p => p.health === "Green").length;
  const statAtRisk = projects.filter(p => p.health === "Red").length;
  const statRPMReview = projects.filter(p => p.requiresRpmReview).length;

  if (projects.length === 0) {
      return (
          <div className="container mx-auto pt-32 pb-12 px-6 text-white min-h-screen">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">Active Projects Tracker</h1>
              <div className="mt-12 text-center text-gray-500 bg-white/5 border border-white/10 rounded-2xl p-12">
                  No active projects found. Monitor new intakes via the Request portal.
              </div>
          </div>
      );
  }

  const handleSaveNote = async () => {
      if (!newNoteTitle || !newNoteContent || !selectedProject) return;
      setIsSavingNote(true);
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: newNoteTitle, content: newNoteContent })
          });
          if (res.ok) {
              setNewNoteTitle("");
              setNewNoteContent("");
              window.location.reload(); // Quick refresh to show new data
          } else {
              alert("Failed to save note.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingNote(false);
      }
  };

  const handleRegenerateSow = async () => {
      if (!selectedProject) return;
      setIsRegenerating(true);
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/regenerate-sow`, { method: 'POST' });
          if (res.ok) {
              window.location.reload();
          } else {
              alert("Failed to regenerate SOW.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsRegenerating(false);
      }
  };

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
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-center">
              <span className="block text-2xl font-bold text-white">{projects.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Total</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-center">
              <span className="block text-2xl font-bold text-emerald-400">{statOnTrack}</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-500/70">On Track</span>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg text-center">
              <span className="block text-2xl font-bold text-red-400">{statAtRisk}</span>
              <span className="text-[10px] uppercase tracking-wider text-red-500/70">At Risk</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg text-center shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]">
              <span className="block text-2xl font-bold text-blue-400">{statRPMReview}</span>
              <span className="text-[10px] uppercase tracking-wider text-blue-500/70">Needs RPM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* LEFT COLUMN: Project List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {projects.map((project) => (
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
                  {project.status.replace("_", " ")}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                  <p className="text-sm text-gray-400 line-clamp-1 flex-1">{project.client}</p>
                  {project.requiresRpmReview && (
                      <span title="Action Required by RPM" className="bg-blue-500 text-white text-[9px] uppercase px-1.5 rounded animate-pulse">RPM</span>
                  )}
              </div>
              
              <div className="flex justify-between items-end">
                <div className="w-full mr-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className={selectedProjectId === project.id ? "text-blue-300" : "text-gray-400"}>{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getProgressBarColor(project.health)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {project.teamMembers.length > 0 ? project.teamMembers.slice(0, 3).map((member, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-[#030508] flex items-center justify-center text-[8px] font-bold text-white z-10" title={member.name}>
                      {member.avatar}
                    </div>
                  )) : (
                     <div className="w-6 h-6 rounded-full bg-slate-800 border border-[#030508] flex items-center justify-center text-[8px] font-bold text-gray-500 z-10" title="Unassigned">
                        ?
                      </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* RIGHT COLUMN: Project Details */}
        <div className="lg:col-span-8">
          {selectedProject && (
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
                  <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Due / Target</span>
                  <span className="text-white font-mono bg-white/5 px-3 py-1.5 rounded">{selectedProject.dueDate}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mb-8 border-b border-white/10">
                <button 
                   onClick={() => setActiveTab("SCOPE")}
                   className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === "SCOPE" ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                   Scope & SOW
                </button>
                <button 
                   onClick={() => setActiveTab("FINANCIALS")}
                   className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === "FINANCIALS" ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                   Financial Ledger
                </button>
                <button 
                   onClick={() => setActiveTab("MEETING_NOTES")}
                   className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === "MEETING_NOTES" ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                   Meeting Notes
                   {selectedProject.meetingNotes?.length > 0 && (
                       <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full">{selectedProject.meetingNotes.length}</span>
                   )}
                </button>
            </div>

            {activeTab === "SCOPE" && (
                <>
                {/* AI & Routing Panel (NEW) */}
                <div className="mb-8 relative z-10 flex gap-4 overflow-x-auto">
                     <div className="bg-black/40 border border-white/5 rounded-lg p-3 flex-1 min-w-[200px]">
                          <div className="text-[10px] uppercase text-gray-500 mb-1">AI Confidence</div>
                          <div className="text-xl text-white font-light">{selectedProject.aiConfidenceScore > 0 ? selectedProject.aiConfidenceScore + '%' : 'Pending'}</div>
                     </div>
                     <div className="bg-black/40 border border-white/5 rounded-lg p-3 flex-1 min-w-[200px]">
                          <div className="text-[10px] uppercase text-gray-500 mb-1">Routing Mode</div>
                          <div className="text-xl text-white font-light flex items-center gap-2">
                              {selectedProject.isAutoRouted ? (
                                  <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Auto-Routed</>
                              ) : (
                                  <><span className="w-2 h-2 rounded-full bg-blue-500"></span> Manual RPM Queue</>
                              )}
                          </div>
                     </div>
                </div>

                {/* SOW & Team */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 flex-1">
                  
                  {/* Main Info */}
                  <div className="md:col-span-2 flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                        <i className="ph ph-file-text"></i> Scope Definition
                      </h3>
                      <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
                        {selectedProject.sow.map((paragraph, index) => (
                          <p key={index} className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                            {paragraph}
                          </p>
                        ))}
                        {selectedProject.sow.length === 0 && (
                            <p className="text-gray-500 italic">No AI Statement of Work generated for this job yet.</p>
                        )}
                      </div>
                    </div>

                    <div>
                       <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                        <i className="ph ph-chart-line-up"></i> Completion Details
                      </h3>
                       <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-light text-white">{selectedProject.progress}<span className="text-lg text-gray-500">%</span></span>
                            <span className="text-sm text-gray-400">{selectedProject.status.replace("_", " ")}</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-4">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(selectedProject.health)}`}
                              style={{ width: `${selectedProject.progress}%` }}
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
                      <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3 min-h-[150px]">
                        {selectedProject.teamMembers.length > 0 ? selectedProject.teamMembers.map((member, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-default">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-indigo-900 border border-blue-500/30 flex items-center justify-center font-bold text-blue-200">
                              {member.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{member.name}</div>
                              <div className="text-xs text-blue-400/80">{member.role}</div>
                            </div>
                          </div>
                        )) : (
                            <div className="text-center text-gray-500 text-sm mt-4">
                                Routing engine has not assigned talent.
                            </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedProject.requiresRpmReview && (
                         <div className="mt-auto">
                            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] transition duration-300 text-sm font-bold uppercase tracking-widest">
                                Review AI Generation
                            </button>
                        </div>
                    )}
                    {!selectedProject.requiresRpmReview && (
                        <div className="mt-auto">
                            <button className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg transition duration-300 text-sm font-medium flex items-center justify-center gap-2">
                                <i className="ph ph-envelope-simple"></i> Message Team
                            </button>
                        </div>
                    )}
                  </div>

                </div>
                </>
            )}

            {activeTab === "FINANCIALS" && (
                <div className="flex-1 flex flex-col gap-8 relative z-10 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Estimated Budget</div>
                            <div className="text-2xl font-light text-white">{selectedProject.budgetRange || "N/A"}</div>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Total Vendor Costs</div>
                            <div className="text-2xl font-light text-white">
                                ${selectedProject.vendorBills.reduce((acc, bill) => acc + bill.amount, 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                            <div className="text-xs text-emerald-500 uppercase tracking-widest mb-2">Client Invoice Status</div>
                            <div className="text-2xl font-light text-emerald-400">
                                {selectedProject.invoice ? selectedProject.invoice.status : "Pending Draft"}
                            </div>
                            {selectedProject.invoice && (
                                <div className="text-xs mt-1 text-emerald-500/80">${selectedProject.invoice.amount.toLocaleString()}</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                <i className="ph ph-receipt"></i> Outside Vendor Bills
                            </h3>
                            <button className="text-[10px] uppercase font-bold tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                + Log Bill
                            </button>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                            {selectedProject.vendorBills.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-white/5">
                                            <th className="pb-3 font-medium">Vendor</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProject.vendorBills.map((bill, i) => (
                                            <tr key={i} className="border-b border-white/5 last:border-0 text-gray-300">
                                                <td className="py-3">{bill.vendorName}</td>
                                                <td className="py-3">
                                                    <span className="bg-white/5 px-2 py-1 rounded text-[10px] uppercase text-gray-400">{bill.status}</span>
                                                </td>
                                                <td className="py-3 text-right">${bill.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center text-gray-500 py-6 text-sm">No vendor bills attached to this project.</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto border-t border-white/10 pt-6">
                        <div className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 p-5 rounded-xl">
                            <div>
                                <div className="text-sm font-bold text-white mb-1"><i className="ph ph-arrows-left-right text-blue-500 mr-2"></i> QuickBooks Sync</div>
                                <div className="text-xs text-gray-400">Push vendor data and generate draft client invoice natively into QBO.</div>
                            </div>
                            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded transition-colors shadow">
                                Sync Financials
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "MEETING_NOTES" && (
                <div className="flex-1 flex flex-col gap-6 relative z-10 overflow-y-auto animate-fade-in pr-2">
                    
                    {/* Add Note Form */}
                    <div className="bg-black/40 border border-white/5 rounded-xl p-5 mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4 flex items-center gap-2">
                            <i className="ph ph-plus-circle"></i> Add Meeting Note or Update
                        </h3>
                        <div className="space-y-4">
                            <input 
                                type="text"
                                placeholder="e.g. Meeting 1, Client Email, etc."
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <textarea 
                                placeholder="Paste client emails, text messages, or meeting transcripts here..."
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            ></textarea>
                            <button 
                                onClick={handleSaveNote}
                                disabled={isSavingNote || !newNoteTitle || !newNoteContent}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-widest rounded shadow disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSavingNote ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-floppy-disk"></i>}
                                Save to Project Log
                            </button>
                        </div>
                    </div>

                    {/* SOW Regeneration Prompt */}
                    {selectedProject.meetingNotes?.length > 0 && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-white font-bold mb-1"><i className="ph ph-magic-wand text-blue-400 mr-2"></i> Update Statement of Work</h4>
                                <p className="text-xs text-blue-200/70">Use the AI engine to generate a NEW version of the SOW incorporating all meeting notes below.</p>
                            </div>
                            <button 
                                onClick={handleRegenerateSow}
                                disabled={isRegenerating}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                            >
                                {isRegenerating ? <i className="ph ph-spinner animate-spin"></i> : null}
                                Regenerate SOW
                            </button>
                        </div>
                    )}

                    {/* Notes History */}
                    <div className="space-y-4">
                        {selectedProject.meetingNotes?.length > 0 ? (
                            selectedProject.meetingNotes.map((note) => (
                                <div key={note.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="text-white font-bold">{note.title}</h4>
                                        <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 bg-black/20 rounded-xl border border-dashed border-white/10">
                                <i className="ph ph-note-blank text-3xl mb-2 block opacity-50"></i>
                                No meeting notes saved yet.
                            </div>
                        )}
                    </div>
                </div>
            )}

          </div>
          )}
        </div>

      </div>
    </div>
  );
}
