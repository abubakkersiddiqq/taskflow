import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { taskAPI, projectAPI } from "../api/axios";
import TaskModal from "../components/TaskModal";
import Settings from "./Settings";
import toast from "react-hot-toast";

const STATUS_COLORS = { done: "#22c55e", "in-progress": "#f59e0b", todo: "#6366f1" };
const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#64748b" };

// Hook to detect mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

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
  const [showProjectDrawer, setShowProjectDrawer] = useState(false);
  const isMobile = useIsMobile();

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

  // Navigate and close drawer
  const navigate = (page) => {
    setActivePage(page);
    setFilterProject("All");
    fetchProjects();
    setShowProjectDrawer(false);
  };

  // Navigate to tasks filtered by project
  const goToProject = (projectName) => {
    setFilterProject(projectName);
    setActivePage("tasks");
    setShowProjectDrawer(false);
  };

  return (
    <div style={S.root}>
      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile && (
        <div style={S.sidebar}>
          <div style={S.logo}>⚡ {appName}</div>
          <nav style={{ flex: 1 }}>
            <div style={S.navSection}>MENU</div>
            {[
              { id: "dashboard", icon: "▦", label: "Dashboard" },
              { id: "tasks", icon: "✓", label: "My Tasks" },
              { id: "settings", icon: "⚙", label: "Settings" },
            ].map((item) => (
              <div key={item.id}
                style={{ ...S.navItem, ...(activePage === item.id ? S.navActive : {}) }}
                onClick={() => navigate(item.id)}>
                <span>{item.icon}</span> {item.label}
              </div>
            ))}

            {projects.length > 0 && (
              <>
                <div style={S.navSection}>PROJECTS</div>
                {projects.map((p) => (
                  <div key={p._id}
                    style={{ ...S.navItem, ...(filterProject === p.name && activePage === "tasks" ? S.navActive : {}) }}
                    onClick={() => goToProject(p.name)}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, display: "inline-block", background: p.color, flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  </div>
                ))}
              </>
            )}
          </nav>

          <div style={S.userBox}>
            <div style={S.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
            </div>
            <button style={S.logoutBtn} onClick={logout} title="Logout">⏻</button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ ...S.main, paddingBottom: isMobile ? 80 : 32 }}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={S.mobileTopBar}>
            <span style={S.mobileLogo}>⚡ {appName}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={S.mobileAddBtn} onClick={openCreate}>+ Task</button>
              <button style={S.logoutBtn} onClick={logout} title="Logout">⏻</button>
            </div>
          </div>
        )}

        {/* ── DASHBOARD PAGE ── */}
        {activePage === "dashboard" && (
          <>
            {!isMobile && (
              <div style={S.topBar}>
                <div>
                  <h1 style={S.pageTitle}>Good day, {user?.name?.split(" ")[0]} 👋</h1>
                  <p style={S.pageSub}>Here's your task overview</p>
                </div>
                <button style={S.newBtn} onClick={openCreate}>+ New Task</button>
              </div>
            )}
            {isMobile && (
              <div style={{ marginBottom: 16 }}>
                <h1 style={{ ...S.pageTitle, fontSize: 20 }}>Good day, {user?.name?.split(" ")[0]} 👋</h1>
                <p style={S.pageSub}>Here's your task overview</p>
              </div>
            )}

            {/* Stats */}
            <div style={S.statsGrid}>
              {[
                { label: "Total", value: stats.total, icon: "📋", color: "#6366f1" },
                { label: "Done", value: stats.done, icon: "✅", color: "#22c55e" },
                { label: "Active", value: stats.inProgress, icon: "⚡", color: "#f59e0b" },
                { label: "To Do", value: stats.todo, icon: "📌", color: "#1d4ed8" },
              ].map((s) => (
                <div key={s.label} style={S.statCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{s.value}</div>
                    </div>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                  </div>
                  <div style={S.progressBar}>
                    <div style={{ ...S.progressFill, width: `${stats.total ? (s.value / stats.total) * 100 : 0}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent tasks */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>Recent Tasks</h2>
              <button style={S.viewAllBtn} onClick={() => navigate("tasks")}>View all →</button>
            </div>
            {loading ? <Spinner /> : tasks.slice(0, isMobile ? 3 : 5).map((task) => (
              <TaskRow key={task._id} task={task} onEdit={openEdit} onDelete={handleDelete} onCycle={handleCycleStatus} projects={projects} isMobile={isMobile} />
            ))}
            {!loading && tasks.length === 0 && <Empty onCreate={openCreate} />}
          </>
        )}

        {/* ── TASKS PAGE ── */}
        {activePage === "tasks" && (
          <>
            {!isMobile && (
              <div style={S.topBar}>
                <h1 style={S.pageTitle}>My Tasks</h1>
                <button style={S.newBtn} onClick={openCreate}>+ New Task</button>
              </div>
            )}
            {isMobile && <h1 style={{ ...S.pageTitle, fontSize: 20, marginBottom: 14 }}>My Tasks</h1>}

            {/* Project filter pills — scroll horizontally on mobile */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 10, scrollbarWidth: "none" }}>
              {projectNames.map((p) => (
                <button key={p} style={{ ...S.pill, ...(filterProject === p ? S.pillActive : {}), flexShrink: 0 }}
                  onClick={() => setFilterProject(p)}>{p}</button>
              ))}
            </div>

            {/* Status filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
              {["all", "todo", "in-progress", "done"].map((s) => (
                <button key={s} style={{ ...S.filterBtn, ...(filterStatus === s ? S.filterActive : {}), flexShrink: 0 }}
                  onClick={() => setFilterStatus(s)}>
                  {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#475569", alignSelf: "center", flexShrink: 0 }}>{filtered.length} tasks</span>
            </div>

            {loading ? <Spinner /> : filtered.map((task) => (
              <TaskRow key={task._id} task={task} onEdit={openEdit} onDelete={handleDelete} onCycle={handleCycleStatus} projects={projects} isMobile={isMobile} />
            ))}
            {!loading && filtered.length === 0 && <Empty onCreate={openCreate} />}
          </>
        )}

        {/* ── PROJECTS PAGE (mobile only) ── */}
        {activePage === "projects" && isMobile && (
          <>
            <h1 style={{ ...S.pageTitle, fontSize: 20, marginBottom: 16 }}>Projects</h1>
            {projects.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
                No projects yet.{" "}
                <span style={{ color: "#1d4ed8", cursor: "pointer" }} onClick={() => navigate("settings")}>
                  Create one in Settings
                </span>
              </div>
            )}
            {projects.map((p) => {
              const projectTasks = tasks.filter((t) => t.project === p.name);
              const done = projectTasks.filter((t) => t.status === "done").length;
              return (
                <div key={p._id} style={{ ...S.taskRow, cursor: "pointer" }} onClick={() => goToProject(p.name)}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{projectTasks.length} tasks · {done} done</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#1d4ed8" }}>View →</div>
                </div>
              );
            })}
          </>
        )}

        {/* ── SETTINGS PAGE ── */}
        {activePage === "settings" && (
          <Settings
            appName={appName}
            onAppNameChange={handleAppNameChange}
            onProjectsChange={fetchProjects}
          />
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <div style={S.bottomNav}>
          {[
            { id: "dashboard", icon: "▦", label: "Home" },
            { id: "tasks", icon: "✓", label: "Tasks" },
            { id: "projects", icon: "◈", label: "Projects" },
            { id: "settings", icon: "⚙", label: "Settings" },
          ].map((item) => (
            <button key={item.id} style={{ ...S.bottomNavItem, ...(activePage === item.id ? S.bottomNavActive : {}) }}
              onClick={() => navigate(item.id)}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 10, marginTop: 3 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

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

const TaskRow = ({ task, onEdit, onDelete, onCycle, projects, isMobile }) => {
  const projColor = projects.find((p) => p.name === task.project)?.color || "#475569";
  return (
    <div style={S.taskRow}>
      <div style={{ ...S.statusDot, background: STATUS_COLORS[task.status], cursor: "pointer" }}
        onClick={() => onCycle(task)} title="Tap to cycle status" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: task.status === "done" ? "#475569" : "#e2e8f0", textDecoration: task.status === "done" ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.title}
        </div>
        {!isMobile && task.description && (
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.description}</div>
        )}
        {isMobile && (
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {task.project && <span style={{ ...S.badge, background: projColor + "20", color: projColor, fontSize: 10 }}>{task.project}</span>}
            <span style={{ ...S.badge, background: STATUS_COLORS[task.status] + "20", color: STATUS_COLORS[task.status], fontSize: 10 }}>{task.status}</span>
          </div>
        )}
      </div>
      {!isMobile && task.project && (
        <span style={{ ...S.badge, background: projColor + "20", color: projColor }}>{task.project}</span>
      )}
      {!isMobile && (
        <>
          <span style={{ ...S.badge, background: STATUS_COLORS[task.status] + "20", color: STATUS_COLORS[task.status] }}>{task.status}</span>
          <span style={{ ...S.badge, background: PRIORITY_COLORS[task.priority] + "20", color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
        </>
      )}
      <button style={S.iconBtn} onClick={() => onEdit(task)}>✎</button>
      <button style={{ ...S.iconBtn, color: "#ef444450" }}
        onMouseEnter={(e) => e.target.style.color = "#ef4444"}
        onMouseLeave={(e) => e.target.style.color = "#ef444450"}
        onClick={() => onDelete(task._id)}>✕</button>
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

const S = {
  root: { display: "flex", height: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0b0f1a", color: "#e2e8f0", overflow: "hidden" },
  // Desktop sidebar
  sidebar: { width: 230, background: "#0d1117", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "24px 14px", flexShrink: 0, overflowY: "auto" },
  logo: { fontFamily: "monospace", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 28, paddingLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  navSection: { fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "1.5px", margin: "18px 0 8px 8px" },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#94a3b8" },
  navActive: { background: "#1d4ed8", color: "#fff" },
  userBox: { borderTop: "1px solid #1e293b", paddingTop: 16, display: "flex", alignItems: "center", gap: 10, marginTop: 8 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 },
  logoutBtn: { background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, padding: 4 },
  // Main
  main: { flex: 1, overflow: "auto", padding: "32px 36px" },
  // Mobile top bar
  mobileTopBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "0 0 16px 0", borderBottom: "1px solid #1e293b" },
  mobileLogo: { fontFamily: "monospace", fontWeight: 700, fontSize: 18, color: "#fff" },
  mobileAddBtn: { padding: "7px 14px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
  // Content
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 },
  pageSub: { fontSize: 14, color: "#64748b" },
  newBtn: { padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  statsGrid: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  statCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px", flex: "1 1 120px", minWidth: 0 },
  progressBar: { height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden", marginTop: 12 },
  progressFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },
  viewAllBtn: { background: "transparent", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12 },
  taskRow: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#111827", border: "1px solid #1e293b", borderRadius: 10, marginBottom: 8 },
  statusDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  badge: { padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", padding: "5px 6px", borderRadius: 6, color: "#475569", fontSize: 15, flexShrink: 0 },
  pill: { padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "1px solid #1e293b", background: "transparent", color: "#64748b", fontFamily: "inherit", whiteSpace: "nowrap" },
  pillActive: { background: "#1d4ed8", borderColor: "#1d4ed8", color: "#fff" },
  filterBtn: { padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "1px solid #1e293b", background: "transparent", color: "#64748b", fontFamily: "inherit", whiteSpace: "nowrap" },
  filterActive: { background: "#1e293b", color: "#e2e8f0", borderColor: "#334155" },
  // Mobile bottom nav
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: "#0d1117", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" },
  bottomNavItem: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, height: "100%", background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontFamily: "inherit", padding: "8px 0" },
  bottomNavActive: { color: "#1d4ed8" },
};

export default Dashboard;
