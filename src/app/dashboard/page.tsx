"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function DashboardHome() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, totalUsers: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/jobs", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/activity", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([jobs, apps, users, activity]) => {
      setStats({
        totalJobs: jobs.data?.length || 0,
        totalApplications: apps.data?.length || 0,
        totalUsers: users.data?.length || 0,
      });
      setRecentActivity(activity.data?.slice(0, 10) || []);
    }).catch(() => {});
  }, [token]);

  const statCards = [
    { label: "Total Jobs", value: stats.totalJobs, color: "bg-blue-500", href: "/dashboard/jobs" },
    { label: "Applications", value: stats.totalApplications, color: "bg-green-500", href: "/dashboard/applications" },
    { label: "Total Users", value: stats.totalUsers, color: "bg-purple-500", href: "/dashboard/users" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, i) => (
          <Link key={i} href={card.href} className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl font-bold`}>
                {card.value}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/jobs" className="btn-primary">Create Job Post</Link>
          <Link href="/dashboard/applications" className="btn-secondary">View Applications</Link>
          {user?.role === "admin" && (
            <Link href="/dashboard/users" className="btn-secondary">Manage Users</Link>
          )}
          <Link href="/dashboard/files" className="btn-secondary">File Management</Link>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-start gap-3 text-sm pb-2 border-b dark:border-gray-700 last:border-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">{activity.action}</p>
                <p className="text-gray-500 dark:text-gray-400">{activity.details}</p>
                <p className="text-xs text-gray-400">{new Date(activity.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
