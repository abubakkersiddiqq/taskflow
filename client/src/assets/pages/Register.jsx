import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("All fields required");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");

    const result = await register(form);
    if (result.success) {
      toast.success("Account created!");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ TaskFlow</div>
        <h2 style={styles.title}>Create account</h2>
        <p style={styles.sub}>Start managing your tasks today</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              placeholder="Alex Rivera"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a" },
  card: { background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420 },
  logo: { fontFamily: "monospace", fontWeight: 700, fontSize: 22, color: "#fff", marginBottom: 24, textAlign: "center" },
  title: { fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 6, textAlign: "center" },
  sub: { fontSize: 14, color: "#64748b", marginBottom: 28, textAlign: "center" },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", background: "#0b0f1a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  btn: { width: "100%", padding: "11px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  footer: { textAlign: "center", marginTop: 20, fontSize: 14, color: "#64748b" },
  link: { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 },
};

export default Register;
