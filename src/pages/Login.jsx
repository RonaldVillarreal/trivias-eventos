import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await signIn(form.email, form.password);
      else await signUp(form.email, form.password, form.name);
      navigate("/panel");
    } catch (err) {
      setError(err?.message || "No pudimos completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 36, background: "var(--white)" }}>
        <img
          src="/logo-bloom-cuadrado.jpeg"
          alt="Bloom Trivias"
          style={{ width: 190, height: "auto", display: "block", margin: "0 auto 4px" }}
        />
        <p className="eyebrow center">Panel del organizador</p>
        <p className="muted small center mt-1 mb-3">
          {mode === "login" ? "Ingresá para gestionar tus eventos." : "Creá tu cuenta de organizador."}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <div className="field">
              <label>Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre"
                required
              />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vos@correo.com"
              required
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          {error && <p className="small" style={{ color: "#b46b6b", marginBottom: 12 }}>{error}</p>}

          <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <p className="small center mt-2 muted">
          {mode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
          <button
            className="small"
            style={{ background: "none", border: "none", color: "var(--terra)", fontWeight: 600 }}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Registrate" : "Ingresá"}
          </button>
        </p>
      </div>
    </div>
  );
}
