"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface JobPost {
  id: number;
  title: string;
  companyName: string;
  designation: string;
  description: string;
  pdfNotice: string;
  applicationDeadline: string;
  createdAt: string;
  _count: { applications: number };
}

interface Application {
  id: number;
  applicationId: string;
  jobPostId: number;
  status: string;
  createdAt: string;
  jobPost: JobPost;
}

export default function ApplicantDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`/api/jobs?search=${search}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([jobsData, appsData]) => {
      if (jobsData.success) setJobs(jobsData.data);
      if (appsData.success) setApplications(appsData.data);
    }).finally(() => setLoading(false));
  }, [token, search]);

  const handleApply = async (jobPostId: number) => {
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobPostId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Application submitted!");
      // Refresh
      const appsRes = await fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      if (appsRes.success) setApplications(appsRes.data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      shortlisted: "bg-blue-100 text-blue-800",
      interview: "bg-purple-100 text-purple-800",
      selected: "bg-emerald-100 text-emerald-800",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100"}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">HR Management</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.fullName} <span className="text-xs capitalize">({user?.role})</span>
            </span>
            <button onClick={() => { logout(); }} className="btn-secondary text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Profile Reminder */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            Complete your profile to apply for jobs online
          </p>
          <div className="flex gap-2">
            <button onClick={() => router.push("/applicant/profile")} className="btn-primary text-sm">Complete Profile</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "jobs" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
          >
            Job Posts
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "applications" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
          >
            My Applications ({applications.length})
          </button>
        </div>

        {/* Search */}
        {activeTab === "jobs" && (
          <div className="mb-4">
            <input
              type="text"
              className="input-field max-w-md"
              placeholder="Search jobs by title, company, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : activeTab === "jobs" ? (
          <div className="grid gap-4">
            {jobs.map(job => (
              <div key={job.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{job.companyName} - {job.designation}</p>
                    <p className="text-xs text-gray-500 mt-1">Deadline: {job.applicationDeadline}</p>
                    {job.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{job.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    {job.pdfNotice && (
                      <a href={job.pdfNotice} target="_blank" className="btn-secondary text-sm">Download</a>
                    )}
                    <button onClick={() => handleApply(job.id)} className="btn-primary text-sm">
                      Apply Online
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">{job._count.applications} applicant(s)</div>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-center text-gray-500 py-8">No job posts available</p>}
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map(app => (
              <div key={app.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{app.jobPost?.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Application ID: {app.applicationId}</p>
                    <p className="text-xs text-gray-500">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={getStatusBadge(app.status)}>{app.status}</span>
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="text-center text-gray-500 py-8">No applications yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
