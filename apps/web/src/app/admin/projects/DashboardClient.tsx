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
  sowVersion: number;
  shareToken: string | null;
  clientStatus: string;
  budgetRange: string;
  vendorBills: { id: string, amount: number, vendorName: string, status: string, date: Date | string }[];
  invoice: { amount: number, status: string } | null;
  meetingNotes: { id: string, title: string, content: string, createdAt: Date }[];
  completedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  cancellationReason?: string | null;
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"SCOPE" | "FINANCIALS" | "MEETING_NOTES">("SCOPE");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [sidebarTab, setSidebarTab] = useState<"ACTIVE" | "COMPLETED" | "CANCELLED">("ACTIVE");
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [cancellationReasonInput, setCancellationReasonInput] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Vendor Bill log state variables
  const [isLogBillModalOpen, setIsLogBillModalOpen] = useState(false);
  const [billVendorName, setBillVendorName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billStatus, setBillStatus] = useState("UNPAID");
  const [billDate, setBillDate] = useState(new Date().toISOString().substring(0, 10));
  const [isSavingBill, setIsSavingBill] = useState(false);

  const activeProjects = projects.filter(p => p.status !== "COMPLETED" && p.status !== "CANCELLED");
  const completedProjects = projects.filter(p => p.status === "COMPLETED");
  const cancelledProjects = projects.filter(p => p.status === "CANCELLED");

  const currentTabProjects = 
    sidebarTab === "ACTIVE" ? activeProjects : 
    sidebarTab === "COMPLETED" ? completedProjects : 
    cancelledProjects;

  // Initialize selectedProjectId if not set
  if (!selectedProjectId && currentTabProjects.length > 0) {
    setSelectedProjectId(currentTabProjects[0].id);
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId) || currentTabProjects[0] || projects[0];

  const numericBudget = (() => {
    if (!selectedProject || !selectedProject.budgetRange) return 0;
    const clean = selectedProject.budgetRange.replace(/,/g, '');
    const matches = clean.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length === 0) return 0;
    return parseFloat(matches[0]);
  })();

  const totalCosts = selectedProject ? selectedProject.vendorBills.reduce((acc, bill) => acc + bill.amount, 0) : 0;
  const projectMargin = numericBudget - totalCosts;

  const formattedBudget = "$" + numericBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedCosts = "$" + totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedMargin = (projectMargin < 0 ? "-" : "") + "$" + Math.abs(projectMargin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statOnTrack = activeProjects.filter(p => p.health === "Green").length;
  const statAtRisk = activeProjects.filter(p => p.health === "Red").length;
  const statRPMReview = activeProjects.filter(p => p.requiresRpmReview).length;

  const handleTabChange = (tab: "ACTIVE" | "COMPLETED" | "CANCELLED") => {
      setSidebarTab(tab);
      const tabProjects = 
          tab === "ACTIVE" ? activeProjects : 
          tab === "COMPLETED" ? completedProjects : 
          cancelledProjects;
      if (tabProjects.length > 0) {
          setSelectedProjectId(tabProjects[0].id);
      } else {
          setSelectedProjectId("");
      }
  };

  const groupProjectsByDate = (projList: DashboardProject[], dateField: "completedAt" | "cancelledAt") => {
      const groups: { [key: string]: DashboardProject[] } = {};
      projList.forEach(p => {
          const val = p[dateField];
          const date = val ? new Date(val) : new Date();
          const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!groups[key]) {
              groups[key] = [];
          }
          groups[key].push(p);
      });
      
      return Object.keys(groups).sort((a, b) => {
          return new Date(b).getTime() - new Date(a).getTime();
      }).map(key => ({
          monthYear: key,
          projects: groups[key]
      }));
  };

  const completedGroups = groupProjectsByDate(completedProjects, "completedAt");
  const cancelledGroups = groupProjectsByDate(cancelledProjects, "cancelledAt");

  const handleCompleteProject = async () => {
      if (!selectedProject) return;
      if (!confirm(`Are you sure you want to mark "${selectedProject.name}" as completed?`)) return;
      setIsCompleting(true);
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
              window.location.reload();
          } else {
              alert("Failed to complete project.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsCompleting(false);
      }
  };

  const handleConfirmCancel = async () => {
      if (!selectedProject || !cancellationReasonInput.trim()) return;
      setIsCancelling(true);
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/cancel`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: cancellationReasonInput.trim() })
          });
          if (res.ok) {
              setIsCancellationModalOpen(false);
              setCancellationReasonInput("");
              window.location.reload();
          } else {
              alert("Failed to cancel project.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsCancelling(false);
      }
  };

  const handleSaveBill = async () => {
      if (!selectedProject || !billVendorName.trim() || !billAmount.trim()) return;
      setIsSavingBill(true);
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/bills`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  vendorName: billVendorName.trim(),
                  amount: parseFloat(billAmount),
                  status: billStatus,
                  date: billDate
              })
          });
          if (res.ok) {
              setBillVendorName("");
              setBillAmount("");
              setBillStatus("UNPAID");
              setIsLogBillModalOpen(false);
              window.location.reload();
          } else {
              const data = await res.json();
              alert(data.message || "Failed to log bill.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingBill(false);
      }
  };

  const handleDeleteBill = async (billId: string) => {
      if (!selectedProject || !confirm("Are you sure you want to delete this vendor bill?")) return;
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/bills`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ billId })
          });
          if (res.ok) {
              window.location.reload();
          } else {
              alert("Failed to delete bill.");
          }
      } catch (e) {
          console.error(e);
      }
  };

  const renderProjectCard = (project: DashboardProject) => {
    return (
      <button
        key={project.id}
        onClick={() => setSelectedProjectId(project.id)}
        className={`text-left w-full p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
          selectedProjectId === project.id 
            ? "bg-blue-900/30 border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]" 
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
      >
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
    );
  };

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

  const handleShareSow = async () => {
      if (!selectedProject) return;
      setIsSharing(true);
      try {
          // If already has token, just copy it
          if (selectedProject.shareToken) {
              const url = `${window.location.origin}/sow/${selectedProject.shareToken}`;
              await navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 3000);
              setIsSharing(false);
              return;
          }

          const res = await fetch(`/api/admin/projects/${selectedProject.id}/sow/share`, { method: 'POST' });
          if (res.ok) {
              const data = await res.json();
              const url = `${window.location.origin}/sow/${data.shareToken}`;
              await navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 3000);
              window.location.reload(); // Refresh to show new token state
          } else {
              alert("Failed to generate link.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSharing(false);
      }
  };

  const handleDownloadSow = () => {
      if (!selectedProject || selectedProject.sow.length === 0) return;
      
      const versionString = `1.${selectedProject.sowVersion - 1}`;
      
      let textContent = `STATEMENT OF WORK\n`;
      textContent += `=================\n\n`;
      textContent += `Project: ${selectedProject.name}\n`;
      textContent += `Client: ${selectedProject.client}\n`;
      textContent += `Version: v${versionString}\n`;
      textContent += `Date: ${new Date().toLocaleDateString()}\n\n`;
      textContent += `-------------------------------------------------\n\n`;
      
      textContent += selectedProject.sow.join('\n\n');
      
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `SOW_${selectedProject.client.replace(/\s+/g, '_')}_v${versionString}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
              <span className="block text-2xl font-bold text-white">{activeProjects.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Active</span>
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
          {/* Sidebar Tab Switcher */}
          <div className="grid grid-cols-3 bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
            <button
              onClick={() => handleTabChange("ACTIVE")}
              className={`py-2 rounded font-bold uppercase tracking-wider text-center transition-colors ${
                sidebarTab === "ACTIVE" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Active ({activeProjects.length})
            </button>
            <button
              onClick={() => handleTabChange("COMPLETED")}
              className={`py-2 rounded font-bold uppercase tracking-wider text-center transition-colors ${
                sidebarTab === "COMPLETED" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Completed ({completedProjects.length})
            </button>
            <button
              onClick={() => handleTabChange("CANCELLED")}
              className={`py-2 rounded font-bold uppercase tracking-wider text-center transition-colors ${
                sidebarTab === "CANCELLED" ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Cancelled ({cancelledProjects.length})
            </button>
          </div>

          {/* Project List Content */}
          <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {sidebarTab === "ACTIVE" && (
              activeProjects.length > 0 ? (
                activeProjects.map((project) => renderProjectCard(project))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm bg-white/5 border border-white/10 rounded-xl">
                  No active projects.
                </div>
              )
            )}

            {sidebarTab === "COMPLETED" && (
              completedGroups.length > 0 ? (
                completedGroups.map((group) => (
                  <div key={group.monthYear} className="space-y-2">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 pt-2 pb-1 border-b border-white/5">
                      {group.monthYear}
                    </div>
                    {group.projects.map((project) => renderProjectCard(project))}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm bg-white/5 border border-white/10 rounded-xl">
                  No completed projects.
                </div>
              )
            )}

            {sidebarTab === "CANCELLED" && (
              cancelledGroups.length > 0 ? (
                cancelledGroups.map((group) => (
                  <div key={group.monthYear} className="space-y-2">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 pt-2 pb-1 border-b border-white/5">
                      {group.monthYear}
                    </div>
                    {group.projects.map((project) => renderProjectCard(project))}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm bg-white/5 border border-white/10 rounded-xl">
                  No cancelled projects.
                </div>
              )
            )}
          </div>
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

              <div className="flex flex-col items-start md:items-end gap-3 text-sm md:text-right">
                <div>
                  <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Due / Target</span>
                  <span className="text-white font-mono bg-white/5 px-3 py-1.5 rounded">{selectedProject.dueDate}</span>
                </div>

                {/* Project Status Actions (Visible only for Active projects) */}
                {selectedProject.status !== "COMPLETED" && selectedProject.status !== "CANCELLED" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCompleteProject}
                      disabled={isCompleting}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition duration-200"
                    >
                      {isCompleting ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-check-circle"></i>}
                      Complete
                    </button>
                    <button
                      onClick={() => setIsCancellationModalOpen(true)}
                      className="px-3 py-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-900/30 text-red-400 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition duration-200"
                    >
                      <i className="ph ph-x-circle"></i>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Completion / Cancellation Notice Banners */}
            {selectedProject.status === "COMPLETED" && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-400 relative z-10">
                <i className="ph ph-check-circle text-2xl"></i>
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider">Project Completed</div>
                  <div className="text-xs text-emerald-500/80">
                    This project was marked completed on {selectedProject.completedAt ? new Date(selectedProject.completedAt).toLocaleDateString(undefined, { dateStyle: 'full' }) : 'Unknown Date'}.
                  </div>
                </div>
              </div>
            )}

            {selectedProject.status === "CANCELLED" && (
              <div className="mb-6 space-y-4 relative z-10">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                  <i className="ph ph-x-circle text-2xl"></i>
                  <div>
                    <div className="font-bold text-sm uppercase tracking-wider">Project Cancelled</div>
                    <div className="text-xs text-red-500/80">
                      This project was marked cancelled on {selectedProject.cancelledAt ? new Date(selectedProject.cancelledAt).toLocaleDateString(undefined, { dateStyle: 'full' }) : 'Unknown Date'}.
                    </div>
                  </div>
                </div>
                {selectedProject.cancellationReason && (
                  <div className="bg-black/30 border border-white/5 rounded-xl p-5">
                    <h4 className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-2">Reason for Cancellation</h4>
                    <p className="text-sm text-gray-300 italic">"{selectedProject.cancellationReason}"</p>
                  </div>
                )}
              </div>
            )}

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
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><i className="ph ph-file-text"></i> Scope Definition</span>
                        {selectedProject.sow.length > 0 && (
                            <span className="flex items-center gap-3">
                                {selectedProject.clientStatus === 'APPROVED' && (
                                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] tracking-widest font-bold border border-emerald-500/30 flex items-center gap-1">
                                        <i className="ph ph-check-circle"></i> CLIENT APPROVED
                                    </span>
                                )}
                                {selectedProject.clientStatus === 'REVISION_REQUESTED' && (
                                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-[10px] tracking-widest font-bold border border-yellow-500/30 flex items-center gap-1">
                                        <i className="ph ph-warning-circle"></i> REVISION REQUESTED
                                    </span>
                                )}
                                <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2 py-1 rounded text-[10px] tracking-widest shadow-inner">
                                    VERSION 1.{selectedProject.sowVersion - 1}
                                </span>
                            </span>
                        )}
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
                    {!selectedProject.requiresRpmReview && selectedProject.sow.length > 0 && (
                        <div className="mt-auto flex flex-col gap-3">
                            <button 
                                onClick={handleDownloadSow}
                                className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg transition duration-300 text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <i className="ph ph-download-simple"></i> Download SOW (.txt)
                            </button>
                            
                            <button 
                                onClick={handleShareSow}
                                disabled={isSharing}
                                className={`w-full py-4 rounded-lg shadow transition duration-300 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${copiedLink ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'}`}
                            >
                                {isSharing ? <i className="ph ph-spinner animate-spin"></i> : (copiedLink ? <i className="ph ph-check"></i> : <i className="ph ph-link"></i>)}
                                {copiedLink ? "Link Copied!" : "Share Client SOW"}
                            </button>
                        </div>
                    )}
                  </div>

                </div>
                </>
            )}

            {activeTab === "FINANCIALS" && (
                <div className="flex-1 flex flex-col gap-8 relative z-10 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Estimated Budget</div>
                            <div className="text-2xl font-light text-white">{formattedBudget}</div>
                            {selectedProject.budgetRange && selectedProject.budgetRange !== formattedBudget && selectedProject.budgetRange !== String(numericBudget) && (
                                <div className="text-xs mt-1 text-gray-400 font-mono line-clamp-1" title={selectedProject.budgetRange}>Ref: {selectedProject.budgetRange}</div>
                            )}
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Total Vendor Costs</div>
                            <div className="text-2xl font-light text-white">{formattedCosts}</div>
                        </div>
                        <div className={`border rounded-xl p-5 ${
                            projectMargin >= 0 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]" 
                                : "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]"
                        }`}>
                            <div className="text-xs uppercase tracking-widest mb-2 opacity-80">Project Margin</div>
                            <div className="text-2xl font-bold">{formattedMargin}</div>
                            <div className="text-xs mt-1 opacity-70">
                                {numericBudget > 0 
                                    ? `${((projectMargin / numericBudget) * 100).toFixed(1)}% margin` 
                                    : "N/A"
                                }
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
                            {selectedProject.status !== "COMPLETED" && selectedProject.status !== "CANCELLED" && (
                                <button 
                                    onClick={() => setIsLogBillModalOpen(true)}
                                    className="text-[10px] uppercase font-bold tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    + Log Bill
                                </button>
                            )}
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                            {selectedProject.vendorBills.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-white/5">
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Vendor</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium text-right">Amount</th>
                                            <th className="pb-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProject.vendorBills.map((bill, i) => (
                                            <tr key={bill.id || i} className="border-b border-white/5 last:border-0 text-gray-300">
                                                <td className="py-3 font-mono text-xs">
                                                    {bill.date ? new Date(bill.date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-3">{bill.vendorName}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                                                        bill.status === "PAID" 
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                    }`}>
                                                        {bill.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right font-medium">${bill.amount.toLocaleString()}</td>
                                                <td className="py-3 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteBill(bill.id)}
                                                        className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                                                        title="Delete Bill"
                                                    >
                                                        <i className="ph ph-trash"></i>
                                                    </button>
                                                </td>
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

      {/* Cancellation Reason Modal */}
      {isCancellationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0B0F15] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2">Cancel Project</h3>
            <p className="text-sm text-gray-400 mb-4 font-light">Please specify the reason for cancelling this project. It will be saved in the Cancelled Archive.</p>
            
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 transition-colors mb-4 resize-none"
              rows={4}
              placeholder="Reason for cancellation (required)..."
              value={cancellationReasonInput}
              onChange={(e) => setCancellationReasonInput(e.target.value)}
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCancellationModalOpen(false);
                  setCancellationReasonInput("");
                }}
                className="px-4 py-2 border border-white/10 rounded text-sm text-gray-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancellationReasonInput.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded text-sm font-bold transition flex items-center gap-1.5"
              >
                {isCancelling ? <i className="ph ph-spinner animate-spin"></i> : null}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Bill Modal */}
      {isLogBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0B0F15] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in text-left">
            <h3 className="text-xl font-bold text-white mb-2">Log Vendor Bill</h3>
            <p className="text-sm text-gray-400 mb-6 font-light">Add a new cost item to this project's financial ledger.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Fabrication"
                  value={billVendorName}
                  onChange={(e) => setBillVendorName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">Amount (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">Payment Status</label>
                  <select
                    value={billStatus}
                    onChange={(e) => setBillStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  >
                    <option value="UNPAID" className="bg-[#0B0F15]">UNPAID</option>
                    <option value="PAID" className="bg-[#0B0F15]">PAID</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">Bill Date</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setIsLogBillModalOpen(false);
                  setBillVendorName("");
                  setBillAmount("");
                  setBillStatus("UNPAID");
                }}
                className="px-4 py-2 border border-white/10 rounded text-sm text-gray-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBill}
                disabled={isSavingBill || !billVendorName.trim() || !billAmount.trim() || parseFloat(billAmount) <= 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-bold transition flex items-center gap-1.5"
              >
                {isSavingBill ? <i className="ph ph-spinner animate-spin"></i> : null}
                Save Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
