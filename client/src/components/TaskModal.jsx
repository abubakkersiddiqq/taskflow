import { useState, useEffect } from "react";

const TaskModal = ({ onClose, onSave, editTask, projects = [] }) => {
  const [form, setForm] = useState({
    title: "", description: "", status: "todo",
    priority: "medium", project: "", due: "",
  });

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title || "",
        description: editTask.description || "",
        status: editTask.status || "todo",
        priority: editTask.priority || "medium",
        project: editTask.project || "",
        due: editTask.due ? editTask.due.split("T")[0] : "",
      });
    } else {
      setForm((f) => ({ ...f, project: projects[0]?.name || "" }));
    }
  }, [editTask, projects]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{editTask ? "Edit Task" : "New Task"}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input style={styles.input} placeholder="Task title..." value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea style={{ ...styles.input, resize: "vertical", minHeight: 72 }}
              placeholder="Add details..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select style={styles.input} value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Priority</label>
              <select style={styles.input} value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Project</label>
              <select style={styles.input} value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}>
                <option value="">-- No Project --</option>
                {projects.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Due Date</label>
              <input type="date" style={styles.input} value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })} />
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.saveBtn}>
              {editTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" },
  modal: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  title: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  closeBtn: { background: "transparent", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" },
  field: { marginBottom: 16, flex: 1 },
  row: { display: "flex", gap: 12 },
  label: { display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", background: "#0b0f1a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 },
  cancelBtn: { padding: "9px 20px", background: "transparent", border: "1px solid #1e293b", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" },
  saveBtn: { padding: "9px 20px", background: "#1d4ed8", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" },
};

export default TaskModal;
