import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getEvent, listTrivias, deleteTrivia, setTriviaOpen,
  listVotes, listOptions, imageUrl,
} from "../lib/api";
import { TRIVIA_TYPE_LABELS, TRIVIA_TYPES } from "../lib/config";
import TopBar from "../components/TopBar";
import TriviaForm from "../components/TriviaForm";
import { Spinner, Modal, Toast, useToast } from "../components/ui";

function ResultsView({ trivia }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      const votes = await listVotes(trivia.$id);
      if (trivia.type === TRIVIA_TYPES.OPEN) {
        setData({ open: true, answers: votes });
      } else {
        const opts = await listOptions(trivia.$id);
        const counts = {};
        votes.forEach((v) => { counts[v.optionId] = (counts[v.optionId] || 0) + 1; });
        const rows = opts
          .map((o) => ({ ...o, count: counts[o.$id] || 0 }))
          .sort((a, b) => b.count - a.count);
        setData({ open: false, rows, total: votes.length });
      }
    })();
  }, [trivia.$id]);

  if (!data) return <Spinner label="Contando votos…" />;

  if (data.open) {
    return (
      <div>
        <p className="muted small mb-2">{data.answers.length} respuestas</p>
        {data.answers.length === 0 && <p className="muted">Todavía no hay respuestas.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.answers.map((a) => (
            <div key={a.$id} className="card" style={{ padding: "12px 16px", background: "var(--cream)" }}>
              <p>{a.textAnswer}</p>
              <p className="muted small mt-1">— {a.voterName}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const max = Math.max(1, ...data.rows.map((r) => r.count));
  return (
    <div>
      <p className="muted small mb-2">{data.total} votos en total</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.rows.map((r, i) => (
          <div key={r.$id}>
            <div className="row between" style={{ marginBottom: 5 }}>
              <span className="row" style={{ gap: 8 }}>
                {i === 0 && r.count > 0 && <span className="pill peach">★ Líder</span>}
                <strong>{r.label}</strong>
              </span>
              <span className="muted small">{r.count}</span>
            </div>
            <div style={{ height: 10, background: "var(--linen)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${(r.count / max) * 100}%`,
                background: i === 0 ? "linear-gradient(90deg, var(--terra-soft), var(--peach))" : "var(--sage)",
                borderRadius: 99, transition: "width 0.4s",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EventPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [trivias, setTrivias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [results, setResults] = useState(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    const [ev, tr] = await Promise.all([getEvent(eventId), listTrivias(eventId)]);
    setEvent(ev);
    setTrivias(tr);
    setLoading(false);
  }
  useEffect(() => { load(); }, [eventId]);

  function publicLink(triviaId) {
    return `${window.location.origin}/votar/${triviaId}`;
  }
  function rankingLink() {
    return `${window.location.origin}/ranking/${eventId}`;
  }
  function copyLink(triviaId) {
    navigator.clipboard.writeText(publicLink(triviaId));
    toast.show("Link copiado");
  }
  function copyRankingLink() {
    navigator.clipboard.writeText(rankingLink());
    toast.show("Link del ranking copiado");
  }
  async function toggleOpen(t) {
    await setTriviaOpen(t.$id, !t.isOpen);
    toast.show(t.isOpen ? "Votación cerrada" : "Votación abierta");
    load();
  }
  async function remove(id) {
    if (!confirm("¿Eliminar esta trivia y sus votos asociados?")) return;
    await deleteTrivia(id);
    toast.show("Trivia eliminada");
    load();
  }

  if (loading) return (<><TopBar /><div className="container"><Spinner label="Cargando evento…" /></div></>);

  return (
    <>
      <TopBar />
      <main className="container" style={{ padding: "32px 22px 80px" }}>
        <Link to="/panel" className="small muted">← Volver a eventos</Link>
        <div className="row between wrap mt-2 mb-3" style={{ gap: 14 }}>
          <div>
            <p className="eyebrow">Evento</p>
            <h1 style={{ fontSize: 30, marginTop: 4 }}>{event.name}</h1>
            <p className="muted small mt-1">{trivias.length} trivia{trivias.length !== 1 ? "s" : ""}</p>
          </div>
          <button className="btn" onClick={() => setShowForm(true)}>+ Nueva trivia</button>
        </div>

        {/* Link del ranking del evento, para proyectar en pantallas */}
        <div className="card row between wrap mb-3" style={{ padding: "16px 20px", gap: 12, background: "var(--cream)" }}>
          <div>
            <p style={{ fontWeight: 700 }}>📺 Ranking del evento</p>
            <p className="muted small mt-1">
              Link público con todos los ganadores en vivo. Pasáselo al encargado de las pantallas para proyectarlo.
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-soft btn-sm" onClick={copyRankingLink}>Copiar link del ranking</button>
            <a className="btn btn-ghost btn-sm" href={rankingLink()} target="_blank" rel="noreferrer">Ver</a>
          </div>
        </div>

        {trivias.length === 0 ? (
          <div className="card center" style={{ padding: "56px 24px" }}>
            <h3 style={{ fontSize: 20 }}>Sin trivias todavía</h3>
            <p className="muted small mt-1">Creá la primera trivia para generar el link de invitados.</p>
            <button className="btn mt-2" onClick={() => setShowForm(true)}>Crear trivia</button>
          </div>
        ) : (
          <div className="grid">
            {trivias.map((t) => (
              <div key={t.$id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                {t.coverFileId ? (
                  <img src={imageUrl(t.coverFileId)} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
                ) : (
                  <div style={{ height: 130, background: "linear-gradient(135deg, var(--mauve), var(--peach))" }} />
                )}
                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  <div className="row between" style={{ gap: 8 }}>
                    <span className="pill mauve">{TRIVIA_TYPE_LABELS[t.type]}</span>
                    <span className={`pill ${t.isOpen ? "" : "muted"}`}>{t.isOpen ? "Abierta" : "Cerrada"}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18 }}>{t.title}</h3>
                    <p className="muted small mt-1">{t.publicName}</p>
                  </div>

                  <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={() => copyLink(t.$id)}>
                        Copiar link
                      </button>
                      <a className="btn btn-ghost btn-sm" href={publicLink(t.$id)} target="_blank" rel="noreferrer">Ver</a>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setResults(t)}>
                        Resultados
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleOpen(t)}>
                        {t.isOpen ? "Cerrar" : "Abrir"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(t.$id)}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva trivia" width={580}>
        <TriviaForm
          eventId={eventId}
          ownerId={user.$id}
          onCancel={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); toast.show("Trivia creada"); load(); }}
        />
      </Modal>

      <Modal open={!!results} onClose={() => setResults(null)} title={results ? `Resultados · ${results.title}` : ""}>
        {results && <ResultsView trivia={results} />}
      </Modal>

      <Toast message={toast.message} onDone={toast.clear} />
    </>
  );
}
