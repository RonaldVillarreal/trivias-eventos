import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listEvents, createEvent, deleteEvent, createAdmin } from "../lib/api";
import TopBar from "../components/TopBar";
import { Spinner, Modal, Toast, useToast } from "../components/ui";

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  // Alta de otro admin
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState("");

  async function addAdmin(e) {
    e.preventDefault();
    setAdminError("");
    setAdminBusy(true);
    try {
      await createAdmin(adminForm.email.trim(), adminForm.password, adminForm.name.trim());
      setAdminForm({ name: "", email: "", password: "" });
      setAdminOpen(false);
      toast.show("Admin creado");
    } catch (err) {
      setAdminError(err?.message || "No pudimos crear el admin.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function load() {
    setLoading(true);
    setEvents(await listEvents());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createEvent({ name: name.trim(), ownerId: user.$id });
      setName("");
      setOpen(false);
      toast.show("Evento creado");
      load();
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este evento? Las trivias quedarán huérfanas.")) return;
    await deleteEvent(id);
    toast.show("Evento eliminado");
    load();
  }

  return (
    <>
      <TopBar />
      <main className="container" style={{ padding: "40px 22px 80px" }}>
        <div className="row between wrap mb-3" style={{ gap: 14 }}>
          <div>
            <p className="eyebrow">Tus eventos</p>
            <h1 style={{ fontSize: 30, marginTop: 4 }}>Panel de gestión</h1>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-soft" onClick={() => setAdminOpen(true)}>+ Agregar admin</button>
            <button className="btn" onClick={() => setOpen(true)}>+ Nuevo evento</button>
          </div>
        </div>

        {loading ? (
          <Spinner label="Cargando eventos…" />
        ) : events.length === 0 ? (
          <div className="card center" style={{ padding: "56px 24px" }}>
            <h3 style={{ fontSize: 20 }}>Todavía no hay eventos</h3>
            <p className="muted small mt-1">Creá tu primer evento para empezar a armar trivias.</p>
            <button className="btn mt-2" onClick={() => setOpen(true)}>Crear evento</button>
          </div>
        ) : (
          <div className="grid">
            {events.map((ev) => (
              <div key={ev.$id} className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    height: 8, width: 56, borderRadius: 99,
                    background: "linear-gradient(90deg, var(--sage), var(--peach))",
                  }}
                />
                <div>
                  <h3 style={{ fontSize: 20 }}>{ev.name}</h3>
                  <p className="muted small mt-1">
                    {new Date(ev.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="row between" style={{ marginTop: "auto" }}>
                  <Link to={`/panel/evento/${ev.$id}`} className="btn btn-soft btn-sm">Abrir</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(ev.$id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo evento">
        <form onSubmit={add}>
          <div className="field">
            <label>Nombre del evento</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Boda de Lucía y Martín"
              autoFocus
              required
            />
          </div>
          <div className="row between mt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn" disabled={busy}>{busy ? "Creando…" : "Crear evento"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={adminOpen} onClose={() => setAdminOpen(false)} title="Agregar otro admin">
        <p className="muted small mb-3">
          Creá una cuenta de organizador. Va a poder ingresar al panel con este email y contraseña.
          Tu sesión actual no se cierra.
        </p>
        <form onSubmit={addAdmin}>
          <div className="field">
            <label>Nombre</label>
            <input
              value={adminForm.name}
              onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              placeholder="Nombre del admin"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              placeholder="admin@correo.com"
              required
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>
          {adminError && <p className="small" style={{ color: "#b46b6b", marginBottom: 12 }}>{adminError}</p>}
          <div className="row between mt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setAdminOpen(false)}>Cancelar</button>
            <button type="submit" className="btn" disabled={adminBusy}>{adminBusy ? "Creando…" : "Crear admin"}</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} onDone={toast.clear} />
    </>
  );
}
