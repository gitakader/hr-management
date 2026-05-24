"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/lib/auth-context";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ApplicantProfilePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: "", fathersName: "", mothersName: "",
    presentVillage: "", presentPostOffice: "", presentThana: "", presentDistrict: "",
    permanentVillage: "", permanentPostOffice: "", permanentThana: "", permanentDistrict: "",
    dateOfBirth: "", identityNumber: "", identityType: "nid",
    gender: "", nationality: "Bangladeshi", religion: "", maritalStatus: "",
  });

  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);

  const eduOptions = ["Class Eight", "SSC/Equivalent", "HSC/Equivalent", "Degree", "Masters"];

  useEffect(() => {
    if (!token) return;
    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.data) {
          setForm(prev => ({ ...prev, ...d.data }));
          setEducation(d.data.education || []);
          setExperience(d.data.experience || []);
          setTraining(d.data.training || []);
        }
      }).catch(() => {});
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addEducation = async () => {
    try {
      const res = await fetch("/api/profile/education", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ examName: "SSC/Equivalent", groupDept: "", gpaClass: "", passingYear: "", board: "", document: "" }),
      });
      const d = await res.json();
      if (d.success) setEducation([...education, d.data]);
    } catch {}
  };

  const addExperience = async () => {
    try {
      const res = await fetch("/api/profile/experience", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ designation: "", department: "", officeName: "", startDate: "", endDate: "" }),
      });
      const d = await res.json();
      if (d.success) setExperience([...experience, d.data]);
    } catch {}
  };

  const addTraining = async () => {
    try {
      const res = await fetch("/api/profile/training", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trainingName: "", instituteName: "", additionalInfo: "" }),
      });
      const d = await res.json();
      if (d.success) setTraining([...training, d.data]);
    } catch {}
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const updateTraining = (index: number, field: string, value: string) => {
    const updated = [...training];
    updated[index] = { ...updated[index], [field]: value };
    setTraining(updated);
  };

  const removeEducation = async (index: number) => {
    const item = education[index];
    if (item.id) {
      await fetch("/api/profile/education", {
        method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id }),
      });
    }
    setEducation(education.filter((_, i) => i !== index));
  };

  const removeExperience = async (index: number) => {
    const item = experience[index];
    if (item.id) {
      await fetch("/api/profile/experience", {
        method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id }),
      });
    }
    setExperience(experience.filter((_, i) => i !== index));
  };

  const removeTraining = async (index: number) => {
    const item = training[index];
    if (item.id) {
      await fetch("/api/profile/training", {
        method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id }),
      });
    }
    setTraining(training.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    await handleSave();
    router.push("/applicant/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Fill in your details to apply for jobs</p>
          </div>
          <div className="flex gap-3">
            <Link href="/applicant/dashboard" className="btn-secondary">Later</Link>
            <button onClick={handleComplete} className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Complete"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input name="fullName" className="input-field" value={form.fullName} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Father&apos;s Name</label>
                <input name="fathersName" className="input-field" value={form.fathersName} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mother&apos;s Name</label>
                <input name="mothersName" className="input-field" value={form.mothersName} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Present Address */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Present Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Village</label><input name="presentVillage" className="input-field" value={form.presentVillage} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Post Office</label><input name="presentPostOffice" className="input-field" value={form.presentPostOffice} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Thana/Upazila</label><input name="presentThana" className="input-field" value={form.presentThana} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">District</label><input name="presentDistrict" className="input-field" value={form.presentDistrict} onChange={handleChange} /></div>
            </div>
          </div>

          {/* Permanent Address */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Permanent Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Village</label><input name="permanentVillage" className="input-field" value={form.permanentVillage} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Post Office</label><input name="permanentPostOffice" className="input-field" value={form.permanentPostOffice} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Thana/Upazila</label><input name="permanentThana" className="input-field" value={form.permanentThana} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">District</label><input name="permanentDistrict" className="input-field" value={form.permanentDistrict} onChange={handleChange} /></div>
            </div>
          </div>

          {/* Identity Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Identity Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" name="dateOfBirth" className="input-field" value={form.dateOfBirth} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Identity Type</label>
                <select name="identityType" className="input-field" value={form.identityType} onChange={handleChange}>
                  <option value="nid">National ID</option>
                  <option value="birth">Birth Certificate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NID / Birth Certificate Number</label>
                <input name="identityNumber" className="input-field" value={form.identityNumber} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Other Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Other Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select name="gender" className="input-field" value={form.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <input name="nationality" className="input-field" value={form.nationality} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Religion</label>
                <select name="religion" className="input-field" value={form.religion} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Islam">Islam</option>
                  <option value="Hinduism">Hinduism</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Buddhism">Buddhism</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marital Status</label>
                <select name="maritalStatus" className="input-field" value={form.maritalStatus} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Educational Qualification */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Educational Qualification</h2>
              <button onClick={addEducation} className="btn-primary text-sm">+ Add Row</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-2">Exam Name</th>
                    <th className="text-left p-2">Group/Department</th>
                    <th className="text-left p-2">GPA/Class</th>
                    <th className="text-left p-2">Passing Year</th>
                    <th className="text-left p-2">Board/University</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {education.map((edu, i) => (
                    <tr key={i} className="border-b dark:border-gray-700">
                      <td className="p-2">
                        <select className="input-field text-sm" value={edu.examName} onChange={(e) => updateEducation(i, "examName", e.target.value)}>
                          {eduOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="p-2"><input className="input-field text-sm" value={edu.groupDept} onChange={(e) => updateEducation(i, "groupDept", e.target.value)} /></td>
                      <td className="p-2"><input className="input-field text-sm" value={edu.gpaClass} onChange={(e) => updateEducation(i, "gpaClass", e.target.value)} /></td>
                      <td className="p-2"><input className="input-field text-sm" value={edu.passingYear} onChange={(e) => updateEducation(i, "passingYear", e.target.value)} /></td>
                      <td className="p-2"><input className="input-field text-sm" value={edu.board} onChange={(e) => updateEducation(i, "board", e.target.value)} /></td>
                      <td className="p-2"><button onClick={() => removeEducation(i)} className="text-red-500 hover:text-red-700">✕</button></td>
                    </tr>
                  ))}
                  {education.length === 0 && (
                    <tr><td colSpan={6} className="text-center p-4 text-gray-500">No education added yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Experience */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Experience</h2>
              <button onClick={addExperience} className="btn-primary text-sm">+ Add Row</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-2">Designation</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Office Name</th>
                    <th className="text-left p-2">Start Date</th>
                    <th className="text-left p-2">End Date</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {experience.map((exp, i) => (
                    <tr key={i} className="border-b dark:border-gray-700">
                      <td className="p-2"><input className="input-field text-sm" value={exp.designation} onChange={(e) => updateExperience(i, "designation", e.target.value)} /></td>
                      <td className="p-2"><input className="input-field text-sm" value={exp.department} onChange={(e) => updateExperience(i, "department", e.target.value)} /></td>
                      <td className="p-2"><input className="input-field text-sm" value={exp.officeName} onChange={(e) => updateExperience(i, "officeName", e.target.value)} /></td>
                      <td className="p-2"><input type="date" className="input-field text-sm" value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} /></td>
                      <td className="p-2"><input type="date" className="input-field text-sm" value={exp.endDate} onChange={(e) => updateExperience(i, "endDate", e.target.value)} /></td>
                      <td className="p-2"><button onClick={() => removeExperience(i)} className="text-red-500 hover:text-red-700">✕</button></td>
                    </tr>
                  ))}
                  {experience.length === 0 && (
                    <tr><td colSpan={6} className="text-center p-4 text-gray-500">No experience added yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Training */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Training</h2>
              <button onClick={addTraining} className="btn-primary text-sm">+ Add Row</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-2">Training Name</th>
                    <th className="text-left p-2">Institute Name</th>
                    <th className="text-left p-2">Additional Info</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {training.map((tr, i) => (
                    <tr key={i} className="border-b dark:border-gray-700">
                      <td className="p-2"><input className="input-field text-sm" value={tr.trainingName} onChange={(e) => updateTraining(i, "trainingName", e.target.value)} /></td>
                      <td className="p-2"><input className="input-field text-sm" value={tr.instituteName} onChange={(e) => updateTraining(i, "instituteName", e.target.value)} /></td>
                      <td className="p-2"><input className="input-field text-sm" value={tr.additionalInfo} onChange={(e) => updateTraining(i, "additionalInfo", e.target.value)} /></td>
                      <td className="p-2"><button onClick={() => removeTraining(i)} className="text-red-500 hover:text-red-700">✕</button></td>
                    </tr>
                  ))}
                  {training.length === 0 && (
                    <tr><td colSpan={4} className="text-center p-4 text-gray-500">No training added yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Link href="/applicant/dashboard" className="btn-secondary">Later</Link>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
