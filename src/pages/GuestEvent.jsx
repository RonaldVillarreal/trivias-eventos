import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvent, listTrivias } from "../lib/api";
import { TRIVIA_TYPE_LABELS, TRIVIA_TYPES, TRIVIA_PALETTES, getPalette } from "../lib/config";

// Emoji por tipo de trivia (va en el cuadrito de vidrio de cada card).
const TYPE_EMOJI = {
  [TRIVIA_TYPES.CANDIDATES]: "🏅",
  [TRIVIA_TYPES.MULTIPLE]: "🎯",
  [TRIVIA_TYPES.OPEN]: "💬",
};
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
          <button className="btn btn-sm glass-btn-all" onClick={() => navigate(`/votar/${answerable[0].$id}`)}>
            ▶ Responder todas seguidas
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="card center" style={{ padding: "48px 28px" }}>
          <h2 style={{ fontSize: 20 }}>Todavía no hay trivias en este evento</h2>
        </div>
      ) : (
        <div className="hub-grid">
          {ordered.map((t) => {
            const pal = getPalette(t.palette);
            const isVoted = voted.has(t.$id);
            const isClosed = !t.isOpen;
            const disabled = isVoted || isClosed;
            const cta = isVoted ? "Ya respondida" : isClosed ? "Cerrada" : "Responder";
            return (
              <button
                key={t.$id}
                className={`glass-card${isVoted ? " done" : ""}${isClosed ? " closed" : ""}`}
                disabled={disabled}
                onClick={() => !disabled && navigate(`/votar/${t.$id}`)}
                style={{ "--accent": pal.accent, "--accent-strong": pal.accent, "--text": "#2f2937" }}
              >
                {isVoted && <span className="glass-badge" aria-label="Respondida">✓</span>}
                <div className="glass-row">
                  <span className="glass-emoji">{TYPE_EMOJI[t.type] || "✨"}</span>
                  <span className="glass-chip">{TRIVIA_TYPE_LABELS[t.type]}</span>
                </div>
                <span className="glass-title">{t.publicName || t.title}</span>
                <span className="glass-cta">
                  {cta}{!disabled && <span className="arrow">→</span>}
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
    <div className="hub-bg">
      {/* Orbes de color difusos: hacen que el efecto vidrio de las cards se note */}
      <div className="hub-orb" style={{ background: TRIVIA_PALETTES[0].accent, top: "-80px", left: "-60px", width: 360, height: 360 }} />
      <div className="hub-orb" style={{ background: TRIVIA_PALETTES[2].accent, bottom: "-120px", right: "-80px", width: 420, height: 420 }} />
      <div className="hub-orb" style={{ background: TRIVIA_PALETTES[3].accent, top: "30%", right: "15%", width: 300, height: 300 }} />

      <div className="hub-content container" style={{ padding: "40px 22px 70px" }}>
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
