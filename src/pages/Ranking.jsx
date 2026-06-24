import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventRanking, imageUrl } from "../lib/api";
import { TRIVIA_TYPE_LABELS } from "../lib/config";
import { Spinner } from "../components/ui";

// Cada cuántos ms se refresca el ranking en vivo (proyección en pantalla).
const REFRESH_MS = 7000;

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Ranking() {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const firstLoad = useRef(true);

  async function load() {
    try {
      const res = await getEventRanking(eventId);
      setData(res);
      setError(false);
    } catch {
      if (firstLoad.current) setError(true);
    } finally {
      firstLoad.current = false;
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [eventId]);

  if (!data && !error) {
    return (
      <Shell>
        <Spinner label="Cargando ranking…" />
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="card center" style={{ padding: "48px 28px" }}>
          <h2 style={{ fontSize: 24 }}>No encontramos este ranking</h2>
          <p className="muted small mt-1">El link puede ser incorrecto o el evento fue eliminado.</p>
        </div>
      </Shell>
    );
  }

  const eventName = data.event?.name || "Ranking del evento";
  const items = data.items;

  return (
    <Shell>
      <header className="center" style={{ marginBottom: 36 }}>
        <p className="eyebrow" style={{ color: "var(--peach)" }}>Ranking en vivo</p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", marginTop: 8, color: "#fff" }}>{eventName}</h1>
      </header>

      {items.length === 0 ? (
        <div className="card center" style={{ padding: "48px 28px" }}>
          <h2 style={{ fontSize: 22 }}>Todavía no hay trivias en este evento</h2>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 22,
            alignItems: "start",
          }}
        >
          {items.map((item) => (
            <TriviaCard key={item.trivia.$id} item={item} />
          ))}
        </div>
      )}
    </Shell>
  );
}

function TriviaCard({ item }) {
  const { trivia } = item;
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.96)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)" }}>
        <span className="pill mauve">{TRIVIA_TYPE_LABELS[trivia.type]}</span>
        <h2 style={{ fontSize: 22, marginTop: 8 }}>{trivia.publicName || trivia.title}</h2>
      </div>
      <div style={{ padding: 22 }}>
        {item.open ? <OpenAnswers answers={item.answers} /> : <OptionRanking rows={item.rows} total={item.total} />}
      </div>
    </section>
  );
}

function OptionRanking({ rows, total }) {
  if (rows.length === 0) {
    return <p className="muted">Sin opciones cargadas.</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.count));
  const winner = rows[0];
  const hasVotes = total > 0;

  return (
    <div>
      {hasVotes && winner.count > 0 && (
        <div
          className="row"
          style={{
            gap: 14,
            alignItems: "center",
            background: "linear-gradient(120deg, var(--terra-soft), var(--peach))",
            borderRadius: "var(--radius-sm)",
            padding: 14,
            marginBottom: 16,
          }}
        >
          {winner.imageFileId ? (
            <img
              src={imageUrl(winner.imageFileId)}
              alt=""
              style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 12, background: "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>👑</div>
          )}
          <div>
            <p className="small" style={{ fontWeight: 700, opacity: 0.75 }}>🏆 Ganador/a</p>
            <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>{winner.label}</p>
            <p className="small" style={{ opacity: 0.8 }}>{winner.count} voto{winner.count !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <div key={r.$id}>
            <div className="row between" style={{ marginBottom: 5 }}>
              <span className="row" style={{ gap: 8, alignItems: "center" }}>
                <span style={{ width: 22, textAlign: "center" }}>{MEDALS[i] || `${i + 1}.`}</span>
                <strong>{r.label}</strong>
              </span>
              <span className="muted small">{r.count}</span>
            </div>
            <div style={{ height: 12, background: "var(--linen)", borderRadius: 99, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(r.count / max) * 100}%`,
                  background: i === 0 && r.count > 0
                    ? "linear-gradient(90deg, var(--terra-soft), var(--peach))"
                    : "var(--sage)",
                  borderRadius: 99,
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="muted small mt-2" style={{ marginTop: 12 }}>{total} voto{total !== 1 ? "s" : ""} en total</p>
    </div>
  );
}

function OpenAnswers({ answers }) {
  if (answers.length === 0) {
    return <p className="muted">Todavía no hay respuestas.</p>;
  }
  return (
    <div>
      <p className="muted small mb-2">{answers.length} respuesta{answers.length !== 1 ? "s" : ""}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
        {answers.map((a) => (
          <div key={a.$id} className="card" style={{ padding: "10px 14px", background: "var(--cream)" }}>
            <p>{a.textAnswer}</p>
            <p className="muted small mt-1">— {a.voterName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #2a2230, #3a2f3a 55%, #4a3a3f)",
      }}
    >
      <div className="container" style={{ padding: "48px 26px 80px" }}>
        {children}
        <p className="small center mt-4" style={{ opacity: 0.4, color: "#fff" }}>Powered by BloomDate Eventos</p>
      </div>
    </div>
  );
}
