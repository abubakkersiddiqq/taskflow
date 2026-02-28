import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("All fields required");

    const result = await login(form);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ TaskFlow</div>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Register</Link>
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

export default Login;
