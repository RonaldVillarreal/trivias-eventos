import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getTrivia, listOptions, listTrivias, createVote, imageUrl } from "../lib/api";
import { TRIVIA_TYPES, getPalette } from "../lib/config";
import { getVoterName, getVotedSet, markVoted, hasVoted } from "../lib/guest";
import { Spinner } from "../components/ui";

export default function PublicVote() {
  const { triviaId } = useParams();
  const navigate = useNavigate();

  const [trivia, setTrivia] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [allTrivias, setAllTrivias] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [voterName, setName] = useState("");
  const [selected, setSelected] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Reset al cambiar de trivia (navegación encadenada)
    setLoading(true);
    setNotFound(false);
    setDone(false);
    setSelected("");
    setTextAnswer("");
    setError("");
    (async () => {
      try {
        const t = await getTrivia(triviaId);
        setTrivia(t);
        setEventId(t.eventId);
        setName(getVoterName(t.eventId));
        setAlreadyVoted(hasVoted(t.eventId, triviaId));
        const [opts, all] = await Promise.all([
          t.type !== TRIVIA_TYPES.OPEN ? listOptions(triviaId) : Promise.resolve([]),
          listTrivias(t.eventId).catch(() => []),
        ]);
        setOptions(opts);
        setAllTrivias(all);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [triviaId]);


  async function submit() {
    setError("");
    if (trivia.type === TRIVIA_TYPES.OPEN) {
      if (!textAnswer.trim()) { setError("Escribí tu respuesta."); return; }
    } else if (!selected) { setError("Elegí una opción."); return; }
    setBusy(true);
    try {
      await createVote({
        triviaId,
        optionId: trivia.type === TRIVIA_TYPES.OPEN ? "" : selected,
        voterName: voterName.trim(),
        textAnswer: trivia.type === TRIVIA_TYPES.OPEN ? textAnswer.trim() : "",
      });
      markVoted(eventId, triviaId);
      setDone(true);
    } catch (err) {
      setError(err?.message || "No se pudo registrar tu voto.");
    } finally {
      setBusy(false);
    }
  }

  // Próxima trivia abierta y sin responder (para encadenar)
  function nextTrivia() {
    const voted = getVotedSet(eventId);
    return [...allTrivias]
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""))
      .find((t) => t.$id !== triviaId && t.isOpen && !voted.has(t.$id));
  }

  const palette = getPalette(trivia?.palette);
  // Botones armónicos con la paleta de la trivia
  const primaryBtn = { background: palette.accent, color: "#fff", border: "none" };
  const secondaryBtn = { background: "transparent", color: palette.accent, border: `1.5px solid ${palette.accent}` };

  if (loading) return <Shell palette={palette}><Spinner label="Cargando…" /></Shell>;

  if (notFound) {
    return (
      <Shell palette={palette}>
        <div className="card center" style={{ padding: "48px 28px" }}>
          <h2 style={{ fontSize: 22 }}>No encontramos esta trivia</h2>
          <p className="muted small mt-1">El link puede ser incorrecto o la trivia fue eliminada.</p>
        </div>
      </Shell>
    );
  }

  const backToHub = () => navigate(`/evento/${eventId}`);

  if (!trivia.isOpen) {
    return (
      <Shell palette={palette} trivia={trivia}>
        <div className="card center" style={{ padding: "44px 28px" }}>
          <span className="pill muted">Votación cerrada</span>
          <h2 style={{ fontSize: 22, marginTop: 12 }}>Esta votación ya finalizó</h2>
          <button className="btn mt-3" style={secondaryBtn} onClick={backToHub}>← Volver a todas las trivias</button>
        </div>
      </Shell>
    );
  }

  // Ya respondió esta trivia en este dispositivo
  if (alreadyVoted && !done) {
    const next = nextTrivia();
    return (
      <Shell palette={palette} trivia={trivia}>
        <div className="card center" style={{ padding: "44px 28px" }}>
          <span className="pill peach">Ya participaste</span>
          <h2 style={{ fontSize: 22, marginTop: 12 }}>Ya respondiste esta trivia</h2>
          <p className="muted small mt-1 mb-2">Cada trivia se responde una sola vez.</p>
          <div className="row center" style={{ gap: 10, justifyContent: "center" }}>
            {next && <button className="btn" style={primaryBtn} onClick={() => navigate(`/votar/${next.$id}`)}>Siguiente trivia →</button>}
            <button className="btn btn-soft" style={secondaryBtn} onClick={backToHub}>Ver todas las trivias</button>
          </div>
        </div>
      </Shell>
    );
  }

  if (done) {
    const next = nextTrivia();
    return (
      <Shell palette={palette} trivia={trivia}>
        <div className="card center" style={{ padding: "48px 28px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 99, margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${palette.soft}, ${palette.bg})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
          }}>✓</div>
          <h2 style={{ fontSize: 24 }}>¡Voto registrado!</h2>
          <p className="muted mt-1 mb-2">Gracias por participar, {voterName}.</p>
          <div className="row" style={{ gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {next && <button className="btn" style={primaryBtn} onClick={() => navigate(`/votar/${next.$id}`)}>Siguiente trivia →</button>}
            <button className="btn btn-soft" style={secondaryBtn} onClick={backToHub}>Ver todas las trivias</button>
          </div>
          {!next && <p className="muted small mt-3">🎉 ¡Respondiste todas las trivias disponibles!</p>}
        </div>
      </Shell>
    );
  }

  // Si todavía no puso su nombre, lo mandamos al hub del evento: ahí lo carga
  // una sola vez y ve TODAS las trivias para elegir cuál responder.
  if (!voterName) {
    return <Navigate to={`/evento/${eventId}`} replace />;
  }

  // Paso 2: votar
  return (
    <Shell palette={palette} trivia={trivia}>
      <div className="card" style={{ padding: 28 }}>
        {trivia.question && <p className="mb-2" style={{ fontSize: 17, fontWeight: 600 }}>{trivia.question}</p>}

        {trivia.type === TRIVIA_TYPES.OPEN ? (
          <div className="field">
            <label>Tu respuesta</label>
            <textarea value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder="Escribí acá…" autoFocus />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: trivia.type === TRIVIA_TYPES.CANDIDATES ? "repeat(auto-fill, minmax(140px, 1fr))" : "1fr",
            gap: 12,
          }}>
            {options.map((o) => {
              const active = selected === o.$id;
              return (
                <button
                  key={o.$id}
                  onClick={() => setSelected(o.$id)}
                  style={{
                    border: active ? `2px solid ${palette.accent}` : "1.5px solid var(--line)",
                    borderRadius: "var(--radius-sm)", background: active ? palette.bg : "var(--white)",
                    padding: trivia.type === TRIVIA_TYPES.CANDIDATES ? 0 : "14px 16px",
                    overflow: "hidden", textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  {trivia.type === TRIVIA_TYPES.CANDIDATES && (
                    o.imageFileId ? (
                      <img src={imageUrl(o.imageFileId)} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ height: 130, background: `linear-gradient(135deg, ${palette.soft}, ${palette.accent})` }} />
                    )
                  )}
                  <div style={{ padding: trivia.type === TRIVIA_TYPES.CANDIDATES ? "10px 12px" : 0 }}>
                    <span style={{ fontWeight: 600 }}>{o.label}</span>
                    {active && <span className="pill peach" style={{ marginLeft: 8 }}>Elegido</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="small mt-2" style={{ color: "#b46b6b" }}>{error}</p>}

        <button className="btn mt-3" style={{ width: "100%", ...primaryBtn }} disabled={busy} onClick={submit}>
          {busy ? "Enviando…" : "Enviar mi voto"}
        </button>
        <div className="row between mt-2" style={{ alignItems: "center" }}>
          <span className="muted small">Votás como <strong>{voterName}</strong></span>
          <button className="btn btn-ghost btn-sm" style={secondaryBtn} onClick={backToHub}>Ver todas las trivias</button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ palette, trivia, children }) {
  return (
    <div style={{ minHeight: "100vh", background: palette?.bg || "var(--linen)" }}>
      <div className="container narrow" style={{ padding: "40px 22px 60px" }}>
        {trivia && (
          <div className="center mb-3">
            <p className="eyebrow" style={{ color: palette?.accent }}>Trivia del evento</p>
            <h1 style={{ fontSize: 28, marginTop: 6 }}>{trivia.publicName}</h1>
          </div>
        )}
        {children}
        <p className="muted small center mt-4" style={{ opacity: 0.7 }}>Powered by BloomDate Eventos</p>
      </div>
    </div>
  );
}
