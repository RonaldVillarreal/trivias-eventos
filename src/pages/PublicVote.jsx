import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTrivia, listOptions, createVote, imageUrl } from "../lib/api";
import { TRIVIA_TYPES } from "../lib/config";
import { Spinner } from "../components/ui";

export default function PublicVote() {
  const { triviaId } = useParams();
  const [trivia, setTrivia] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [voterName, setVoterName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);
  const [selected, setSelected] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const t = await getTrivia(triviaId);
        setTrivia(t);
        if (t.type !== TRIVIA_TYPES.OPEN) setOptions(await listOptions(triviaId));
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
      setDone(true);
    } catch (err) {
      setError(err?.message || "No se pudo registrar tu voto.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="container narrow"><Spinner label="Cargando…" /></div>;

  if (notFound) {
    return (
      <Shell>
        <div className="card center" style={{ padding: "48px 28px" }}>
          <h2 style={{ fontSize: 22 }}>No encontramos esta trivia</h2>
          <p className="muted small mt-1">El link puede ser incorrecto o la trivia fue eliminada.</p>
        </div>
      </Shell>
    );
  }

  if (!trivia.isOpen) {
    return (
      <Shell trivia={trivia}>
        <div className="card center" style={{ padding: "44px 28px" }}>
          <span className="pill muted">Votación cerrada</span>
          <h2 style={{ fontSize: 22, marginTop: 12 }}>Esta votación ya finalizó</h2>
          <p className="muted small mt-1">¡Gracias por tu interés!</p>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell trivia={trivia}>
        <div className="card center" style={{ padding: "48px 28px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 99, margin: "0 auto 14px",
            background: "linear-gradient(135deg, var(--sage), var(--peach))",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
          }}>✓</div>
          <h2 style={{ fontSize: 24 }}>¡Voto registrado!</h2>
          <p className="muted mt-1">Gracias por participar, {voterName}.</p>
        </div>
      </Shell>
    );
  }

  // Paso 1: pedir nombre
  if (!nameLocked) {
    return (
      <Shell trivia={trivia}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22 }}>Antes de empezar</h2>
          <p className="muted small mt-1 mb-2">Decinos tu nombre para registrar tu participación.</p>
          <div className="field">
            <label>Tu nombre</label>
            <input
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              placeholder="Ej: Sofía Gómez"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && voterName.trim() && setNameLocked(true)}
            />
          </div>
          <button
            className="btn"
            style={{ width: "100%" }}
            disabled={!voterName.trim()}
            onClick={() => setNameLocked(true)}
          >
            Continuar
          </button>
        </div>
      </Shell>
    );
  }

  // Paso 2: votar
  return (
    <Shell trivia={trivia}>
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
                    border: active ? "2px solid var(--terra)" : "1.5px solid var(--line)",
                    borderRadius: "var(--radius-sm)", background: active ? "rgba(240,205,180,0.25)" : "var(--white)",
                    padding: trivia.type === TRIVIA_TYPES.CANDIDATES ? 0 : "14px 16px",
                    overflow: "hidden", textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  {trivia.type === TRIVIA_TYPES.CANDIDATES && (
                    o.imageFileId ? (
                      <img src={imageUrl(o.imageFileId)} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ height: 130, background: "linear-gradient(135deg, var(--mauve), var(--sage))" }} />
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

        <button className="btn mt-3" style={{ width: "100%" }} disabled={busy} onClick={submit}>
          {busy ? "Enviando…" : "Enviar mi voto"}
        </button>
        <p className="muted small center mt-2">Votás como <strong>{voterName}</strong></p>
      </div>
    </Shell>
  );
}

function Shell({ trivia, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--linen)" }}>
      <div className="container narrow" style={{ padding: "40px 22px 60px" }}>
        {trivia?.coverFileId && (
          <img
            src={imageUrl(trivia.coverFileId)}
            alt=""
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "var(--radius)", marginBottom: 20 }}
          />
        )}
        {trivia && (
          <div className="center mb-3">
            <p className="eyebrow">Trivia del evento</p>
            <h1 style={{ fontSize: 28, marginTop: 6 }}>{trivia.publicName}</h1>
          </div>
        )}
        {children}
        <p className="muted small center mt-4" style={{ opacity: 0.7 }}>Powered by BloomDate Eventos</p>
      </div>
    </div>
  );
}
