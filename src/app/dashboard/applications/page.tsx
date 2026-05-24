"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

type TabType = "pending" | "approved" | "rejected" | "shortlisted" | "interview" | "selected";

export default function ApplicationsPage() {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const tabs: TabType[] = ["pending", "approved", "rejected", "shortlisted", "interview", "selected"];

  const canManage = ["admin", "manager", "executive"].includes(user?.role || "");

  useEffect(() => {
    if (!token) return;
    loadApplications();
  }, [token, activeTab]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setApplications(d.data);
    } catch {}
    setLoading(false);
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success("Application updated!");
      loadApplications();
      setSelectedApp(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getTabCounts = () => {
    const counts: Record<string, number> = {};
    tabs.forEach(t => counts[t] = 0);
    applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  };

  const renderActions = (app: any) => {
    switch (app.status) {
      case "pending":
        return (
          <div className="flex gap-2">
            <button onClick={() => handleUpdate(app.id, { status: "approved", approvalDate: new Date().toISOString().split("T")[0] })} className="btn-success text-sm">Approve</button>
            <button onClick={() => showRejectDialog(app)} className="btn-danger text-sm">Reject</button>
          </div>
        );
      case "rejected":
        return (
          <div className="flex gap-2">
            <button onClick={() => handleUpdate(app.id, { status: "pending" })} className="btn-secondary text-sm">Move to Pending</button>
            <button onClick={() => handleUpdate(app.id, { status: "approved", approvalDate: new Date().toISOString().split("T")[0] })} className="btn-success text-sm">Approve</button>
          </div>
        );
      case "approved":
        return (
          <div className="flex gap-2">
            <span className="text-xs text-gray-500">Approved: {app.approvalDate}</span>
            <button onClick={() => handleUpdate(app.id, { status: "shortlisted", shortlistDate: new Date().toISOString().split("T")[0] })} className="btn-primary text-sm">Shortlist</button>
            <button onClick={() => showRejectDialog(app)} className="btn-danger text-sm">Reject</button>
          </div>
        );
      case "shortlisted":
        return (
          <div className="flex gap-2">
            <span className="text-xs text-gray-500">Shortlisted: {app.shortlistDate}</span>
            <button onClick={() => handleUpdate(app.id, { status: "interview", interviewDate: new Date().toISOString().split("T")[0] })} className="btn-primary text-sm">Send to Interview</button>
            <button onClick={() => showRejectDialog(app)} className="btn-danger text-sm">Reject</button>
          </div>
        );
      case "interview":
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button onClick={() => handleUpdate(app.id, { status: "selected" })} className="btn-success text-sm">Select</button>
              <button onClick={() => showRejectDialog(app)} className="btn-danger text-sm">Reject</button>
            </div>
            <div>
              <input
                type="date"
                className="input-field text-sm"
                defaultValue={app.interviewDate}
                onBlur={(e) => handleUpdate(app.id, { interviewDate: e.target.value })}
              />
            </div>
          </div>
        );
      case "selected":
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input className="input-field text-sm" placeholder="Employee ID" onBlur={(e) => app.employeeId = e.target.value} />
              <input type="date" className="input-field text-sm" placeholder="Joining Date" onBlur={(e) => app.joiningDate = e.target.value} />
            </div>
            <button
              onClick={() => handleUpdate(app.id, { status: "selected", employeeId: app.employeeId, joiningDate: app.joiningDate })}
              className="btn-success text-sm"
            >
              Save & Move to Files
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const showRejectDialog = (app: any) => {
    setRejectDialog(app);
    setRejectReason("");
  };

  const confirmReject = () => {
    if (rejectDialog) {
      handleUpdate(rejectDialog.id, { status: "rejected", rejectionReason: rejectReason });
      setRejectDialog(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Applications</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
          >
            {tab.replace("_", " ")} ({applications.filter(a => a.status === tab).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Application List */}
          <div className="lg:col-span-2 space-y-3">
            {applications.filter(a => a.status === activeTab).map(app => (
              <div
                key={app.id}
                className={`card cursor-pointer transition-all ${selectedApp?.id === app.id ? "ring-2 ring-blue-500" : "hover:shadow-md"}`}
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{app.user?.fullName}</p>
                    <p className="text-sm text-gray-500">ID: {app.applicationId}</p>
                    <p className="text-xs text-gray-500">{app.jobPost?.title} - {app.jobPost?.companyName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    app.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    app.status === "approved" ? "bg-green-100 text-green-800" :
                    app.status === "rejected" ? "bg-red-100 text-red-800" :
                    app.status === "shortlisted" ? "bg-blue-100 text-blue-800" :
                    app.status === "interview" ? "bg-purple-100 text-purple-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>{app.status}</span>
                </div>
                {app.comment && <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Note: {app.comment}</p>}
              </div>
            ))}
            {applications.filter(a => a.status === activeTab).length === 0 && (
              <p className="text-center text-gray-500 py-8">No {activeTab} applications</p>
            )}
          </div>

          {/* Right Preview Panel */}
          {selectedApp && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Application Details</h2>
                <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              {/* Applicant Info */}
              <div className="space-y-2 text-sm mb-4">
                <p><span className="font-medium">Name:</span> {selectedApp.user?.fullName}</p>
                <p><span className="font-medium">Mobile:</span> {selectedApp.user?.mobileNumber}</p>
                <p><span className="font-medium">Application ID:</span> {selectedApp.applicationId}</p>
                <p><span className="font-medium">Job:</span> {selectedApp.jobPost?.title}</p>
                <p><span className="font-medium">Company:</span> {selectedApp.jobPost?.companyName}</p>
                <p><span className="font-medium">Applied:</span> {new Date(selectedApp.createdAt).toLocaleDateString()}</p>
                {selectedApp.approvalDate && <p><span className="font-medium">Approval Date:</span> {selectedApp.approvalDate}</p>}
                {selectedApp.shortlistDate && <p><span className="font-medium">Shortlist Date:</span> {selectedApp.shortlistDate}</p>}
                {selectedApp.interviewDate && <p><span className="font-medium">Interview Date:</span> {selectedApp.interviewDate}</p>}
                {selectedApp.rejectionReason && <p><span className="font-medium text-red-600">Rejection Reason:</span> {selectedApp.rejectionReason}</p>}
              </div>

              {/* Comment Box for Approved */}
              {(selectedApp.status === "approved" || selectedApp.status === "shortlisted") && (
                <div className="mb-4">
                  <textarea
                    className="input-field text-sm"
                    placeholder="Add a comment..."
                    rows={2}
                    defaultValue={selectedApp.comment}
                    onBlur={(e) => handleUpdate(selectedApp.id, { comment: e.target.value })}
                  />
                </div>
              )}

              {/* Actions */}
              {canManage && renderActions(selectedApp)}

              {/* Folder contents */}
              {selectedApp.folders?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Documents</h3>
                  <div className="space-y-1">
                    {selectedApp.folders.map((f: any) => (
                      <div key={f.id} className="text-sm text-blue-600 hover:underline cursor-pointer">
                        📄 {f.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Rejection Reason</h3>
            <textarea
              className="input-field mb-4"
              rows={3}
              placeholder="Please provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectDialog(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmReject} className="btn-danger">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
