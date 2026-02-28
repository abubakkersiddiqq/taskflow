import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { taskAPI, projectAPI } from "../api/axios";
import TaskModal from "../components/TaskModal";
import Settings from "./Settings";
import toast from "react-hot-toast";

const STATUS_COLORS = { done: "#22c55e", "in-progress": "#f59e0b", todo: "#6366f1" };
const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#64748b" };

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [appName, setAppName] = useState(() => localStorage.getItem("appName") || "TaskFlow");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("All");
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => { document.title = appName; }, [appName]);
  useEffect(() => { fetchTasks(); fetchProjects(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskAPI.getAll();
      setTasks(res.data);
    } catch { toast.error("Failed to load tasks"); }
    finally { setLoading(false); }
  };

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
    } catch { console.error("Failed to load projects"); }
  };

  const handleAppNameChange = (name) => {
    setAppName(name);
    localStorage.setItem("appName", name);
  };

  const handleSave = async (form) => {
    try {
      if (editTask) {
        const res = await taskAPI.update(editTask._id, form);
        setTasks((prev) => prev.map((t) => t._id === editTask._id ? res.data : t));
        toast.success("Task updated!");
      } else {
        const res = await taskAPI.create(form);
        setTasks((prev) => [res.data, ...prev]);
        toast.success("Task created!");
      }
      setShowModal(false);
      setEditTask(null);
    } catch { toast.error("Something went wrong"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success("Task deleted");
    } catch { toast.error("Failed to delete task"); }
  };

  const handleCycleStatus = async (task) => {
    const cycle = { todo: "in-progress", "in-progress": "done", done: "todo" };
    try {
      const res = await taskAPI.update(task._id, { status: cycle[task.status] });
      setTasks((prev) => prev.map((t) => t._id === task._id ? res.data : t));
    } catch { toast.error("Failed to update status"); }
  };

  const openCreate = () => { setEditTask(null); setShowModal(true); };
  const openEdit = (task) => { setEditTask(task); setShowModal(true); };

  const projectNames = ["All", ...projects.map((p) => p.name)];

  const filtered = tasks.filter((t) => {
    const statusMatch = filterStatus === "all" || t.status === filterStatus;
    const projectMatch = filterProject === "All" || t.project === filterProject;
    return statusMatch && projectMatch;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    todo: tasks.filter((t) => t.status === "todo").length,
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>⚡ {appName}</div>

        <nav style={{ flex: 1 }}>
          <div style={styles.navSection}>MENU</div>
          {[
            { id: "dashboard", icon: "▦", label: "Dashboard" },
            { id: "tasks", icon: "✓", label: "My Tasks" },
            { id: "settings", icon: "⚙", label: "Settings" },
          ].map((item) => (
            <div key={item.id}
              style={{ ...styles.navItem, ...(activePage === item.id ? styles.navActive : {}) }}
              onClick={() => { setActivePage(item.id); setFilterProject("All"); fetchProjects(); }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}

          {projects.length > 0 && (
            <>
              <div style={styles.navSection}>PROJECTS</div>
              {projects.map((p) => (
                <div key={p._id}
                  style={{ ...styles.navItem, ...(filterProject === p.name && activePage === "tasks" ? styles.navActive : {}) }}
                  onClick={() => { setFilterProject(p.name); setActivePage("tasks"); }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, display: "inline-block", background: p.color, flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                </div>
              ))}
            </>
          )}
        </nav>

        <div style={styles.userBox}>
          <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
          </div>
          <button style={styles.logoutBtn} onClick={logout} title="Logout">⏻</button>
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>

        {/* DASHBOARD PAGE */}
        {activePage === "dashboard" && (
          <>
            <div style={styles.topBar}>
              <div>
                <h1 style={styles.pageTitle}>Good day, {user?.name?.split(" ")[0]} 👋</h1>
                <p style={styles.pageSub}>Here's your task overview</p>
              </div>
              <button style={styles.newBtn} onClick={openCreate}>+ New Task</button>
            </div>

            <div style={styles.statsGrid}>
              {[
                { label: "Total", value: stats.total, icon: "📋", color: "#6366f1" },
                { label: "Completed", value: stats.done, icon: "✅", color: "#22c55e" },
                { label: "In Progress", value: stats.inProgress, icon: "⚡", color: "#f59e0b" },
                { label: "To Do", value: stats.todo, icon: "📌", color: "#1d4ed8" },
              ].map((s) => (
                <div key={s.label} style={styles.statCard}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{s.value}</div>
                    </div>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${stats.total ? (s.value / stats.total) * 100 : 0}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "#e2e8f0" }}>Recent Tasks</h2>
              <button style={styles.viewAllBtn} onClick={() => setActivePage("tasks")}>View all →</button>
            </div>
            {loading ? <Spinner /> : tasks.slice(0, 5).map((task) => (
              <TaskRow key={task._id} task={task} onEdit={openEdit} onDelete={handleDelete} onCycle={handleCycleStatus} projects={projects} />
            ))}
            {!loading && tasks.length === 0 && <Empty onCreate={openCreate} />}
          </>
        )}

        {/* TASKS PAGE */}
        {activePage === "tasks" && (
          <>
            <div style={styles.topBar}>
              <h1 style={styles.pageTitle}>My Tasks</h1>
              <button style={styles.newBtn} onClick={openCreate}>+ New Task</button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {projectNames.map((p) => (
                <button key={p} style={{ ...styles.pill, ...(filterProject === p ? styles.pillActive : {}) }}
                  onClick={() => setFilterProject(p)}>{p}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["all", "todo", "in-progress", "done"].map((s) => (
                <button key={s} style={{ ...styles.filterBtn, ...(filterStatus === s ? styles.filterActive : {}) }}
                  onClick={() => setFilterStatus(s)}>
                  {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 13, color: "#475569", alignSelf: "center" }}>{filtered.length} tasks</span>
            </div>

            {loading ? <Spinner /> : filtered.map((task) => (
              <TaskRow key={task._id} task={task} onEdit={openEdit} onDelete={handleDelete} onCycle={handleCycleStatus} projects={projects} />
            ))}
            {!loading && filtered.length === 0 && <Empty onCreate={openCreate} />}
          </>
        )}

        {/* SETTINGS PAGE */}
        {activePage === "settings" && (
          <Settings
            appName={appName}
            onAppNameChange={handleAppNameChange}
            onProjectsChange={fetchProjects}
          />
        )}
      </div>

      {showModal && (
        <TaskModal
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
          editTask={editTask}
          projects={projects}
        />
      )}
    </div>
  );
};

const TaskRow = ({ task, onEdit, onDelete, onCycle, projects }) => {
  const projColor = projects.find((p) => p.name === task.project)?.color || "#475569";
  return (
    <div style={styles.taskRow}>
      <div style={{ ...styles.statusDot, background: STATUS_COLORS[task.status], cursor: "pointer" }}
        onClick={() => onCycle(task)} title="Click to cycle status" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: task.status === "done" ? "#475569" : "#e2e8f0", textDecoration: task.status === "done" ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.title}
        </div>
        {task.description && <div style={{ fontSize: 12, color: "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.description}</div>}
      </div>
      {task.project && (
        <span style={{ ...styles.badge, background: projColor + "20", color: projColor }}>{task.project}</span>
      )}
      <span style={{ ...styles.badge, background: STATUS_COLORS[task.status] + "20", color: STATUS_COLORS[task.status] }}>{task.status}</span>
      <span style={{ ...styles.badge, background: PRIORITY_COLORS[task.priority] + "20", color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
      <button style={styles.iconBtn} onClick={() => onEdit(task)} title="Edit">✎</button>
      <button style={{ ...styles.iconBtn, color: "#ef444450" }}
        onMouseEnter={(e) => e.target.style.color = "#ef4444"}
        onMouseLeave={(e) => e.target.style.color = "#ef444450"}
        onClick={() => onDelete(task._id)} title="Delete">✕</button>
    </div>
  );
};

const Spinner = () => (
  <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>Loading...</div>
);

const Empty = ({ onCreate }) => (
  <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
    No tasks found.{" "}
    <span style={{ color: "#1d4ed8", cursor: "pointer" }} onClick={onCreate}>Create one?</span>
  </div>
);

const styles = {
  layout: { display: "flex", height: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0b0f1a", color: "#e2e8f0", overflow: "hidden" },
  sidebar: { width: 230, background: "#0d1117", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "24px 14px", flexShrink: 0, overflowY: "auto" },
  logo: { fontFamily: "monospace", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 28, paddingLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  navSection: { fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "1.5px", margin: "18px 0 8px 8px" },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#94a3b8" },
  navActive: { background: "#1d4ed8", color: "#fff" },
  userBox: { borderTop: "1px solid #1e293b", paddingTop: 16, display: "flex", alignItems: "center", gap: 10, marginTop: 8 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 },
  logoutBtn: { background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, padding: 4 },
  main: { flex: 1, overflow: "auto", padding: "32px 36px" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 },
  pageSub: { fontSize: 14, color: "#64748b" },
  newBtn: { padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  statsGrid: { display: "flex", gap: 14, marginBottom: 32, flexWrap: "wrap" },
  statCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "18px 20px", flex: "1 1 160px" },
  progressBar: { height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden", marginTop: 14 },
  progressFill: { height: "100%", borderRadius: 3, transition: "width 0.5s ease" },
  viewAllBtn: { background: "transparent", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  taskRow: { display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "#111827", border: "1px solid #1e293b", borderRadius: 10, marginBottom: 8, flexWrap: "wrap" },
  statusDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", padding: "5px 7px", borderRadius: 6, color: "#475569", fontSize: 15 },
  pill: { padding: "5px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: "1px solid #1e293b", background: "transparent", color: "#64748b", fontFamily: "inherit" },
  pillActive: { background: "#1d4ed8", borderColor: "#1d4ed8", color: "#fff" },
  filterBtn: { padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "1px solid #1e293b", background: "transparent", color: "#64748b", fontFamily: "inherit" },
  filterActive: { background: "#1e293b", color: "#e2e8f0", borderColor: "#334155" },
};

export default Dashboard;
