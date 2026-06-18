import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listEvents, createEvent, deleteEvent } from "../lib/api";
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

  async function load() {
    setLoading(true);
    setEvents(await listEvents(user.$id));
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
          <button className="btn" onClick={() => setOpen(true)}>+ Nuevo evento</button>
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

      <Toast message={toast.message} onDone={toast.clear} />
    </>
  );
}
