"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getProjectCostCategoryLabel,
  isProjectCostCategory,
  normalizeProjectCostAmountInput,
  parseProjectCostAmount,
  PROJECT_COST_CATEGORIES,
  type ProjectCostCategory,
} from "@/lib/project-costs";
import {
  createCustomerInvoicePdf,
  getCustomerInvoicePdfFilename,
} from "@/lib/customer-invoice-pdf";
import {
  calculateProjectPricing,
  removeProjectCostLine,
  upsertProjectCostLine,
} from "@/lib/project-pricing";

export type ProjectHealth = "Green" | "Yellow" | "Red";

export interface DashboardProject {
  id: string;
  name: string;
  jobName: string | null;
  categoryName: string;
  client: string;
  linkedClientName: string;
  clientNameOverride: string | null;
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
  retailMultiplier: number;
  vendorBills: { id: string, amount: number, vendorName: string, category: string, status: string, date: string }[];
  invoice: { amount: number, status: string } | null;
  meetingNotes: { id: string, title: string, content: string, createdAt: string }[];
  completedAt?: string | null;
  cancelledAt?: string | null;
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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function DashboardClient({ projects }: DashboardClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
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
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [deleteProjectConfirmation, setDeleteProjectConfirmation] = useState("");
  const [deleteProjectError, setDeleteProjectError] = useState("");
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [isJobNameModalOpen, setIsJobNameModalOpen] = useState(false);
  const [jobNameInput, setJobNameInput] = useState("");
  const [isSavingJobName, setIsSavingJobName] = useState(false);
  const [jobNameError, setJobNameError] = useState("");

  // A project-specific client label avoids renaming the linked client record on other jobs.
  const [isClientNameModalOpen, setIsClientNameModalOpen] = useState(false);
  const [clientNameInput, setClientNameInput] = useState("");
  const [isSavingClientName, setIsSavingClientName] = useState(false);
  const [clientNameError, setClientNameError] = useState("");

  // Project cost form state
  const [isLogBillModalOpen, setIsLogBillModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [billCategory, setBillCategory] = useState<ProjectCostCategory>("OUTSIDE_PRINTING");
  const [billCostName, setBillCostName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billStatus, setBillStatus] = useState("UNPAID");
  const [billDate, setBillDate] = useState(new Date().toISOString().substring(0, 10));
  const [billFormError, setBillFormError] = useState("");
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);
  const [vendorBillsByProjectId, setVendorBillsByProjectId] = useState<Record<string, DashboardProject["vendorBills"]>>(
    () => Object.fromEntries(projects.map((project) => [project.id, project.vendorBills])),
  );
  const [retailMultipliers, setRetailMultipliers] = useState<Record<string, number>>(
    () => Object.fromEntries(projects.map((project) => [project.id, project.retailMultiplier])),
  );
  const [pricingSaveState, setPricingSaveState] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");

  const activeProjects = projects.filter(p => p.status !== "COMPLETED" && p.status !== "CANCELLED");
  const completedProjects = projects.filter(p => p.status === "COMPLETED");
  const cancelledProjects = projects.filter(p => p.status === "CANCELLED");

  const currentTabProjects = 
    sidebarTab === "ACTIVE" ? activeProjects : 
    sidebarTab === "COMPLETED" ? completedProjects : 
    cancelledProjects;

  const effectiveSelectedProjectId = selectedProjectId || currentTabProjects[0]?.id || projects[0]?.id || "";
  const selectedProject = projects.find(p => p.id === effectiveSelectedProjectId) || projects[0];

  const retailMultiplier = selectedProject ? retailMultipliers[selectedProject.id] ?? selectedProject.retailMultiplier : 1;
  const selectedVendorBills = selectedProject
    ? vendorBillsByProjectId[selectedProject.id] ?? selectedProject.vendorBills
    : [];
  const projectPricing = calculateProjectPricing(selectedVendorBills, retailMultiplier);
  const {
      customerLineItems,
      deliveryCosts,
      grossMargin,
      grossProfit,
      markupEligibleCosts,
      retailPrice,
      totalCosts,
  } = projectPricing;

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
      setPricingSaveState("IDLE");
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

  const handleSavePricing = async () => {
      if (!selectedProject) return;
      setPricingSaveState("SAVING");
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/pricing`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ multiplier: retailMultiplier }),
          });

          if (!res.ok) {
              throw new Error("Failed to save pricing");
          }

          setPricingSaveState("SAVED");
      } catch (error) {
          console.error(error);
          setPricingSaveState("ERROR");
      }
  };

  const openJobNameModal = () => {
      if (!selectedProject) return;
      setJobNameInput(selectedProject.jobName || "");
      setJobNameError("");
      setIsJobNameModalOpen(true);
  };

  const handleSaveJobName = async () => {
      if (!selectedProject || !jobNameInput.trim()) {
          setJobNameError("Enter a job name.");
          return;
      }

      setIsSavingJobName(true);
      setJobNameError("");
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/job-name`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobName: jobNameInput.trim() }),
          });
          const data = await res.json();

          if (!res.ok) {
              throw new Error(data.message || "Could not update job name.");
          }

          window.location.reload();
      } catch (error) {
          console.error(error);
          setJobNameError(error instanceof Error ? error.message : "Could not update job name.");
          setIsSavingJobName(false);
      }
  };

  const openClientNameModal = () => {
      if (!selectedProject) return;
      setClientNameInput(selectedProject.client);
      setClientNameError("");
      setIsClientNameModalOpen(true);
  };

  const handleSaveClientName = async (clientName: string | null = clientNameInput) => {
      if (!selectedProject) return;
      if (clientName !== null && !clientName.trim()) {
          setClientNameError("Enter a client name.");
          return;
      }

      setIsSavingClientName(true);
      setClientNameError("");
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/client-name`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientName: clientName === null ? null : clientName.trim() }),
          });
          const data = await res.json();

          if (!res.ok) {
              throw new Error(data.message || "Could not update client name.");
          }

          window.location.reload();
      } catch (error) {
          console.error(error);
          setClientNameError(error instanceof Error ? error.message : "Could not update client name.");
          setIsSavingClientName(false);
      }
  };

  const handleExportInvoicePdf = () => {
      if (!selectedProject || customerLineItems.length === 0 || retailPrice <= 0) return;

      const invoiceDate = new Date();
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const pdf = createCustomerInvoicePdf({
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          customerName: selectedProject.client,
          invoiceDate,
          dueDate,
          lineItems: customerLineItems.map((line) => ({
              description: line.description,
              amount: line.amount,
          })),
      });
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = getCustomerInvoicePdfFilename(selectedProject.name, selectedProject.id);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
  };

  const openDeleteProjectModal = () => {
      setDeleteProjectConfirmation("");
      setDeleteProjectError("");
      setIsDeleteProjectModalOpen(true);
  };

  const handleDeleteProject = async () => {
      if (!selectedProject || selectedProject.status !== "CANCELLED") return;
      if (deleteProjectConfirmation.trim().toUpperCase() !== "DELETE") {
          setDeleteProjectError("Type DELETE to confirm permanent removal.");
          return;
      }

      setIsDeletingProject(true);
      setDeleteProjectError("");
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}`, {
              method: "DELETE",
          });
          const data = await res.json();

          if (!res.ok) {
              throw new Error(data.message || "Could not delete the project.");
          }

          window.location.reload();
      } catch (error) {
          console.error(error);
          setDeleteProjectError(error instanceof Error ? error.message : "Could not delete the project.");
          setIsDeletingProject(false);
      }
  };

  const resetBillForm = () => {
      setEditingBillId(null);
      setBillCategory("OUTSIDE_PRINTING");
      setBillCostName("");
      setBillAmount("");
      setBillStatus("UNPAID");
      setBillDate(new Date().toISOString().substring(0, 10));
      setBillFormError("");
  };

  const openAddBillModal = () => {
      resetBillForm();
      setIsLogBillModalOpen(true);
  };

  const openEditBillModal = (bill: DashboardProject["vendorBills"][number]) => {
      const category = isProjectCostCategory(bill.category) ? bill.category : "OTHER";
      const defaultCostName = getProjectCostCategoryLabel(category);

      setEditingBillId(bill.id);
      setBillCategory(category);
      setBillCostName(category === "OTHER" || bill.vendorName !== defaultCostName ? bill.vendorName : "");
      setBillAmount(normalizeProjectCostAmountInput(bill.amount));
      setBillStatus(bill.status === "PAID" ? "PAID" : "UNPAID");
      setBillDate(bill.date.substring(0, 10));
      setBillFormError("");
      setIsLogBillModalOpen(true);
  };

  const closeBillModal = () => {
      setIsLogBillModalOpen(false);
      resetBillForm();
  };

  const handleSaveBill = async () => {
      if (!selectedProject) return;

      const parsedAmount = parseProjectCostAmount(billAmount);
      if (parsedAmount === null) {
          setBillFormError("Enter a valid amount greater than $0.00.");
          return;
      }
      if (billCategory === "OTHER" && !billCostName.trim()) {
          setBillFormError("Enter a custom cost name.");
          return;
      }

      setIsSavingBill(true);
      setBillFormError("");
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/bills`, {
              method: editingBillId ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  billId: editingBillId,
                  category: billCategory,
                  costName: billCostName.trim(),
                  amount: parsedAmount,
                  status: billStatus,
                  date: billDate,
              }),
          });
          const data: {
              message?: string;
              bill?: DashboardProject["vendorBills"][number];
          } = await res.json();

          if (!res.ok || !data.bill) {
              throw new Error(data.message || `Failed to ${editingBillId ? "update" : "add"} cost.`);
          }

          const savedBill = {
              ...data.bill,
              amount: Number(data.bill.amount),
              date: String(data.bill.date),
          };
          setVendorBillsByProjectId((current) => ({
              ...current,
              [selectedProject.id]: upsertProjectCostLine(
                  current[selectedProject.id] ?? selectedProject.vendorBills,
                  savedBill,
              ),
          }));
          closeBillModal();
      } catch (error) {
          console.error(error);
          setBillFormError(error instanceof Error ? error.message : "The cost could not be saved.");
      } finally {
          setIsSavingBill(false);
      }
  };

  const handleDeleteBill = async (billId: string) => {
      if (!selectedProject || !confirm("Delete this project cost? This cannot be undone.")) return;

      setDeletingBillId(billId);
      try {
          const res = await fetch(`/api/admin/projects/${selectedProject.id}/bills`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ billId }),
          });
          const data: { message?: string } = await res.json();

          if (!res.ok) {
              throw new Error(data.message || "Failed to delete cost.");
          }

          setVendorBillsByProjectId((current) => ({
              ...current,
              [selectedProject.id]: removeProjectCostLine(
                  current[selectedProject.id] ?? selectedProject.vendorBills,
                  billId,
              ),
          }));
      } catch (error) {
          console.error(error);
          alert(error instanceof Error ? error.message : "Failed to delete cost.");
      } finally {
          setDeletingBillId(null);
      }
  };

  const renderProjectCard = (project: DashboardProject) => {
    const isSelected = effectiveSelectedProjectId === project.id;

    return (
      <button
        key={project.id}
        onClick={() => {
          setSelectedProjectId(project.id);
          setPricingSaveState("IDLE");
        }}
        className={`text-left w-full p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
          isSelected
            ? "bg-blue-900/30 border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]" 
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
      >
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
        )}

        <div className="flex justify-between items-start gap-3 mb-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 line-clamp-1">
              {project.categoryName}
            </p>
            <h3 className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-200"}`}>
              {project.jobName || "Add Job Name"}
            </h3>
          </div>
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
              <span className={isSelected ? "text-blue-300" : "text-gray-400"}>{project.progress}%</span>
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
                <div className="flex items-start gap-3 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-blue-400 font-semibold mb-1">Job Name</p>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-3xl font-bold ${selectedProject.jobName ? "text-white" : "text-gray-500"}`}>
                        {selectedProject.jobName || "Add Job Name"}
                      </h2>
                      <button
                        type="button"
                        onClick={openJobNameModal}
                        className="p-1.5 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                        aria-label={`Edit job name for ${selectedProject.name}`}
                        title="Edit job name"
                      >
                        <i className="ph ph-pencil-simple"></i>
                      </button>
                    </div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mt-2">
                      Category: <span className="normal-case tracking-normal text-gray-400">{selectedProject.categoryName}</span>
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${getHealthStyles(selectedProject.health)}`}>
                    Health: {selectedProject.health}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg text-gray-400">Client: <span className="text-gray-200">{selectedProject.client}</span></p>
                  <button
                    type="button"
                    onClick={openClientNameModal}
                    className="p-1.5 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                    aria-label={`Edit client name for ${selectedProject.name}`}
                    title="Edit client name for this project"
                  >
                    <i className="ph ph-pencil-simple"></i>
                  </button>
                </div>
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
                    <p className="text-sm text-gray-300 italic">&ldquo;{selectedProject.cancellationReason}&rdquo;</p>
                  </div>
                )}
                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Archive, then delete</h4>
                    <p className="text-xs text-gray-400 max-w-2xl">
                      Export the customer invoice PDF first if you need a permanent copy. Deleting removes this project and all of its related records and cannot be undone.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleExportInvoicePdf}
                      disabled={customerLineItems.length === 0 || retailPrice <= 0}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                      title={customerLineItems.length === 0 || retailPrice <= 0 ? "No invoice line items are available to export" : "Download customer invoice PDF"}
                    >
                      <i className="ph ph-file-pdf"></i>
                      Export PDF
                    </button>
                    <button
                      type="button"
                      onClick={openDeleteProjectModal}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                    >
                      <i className="ph ph-trash"></i>
                      Delete Project
                    </button>
                  </div>
                </div>
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
                            <div className="text-2xl font-light text-white">{selectedProject.budgetRange || "Pending"}</div>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Total COGS</div>
                            <div className="text-2xl font-light text-white">{currencyFormatter.format(totalCosts)}</div>
                            <div className="text-xs mt-1 text-gray-500">{selectedVendorBills.length} cost item{selectedVendorBills.length === 1 ? "" : "s"}</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 text-blue-300">
                            <div className="text-xs uppercase tracking-widest mb-2 opacity-80">Retail Price</div>
                            <div className="text-2xl font-bold">{currencyFormatter.format(retailPrice)}</div>
                            <div className="text-xs mt-1 opacity-70">Marked costs × {retailMultiplier.toFixed(1)} + delivery at cost</div>
                        </div>
                        <div className={`${grossProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"} border rounded-xl p-5`}>
                            <div className="text-xs uppercase tracking-widest mb-2 opacity-80">Gross Profit</div>
                            <div className="text-2xl font-bold">{currencyFormatter.format(grossProfit)}</div>
                            <div className="text-xs mt-1 opacity-70">{retailPrice > 0 ? `${grossMargin.toFixed(1)}% margin` : "Add costs to calculate"}</div>
                        </div>
                    </div>

                    <section className="bg-gradient-to-br from-emerald-950/30 to-blue-950/20 border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-[0_0_35px_-20px_rgba(16,185,129,0.6)]">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Retail Pricing Calculator</div>
                                <h3 className="text-2xl font-light text-white">Set your non-delivery cost multiplier</h3>
                                <p className="text-sm text-gray-400 mt-2 max-w-2xl">The slider marks up printing, materials, labor, rentals, travel, and custom costs. Courier, delivery, and freight always pass through at the entered amount.</p>
                            </div>
                            <div className="min-w-[150px] rounded-xl bg-black/30 border border-white/10 px-5 py-3 text-center">
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Multiplier</div>
                                <div className="text-3xl font-bold text-emerald-400">{retailMultiplier.toFixed(1)}×</div>
                            </div>
                        </div>

                        <label htmlFor="retail-multiplier" className="sr-only">Retail price multiplier</label>
                        <input
                            id="retail-multiplier"
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={retailMultiplier}
                            onChange={(event) => {
                                setRetailMultipliers((current) => ({
                                    ...current,
                                    [selectedProject.id]: Number(event.target.value),
                                }));
                                setPricingSaveState("IDLE");
                            }}
                            disabled={selectedProject.status === "COMPLETED" || selectedProject.status === "CANCELLED"}
                            className="w-full h-3 rounded-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 accent-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2" aria-hidden="true">
                            <span>0×</span>
                            <span>2×</span>
                            <span>4×</span>
                            <span>6×</span>
                            <span>8×</span>
                            <span>10×</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
                            <div className="bg-black/25 border border-white/5 rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Costs Marked Up</div>
                                <div className="text-xl text-white mt-1">{currencyFormatter.format(markupEligibleCosts)}</div>
                            </div>
                            <div className="bg-black/25 border border-white/5 rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Delivery Pass-Through</div>
                                <div className="text-xl text-white mt-1">{currencyFormatter.format(deliveryCosts)}</div>
                            </div>
                            <div className="bg-black/25 border border-white/5 rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Retail Price</div>
                                <div className="text-xl text-blue-300 mt-1">{currencyFormatter.format(retailPrice)}</div>
                            </div>
                            <div className="bg-black/25 border border-white/5 rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Gross Profit</div>
                                <div className={`text-xl mt-1 ${grossProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{currencyFormatter.format(grossProfit)}</div>
                            </div>
                        </div>

                        {selectedProject.status !== "COMPLETED" && selectedProject.status !== "CANCELLED" && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
                                <div className={`text-xs ${pricingSaveState === "ERROR" ? "text-red-400" : "text-gray-500"}`} role="status">
                                    {pricingSaveState === "SAVING" && "Saving pricing…"}
                                    {pricingSaveState === "SAVED" && "Pricing saved to this project."}
                                    {pricingSaveState === "ERROR" && "Pricing could not be saved. Please try again."}
                                    {pricingSaveState === "IDLE" && "Save when you are happy with the retail price."}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSavePricing}
                                    disabled={pricingSaveState === "SAVING"}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    {pricingSaveState === "SAVING" ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-floppy-disk"></i>}
                                    Save Retail Price
                                </button>
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                <i className="ph ph-receipt"></i> Project Cost Ledger
                            </h3>
                            {selectedProject.status !== "COMPLETED" && selectedProject.status !== "CANCELLED" && (
                                <button 
                                    onClick={openAddBillModal}
                                    className="text-[10px] uppercase font-bold tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    + Add Cost
                                </button>
                            )}
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 overflow-x-auto">
                            {selectedVendorBills.length > 0 ? (
                                <table className="w-full min-w-[720px] text-left text-sm">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-white/5">
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Category</th>
                                            <th className="pb-3 font-medium">Cost Name</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium text-right">Amount</th>
                                            <th className="pb-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedVendorBills.map((bill) => (
                                            <tr key={bill.id} className="border-b border-white/5 last:border-0 text-gray-300">
                                                <td className="py-3 font-mono text-xs">
                                                    {bill.date ? new Date(bill.date).toLocaleDateString(undefined, { timeZone: "UTC" }) : 'N/A'}
                                                </td>
                                                <td className="py-3 text-gray-400">{getProjectCostCategoryLabel(bill.category || "OTHER")}</td>
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
                                                <td className="py-3 text-right font-medium">{currencyFormatter.format(bill.amount)}</td>
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditBillModal(bill)}
                                                            disabled={deletingBillId === bill.id}
                                                            className="text-blue-400 hover:text-blue-300 disabled:opacity-40 p-1.5 rounded transition-colors"
                                                            title="Edit cost"
                                                            aria-label={`Edit ${bill.vendorName}`}
                                                        >
                                                            <i className="ph ph-pencil-simple"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleDeleteBill(bill.id)}
                                                            disabled={deletingBillId === bill.id}
                                                            className="text-red-400 hover:text-red-300 disabled:opacity-40 p-1.5 rounded transition-colors"
                                                            title="Delete cost"
                                                            aria-label={`Delete ${bill.vendorName}`}
                                                        >
                                                            <i className={`ph ${deletingBillId === bill.id ? "ph-spinner animate-spin" : "ph-trash"}`}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="text-white border-t border-white/10">
                                            <td colSpan={4} className="pt-4 text-xs font-bold uppercase tracking-widest text-gray-500">Total COGS</td>
                                            <td className="pt-4 text-right font-bold text-lg">{currencyFormatter.format(totalCosts)}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center text-gray-500 py-8 text-sm">
                                    <i className="ph ph-receipt text-3xl block mb-2 opacity-50"></i>
                                    No project costs yet. Add the first cost to begin calculating COGS.
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="mt-auto border-t border-white/10 pt-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-blue-900/10 border border-blue-500/20 p-5 rounded-xl">
                            <div>
                                <div className="text-sm font-bold text-white mb-1"><i className="ph ph-file-pdf text-blue-500 mr-2"></i> Customer Invoice PDF</div>
                                <div className="text-xs text-gray-400">Downloads every customer-facing line item at its retail amount. Internal costs, COGS, margin, and multiplier are never included.</div>
                            </div>
                            <button
                                type="button"
                                onClick={handleExportInvoicePdf}
                                disabled={customerLineItems.length === 0 || retailPrice <= 0}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded transition-colors shadow whitespace-nowrap"
                                title={customerLineItems.length === 0 || retailPrice <= 0 ? "Add line items and set a retail price above $0 before exporting" : "Download customer invoice PDF"}
                            >
                                Export Invoice PDF
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

      {/* Permanently Delete Cancelled Project Modal */}
      {isDeleteProjectModalOpen && selectedProject?.status === "CANCELLED" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B0F15] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in text-left">
            <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl mb-4">
              <i className="ph ph-warning"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Permanently Delete Project?</h3>
            <p className="text-sm text-gray-400 font-light">
              <span className="text-white font-medium">{selectedProject.name}</span> and all related costs, invoices, SOWs, notes, recordings, and attachments will be removed. This cannot be undone.
            </p>
            <p className="text-xs text-amber-400/90 mt-3">Export the invoice PDF before continuing if you need an archive copy.</p>

            <label htmlFor="delete-project-confirmation" className="block text-xs uppercase tracking-wider text-gray-500 mt-6 mb-1.5 font-semibold">
              Type DELETE to confirm
            </label>
            <input
              id="delete-project-confirmation"
              type="text"
              autoFocus
              autoComplete="off"
              value={deleteProjectConfirmation}
              onChange={(event) => {
                setDeleteProjectConfirmation(event.target.value);
                setDeleteProjectError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && deleteProjectConfirmation.trim().toUpperCase() === "DELETE") {
                  void handleDeleteProject();
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
            {deleteProjectError && <p className="text-xs text-red-400 mt-2" role="alert">{deleteProjectError}</p>}

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteProjectModalOpen(false);
                  setDeleteProjectConfirmation("");
                  setDeleteProjectError("");
                }}
                disabled={isDeletingProject}
                className="px-4 py-2 border border-white/10 rounded text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50 transition"
              >
                Keep Project
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteProject()}
                disabled={isDeletingProject || deleteProjectConfirmation.trim().toUpperCase() !== "DELETE"}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded text-sm font-bold transition flex items-center gap-1.5"
              >
                {isDeletingProject ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-trash"></i>}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Job Name Modal */}
      {isJobNameModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0B0F15] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in text-left">
            <h3 className="text-xl font-bold text-white mb-2">Edit Job Name</h3>
            <p className="text-sm text-gray-400 mb-6 font-light">
              This is the main title shown in the tracker and customer exports. The category remains {selectedProject.categoryName}.
            </p>

            <label htmlFor="project-job-name" className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">Job Name</label>
            <input
              id="project-job-name"
              type="text"
              maxLength={160}
              autoFocus
              value={jobNameInput}
              onChange={(event) => {
                setJobNameInput(event.target.value);
                setJobNameError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && jobNameInput.trim()) void handleSaveJobName();
              }}
              placeholder="Enter the job name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            {jobNameError && <p className="text-xs text-red-400 mt-2" role="alert">{jobNameError}</p>}

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setIsJobNameModalOpen(false)}
                disabled={isSavingJobName}
                className="px-4 py-2 border border-white/10 rounded text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveJobName()}
                disabled={isSavingJobName || !jobNameInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-bold transition flex items-center gap-1.5"
              >
                {isSavingJobName ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-floppy-disk"></i>}
                Save Job Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project-specific Client Name Modal */}
      {isClientNameModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0B0F15] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in text-left">
            <h3 className="text-xl font-bold text-white mb-2">Edit Client Name</h3>
            <p className="text-sm text-gray-400 mb-6 font-light">
              This changes the client name on this project and its invoice export only. Other projects linked to {selectedProject.linkedClientName} will not change.
            </p>

            <label htmlFor="project-client-name" className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">Client Name</label>
            <input
              id="project-client-name"
              type="text"
              maxLength={160}
              autoFocus
              value={clientNameInput}
              onChange={(event) => {
                setClientNameInput(event.target.value);
                setClientNameError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && clientNameInput.trim()) void handleSaveClientName();
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            {clientNameError && <p className="text-xs text-red-400 mt-2" role="alert">{clientNameError}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
              <div>
                {selectedProject.clientNameOverride && (
                  <button
                    type="button"
                    onClick={() => void handleSaveClientName(null)}
                    disabled={isSavingClientName}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    Use linked name: {selectedProject.linkedClientName}
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClientNameModalOpen(false)}
                  disabled={isSavingClientName}
                  className="px-4 py-2 border border-white/10 rounded text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveClientName()}
                  disabled={isSavingClientName || !clientNameInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-bold transition flex items-center gap-1.5"
                >
                  {isSavingClientName ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-floppy-disk"></i>}
                  Save Client Name
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Cost Modal */}
      {isLogBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0B0F15] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in text-left">
            <h3 className="text-xl font-bold text-white mb-2">{editingBillId ? "Edit Project Cost" : "Add Project Cost"}</h3>
            <p className="text-sm text-gray-400 mb-6 font-light">
              {editingBillId
                ? "Update this cost item. COGS and retail calculations will refresh immediately."
                : "Record a cost as the job progresses. It will be included in total COGS immediately."}
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="cost-category" className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">Cost Category</label>
                <select
                  id="cost-category"
                  value={billCategory}
                  onChange={(event) => setBillCategory(event.target.value as ProjectCostCategory)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  {PROJECT_COST_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value} className="bg-[#0B0F15]">
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cost-name" className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold">
                  Custom Cost Name {billCategory === "OTHER" ? "" : <span className="normal-case tracking-normal text-gray-600">(optional)</span>}
                </label>
                <input
                  id="cost-name"
                  type="text"
                  placeholder={billCategory === "OTHER" ? "e.g. Permit fee" : "e.g. Lobby banner printing"}
                  value={billCostName}
                  onChange={(e) => setBillCostName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[11px] text-gray-600 mt-1.5">
                  {billCategory === "OTHER" ? "A name is required for custom costs." : `Leave blank to use “${getProjectCostCategoryLabel(billCategory)}”.`}
                </p>
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
                    onChange={(event) => {
                      setBillAmount(event.target.value);
                      setBillFormError("");
                    }}
                    onBlur={() => {
                      const normalizedAmount = normalizeProjectCostAmountInput(billAmount);
                      if (normalizedAmount) setBillAmount(normalizedAmount);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-600 mt-1.5">Whole dollars are accepted and shown with two decimals.</p>
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

            {billFormError && <p className="text-xs text-red-400 mt-4" role="alert">{billFormError}</p>}
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={closeBillModal}
                disabled={isSavingBill}
                className="px-4 py-2 border border-white/10 rounded text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveBill()}
                disabled={isSavingBill || (billCategory === "OTHER" && !billCostName.trim()) || parseProjectCostAmount(billAmount) === null}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-bold transition flex items-center gap-1.5"
              >
                {isSavingBill ? <i className="ph ph-spinner animate-spin"></i> : null}
                {editingBillId ? "Save Changes" : "Add Cost"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
