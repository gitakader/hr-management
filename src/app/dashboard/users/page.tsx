"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", mobileNumber: "", password: "", role: "manager" });

  const isAdmin = user?.role === "admin";

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.success) setUsers(d.data);
    setLoading(false);
  };

  useEffect(() => { if (token && isAdmin) loadUsers(); }, [token, isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success(`${form.role} account created!`);
      setShowForm(false);
      setForm({ fullName: "", mobileNumber: "", password: "", role: "manager" });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (userId: number, isActive: boolean) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive }),
    });
    const d = await res.json();
    if (d.success) {
      toast.success(`User ${isActive ? "deactivated" : "activated"}`);
      loadUsers();
    }
  };

  if (!isAdmin) {
    return <div className="card"><p className="text-center text-gray-500">You don't have permission to manage users.</p></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Create Account"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Manager / Executive Account</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input className="input-field" value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mobile Number</label>
              <input className="input-field" value={form.mobileNumber} onChange={(e) => setForm({...form, mobileNumber: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select className="input-field" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                <option value="manager">Manager</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary">Create Account</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Mobile</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Applications</th>
                  <th className="text-left p-3">Joined</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3 font-medium">{u.fullName}</td>
                    <td className="p-3">{u.mobileNumber}</td>
                    <td className="p-3"><span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{u.role}</span></td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">{u._count?.applications || 0}</td>
                    <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(u.id, u.isActive)} className={`text-sm ${u.isActive ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
