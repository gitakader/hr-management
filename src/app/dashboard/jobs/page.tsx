"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

export default function JobsPage() {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", companyName: "", designation: "", description: "", applicationDeadline: "", pdfNotice: "" });

  const canManage = ["admin", "manager"].includes(user?.role || "");

  const loadJobs = async () => {
    const res = await fetch("/api/jobs", { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.success) setJobs(d.data);
    setLoading(false);
  };

  useEffect(() => { if (token) loadJobs(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(editing ? `/api/jobs/${editing.id}` : "/api/jobs", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(editing ? "Job updated!" : "Job created!");
      setShowForm(false);
      setEditing(null);
      setForm({ title: "", companyName: "", designation: "", description: "", applicationDeadline: "", pdfNotice: "" });
      loadJobs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (job: any) => {
    setForm({ title: job.title, companyName: job.companyName, designation: job.designation, description: job.description, applicationDeadline: job.applicationDeadline, pdfNotice: job.pdfNotice });
    setEditing(job);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job post?")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success("Job deleted");
      loadJobs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Notices</h1>
        {canManage && (
          <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: "", companyName: "", designation: "", description: "", applicationDeadline: "", pdfNotice: "" }); }}
            className="btn-primary">{showForm ? "Cancel" : "+ New Job Post"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Job Post" : "Create Job Post"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input className="input-field" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input className="input-field" value={form.companyName} onChange={(e) => setForm({...form, companyName: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input className="input-field" value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Application Deadline</label>
              <input type="date" className="input-field" value={form.applicationDeadline} onChange={(e) => setForm({...form, applicationDeadline: e.target.value})} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editing ? "Update" : "Publish"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => (
            <div key={job.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{job.companyName} - {job.designation}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Deadline: {job.applicationDeadline} | {job._count?.applications || 0} applicants
                  </p>
                  {job.description && <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{job.description}</p>}
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(job)} className="btn-secondary text-sm">Edit</button>
                    <button onClick={() => handleDelete(job.id)} className="btn-danger text-sm">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-center text-gray-500 py-8">No job posts yet</p>}
        </div>
      )}
    </div>
  );
}
