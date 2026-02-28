import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { projectAPI } from "../api/axios";
import toast from "react-hot-toast";

const COLORS = ["#1d4ed8","#7c3aed","#db2777","#ef4444","#f59e0b","#22c55e","#14b8a6","#64748b"];

const Settings = ({ appName, onAppNameChange }) => {
  const { user, updateProfile, loading } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", password: "" });
  const [appTitle, setAppTitle] = useState(appName);
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", color: "#1d4ed8" });
  const [editingProject, setEditingProject] = useState(null); // { id, name, color }
  const [tab, setTab] = useState("profile");

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
    } catch { toast.error("Failed to load projects"); }
  };

  const handleProfileSave = async () => {
    const data = {};
    if (profile.name !== user.name) data.name = profile.name;
    if (profile.email !== user.email) data.email = profile.email;
    if (profile.password) data.password = profile.password;
    if (!Object.keys(data).length) return toast("Nothing to update");

    const result = await updateProfile(data);
    if (result.success) toast.success("Profile updated!");
    else toast.error(result.message);
  };

  const handleAppNameSave = () => {
    if (!appTitle.trim()) return toast.error("App name cannot be empty");
    onAppNameChange(appTitle.trim());
    toast.success("App name updated!");
  };

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return toast.error("Project name required");
    try {
      const res = await projectAPI.create(newProject);
      setProjects((prev) => [...prev, res.data]);
      setNewProject({ name: "", color: "#1d4ed8" });
      toast.success("Project created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project");
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject.name.trim()) return toast.error("Project name required");
    try {
      const res = await projectAPI.update(editingProject._id, { name: editingProject.name, color: editingProject.color });
      setProjects((prev) => prev.map((p) => p._id === editingProject._id ? res.data : p));
      setEditingProject(null);
      toast.success("Project updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete this project? Tasks will move to General.")) return;
    try {
      await projectAPI.delete(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Project deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <h1 style={s.pageTitle}>Settings</h1>

      {/* Tabs */}
      <div style={s.tabs}>
        {["profile", "projects", "appearance"].map((t) => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Your Profile</h3>
          <div style={s.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div style={s.field}>
            <label style={s.label}>Full Name</label>
            <input style={s.input} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div style={s.field}>
            <label style={s.label}>New Password <span style={{ color: "#475569" }}>(leave blank to keep current)</span></label>
            <input style={s.input} type="password" placeholder="••••••••" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} />
          </div>
          <button style={s.btn} onClick={handleProfileSave} disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* Projects Tab */}
      {tab === "projects" && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Manage Projects</h3>
          <p style={s.hint}>Projects are categories for your tasks. You can create, rename, or delete them anytime.</p>

          {/* Add new */}
          <div style={s.addRow}>
            <input style={{ ...s.input, flex: 1 }} placeholder="New project name..." value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAddProject()} />
            <div style={s.colorPicker}>
              {COLORS.map((c) => (
                <div key={c} onClick={() => setNewProject({ ...newProject, color: c })}
                  style={{ ...s.colorDot, background: c, outline: newProject.color === c ? `2px solid #fff` : "none" }} />
              ))}
            </div>
            <button style={s.btn} onClick={handleAddProject}>Add</button>
          </div>

          {/* Project list */}
          <div style={{ marginTop: 16 }}>
            {projects.length === 0 && <p style={{ color: "#475569", fontSize: 14 }}>No projects yet. Add one above!</p>}
            {projects.map((p) => (
              <div key={p._id} style={s.projectRow}>
                {editingProject?._id === p._id ? (
                  <>
                    <input style={{ ...s.input, flex: 1 }} value={editingProject.name}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })} />
                    <div style={s.colorPicker}>
                      {COLORS.map((c) => (
                        <div key={c} onClick={() => setEditingProject({ ...editingProject, color: c })}
                          style={{ ...s.colorDot, background: c, outline: editingProject.color === c ? "2px solid #fff" : "none" }} />
                      ))}
                    </div>
                    <button style={s.btn} onClick={handleUpdateProject}>Save</button>
                    <button style={s.ghostBtn} onClick={() => setEditingProject(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <div style={{ ...s.colorDot, background: p.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, color: "#e2e8f0" }}>{p.name}</span>
                    <button style={s.ghostBtn} onClick={() => setEditingProject({ ...p })}>✎ Edit</button>
                    <button style={{ ...s.ghostBtn, color: "#ef4444", borderColor: "#ef444430" }}
                      onClick={() => handleDeleteProject(p._id)}>✕ Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {tab === "appearance" && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>App Appearance</h3>
          <div style={s.field}>
            <label style={s.label}>App Name</label>
            <p style={s.hint}>This changes the title shown in the sidebar and browser tab.</p>
            <input style={s.input} value={appTitle} onChange={(e) => setAppTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAppNameSave()} placeholder="My Task App" />
          </div>
          <button style={s.btn} onClick={handleAppNameSave}>Save App Name</button>
        </div>
      )}
    </div>
  );
};

const s = {
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 24 },
  tabs: { display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1e293b", paddingBottom: 0 },
  tab: { padding: "9px 20px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "inherit", marginBottom: -1 },
  tabActive: { color: "#e2e8f0", borderBottomColor: "#1d4ed8" },
  card: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 28, maxWidth: 560 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 20 },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 },
  hint: { fontSize: 13, color: "#475569", marginBottom: 14 },
  input: { width: "100%", padding: "10px 12px", background: "#0b0f1a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" },
  ghostBtn: { padding: "7px 14px", background: "transparent", border: "1px solid #1e293b", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  addRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  projectRow: { display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #1e293b", flexWrap: "wrap" },
  colorPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
  colorDot: { width: 18, height: 18, borderRadius: "50%", cursor: "pointer", flexShrink: 0 },
};

export default Settings;
