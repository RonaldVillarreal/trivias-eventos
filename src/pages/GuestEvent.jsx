import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvent, listTrivias } from "../lib/api";
import { TRIVIA_TYPE_LABELS, TRIVIA_PALETTES, getPalette } from "../lib/config";

// Degradado suave que combina los cuatro tonos pastel de las paletas.
const HUB_BG = `linear-gradient(160deg, ${TRIVIA_PALETTES.map((p) => p.bg).join(", ")})`;
import { getVoterName, setVoterName, getVotedSet } from "../lib/guest";
import { Spinner } from "../components/ui";

// Hub público del evento: el votante pone su nombre y ve TODAS las trivias en
// cards para elegir cuál responder. Las ya respondidas quedan grisadas.
export default function GuestEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [trivias, setTrivias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState(getVoterName(eventId));
  const [nameInput, setNameInput] = useState("");
  const [voted, setVoted] = useState(() => getVotedSet(eventId));

  useEffect(() => {
    (async () => {
      try {
        const [ev, tr] = await Promise.all([
          getEvent(eventId).catch(() => null),
          listTrivias(eventId),
        ]);
        setEvent(ev);
        setTrivias(tr);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
    // Releemos lo respondido al volver de una trivia
    setVoted(getVotedSet(eventId));
  }, [eventId]);

  function continueWithName() {
    const n = nameInput.trim();
    if (!n) return;
    setVoterName(eventId, n);
    setName(n);
  }

  if (loading) return <Shell><Spinner label="Cargando…" /></Shell>;

  if (notFound) {
    return (
      <Shell>
        <div className="card center" style={{ padding: "48px 28px" }}>
          <h2 style={{ fontSize: 22 }}>No encontramos este evento</h2>
          <p className="muted small mt-1">El link puede ser incorrecto o el evento fue eliminado.</p>
        </div>
      </Shell>
    );
  }

  // Paso 1: pedir el nombre (una sola vez por dispositivo)
  if (!name) {
    return (
      <Shell title={event?.name}>
        <div className="card" style={{ padding: 28, maxWidth: 440, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22 }}>¡Bienvenido/a!</h2>
          <p className="muted small mt-1 mb-2">Decinos tu nombre para participar de las trivias.</p>
          <div className="field">
            <label>Tu nombre</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ej: Sofía Gómez"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && continueWithName()}
            />
          </div>
          <button className="btn" style={{ width: "100%" }} disabled={!nameInput.trim()} onClick={continueWithName}>
            Continuar
          </button>
        </div>
      </Shell>
    );
  }

  // Paso 2: listado de trivias
  const ordered = [...trivias].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const answerable = ordered.filter((t) => t.isOpen && !voted.has(t.$id));
  const doneCount = ordered.filter((t) => voted.has(t.$id)).length;

  return (
    <Shell title={event?.name}>
      <div className="row between wrap mb-3" style={{ gap: 12 }}>
        <p className="muted small">
          Hola <strong>{name}</strong> · respondiste {doneCount} de {ordered.length}
        </p>
        {answerable.length > 0 && (
          <button className="btn btn-sm" onClick={() => navigate(`/votar/${answerable[0].$id}`)}>
            ▶ Responder todas seguidas
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="card center" style={{ padding: "48px 28px" }}>
          <h2 style={{ fontSize: 20 }}>Todavía no hay trivias en este evento</h2>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {ordered.map((t) => {
            const pal = getPalette(t.palette);
            const isVoted = voted.has(t.$id);
            const isClosed = !t.isOpen;
            const disabled = isVoted || isClosed;
            return (
              <button
                key={t.$id}
                disabled={disabled}
                onClick={() => !disabled && navigate(`/votar/${t.$id}`)}
                style={{
                  textAlign: "left",
                  borderRadius: "var(--radius)",
                  border: `1.5px solid ${disabled ? "var(--line)" : pal.accent}`,
                  background: disabled ? "var(--linen)" : pal.bg,
                  padding: 18,
                  cursor: disabled ? "default" : "pointer",
                  opacity: disabled ? 0.6 : 1,
                  minHeight: 130,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "transform 0.12s",
                }}
              >
                <span className="pill" style={{ alignSelf: "flex-start", background: disabled ? "var(--linen)" : pal.soft, color: pal.accent }}>
                  {TRIVIA_TYPE_LABELS[t.type]}
                </span>
                <strong style={{ fontSize: 18 }}>{t.publicName || t.title}</strong>
                <span style={{ marginTop: "auto", fontWeight: 700, color: pal.accent }}>
                  {isVoted ? "✓ Ya respondida" : isClosed ? "Cerrada" : "Responder →"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function Shell({ title, children }) {
  return (
    <div style={{ minHeight: "100vh", background: HUB_BG }}>
      <div className="container" style={{ padding: "40px 22px 70px" }}>
        <div className="center mb-3">
          <p className="eyebrow">Trivias del evento</p>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", marginTop: 6 }}>{title || "Evento"}</h1>
        </div>
        {children}
        <p className="muted small center mt-4" style={{ opacity: 0.7 }}>Powered by BloomDate Eventos</p>
      </div>
    </div>
  );
}
