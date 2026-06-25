import { useState } from "react";
import { TRIVIA_TYPES, TRIVIA_TYPE_LABELS, TRIVIA_PALETTES, DEFAULT_PALETTE } from "../lib/config";
import { createTrivia, createOption, updateTrivia, uploadImage } from "../lib/api";

const TYPE_HINT = {
  [TRIVIA_TYPES.CANDIDATES]: "Los invitados eligen a una persona. Cargá cada candidato con su foto.",
  [TRIVIA_TYPES.MULTIPLE]: "Una pregunta con varias respuestas posibles. Los invitados eligen una.",
  [TRIVIA_TYPES.OPEN]: "Una pregunta abierta. Los invitados escriben su respuesta libremente.",
};

// `trivia` presente = modo edición (solo campos de la trivia: textos y color;
// el tipo y las opciones/candidatos no se editan acá).
export default function TriviaForm({ eventId, ownerId, trivia, onCreated, onCancel }) {
  const editing = !!trivia;
  const [type, setType] = useState(trivia?.type || TRIVIA_TYPES.CANDIDATES);
  const [title, setTitle] = useState(trivia?.title || "");
  const [publicName, setPublicName] = useState(trivia?.publicName || "");
  const [question, setQuestion] = useState(trivia?.question || "");
  const [palette, setPalette] = useState(trivia?.palette || DEFAULT_PALETTE.id);
  const [options, setOptions] = useState([{ label: "", file: null }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const usesOptions = type === TRIVIA_TYPES.CANDIDATES || type === TRIVIA_TYPES.MULTIPLE;

  function updateOption(i, patch) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  function addOption() { setOptions((prev) => [...prev, { label: "", file: null }]); }
  function removeOption(i) { setOptions((prev) => prev.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!editing && usesOptions) {
      const valid = options.filter((o) => o.label.trim());
      if (valid.length < 2) { setError("Agregá al menos dos opciones."); return; }
    }
    setBusy(true);
    try {
      if (editing) {
        await updateTrivia(trivia.$id, {
          title: title.trim(),
          publicName: publicName.trim() || title.trim(),
          question: question.trim(),
          palette,
        });
        onCreated();
        return;
      }

      const created = await createTrivia({
        eventId, ownerId, type,
        title: title.trim(),
        publicName: publicName.trim() || title.trim(),
        question: question.trim(),
        palette,
      });

      if (usesOptions) {
        for (const opt of options.filter((o) => o.label.trim())) {
          let imageFileId = "";
          if (opt.file) imageFileId = await uploadImage(opt.file, ownerId);
          await createOption({ triviaId: created.$id, ownerId, label: opt.label.trim(), imageFileId });
        }
      }
      onCreated();
    } catch (err) {
      setError(err?.message || "No se pudo guardar la trivia.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label>Tipo de trivia</label>
        <select value={type} onChange={(e) => setType(e.target.value)} disabled={editing}>
          {Object.values(TRIVIA_TYPES).map((t) => (
            <option key={t} value={t}>{TRIVIA_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <p className="muted small mt-1">{editing ? "El tipo no se puede cambiar al editar." : TYPE_HINT[type]}</p>
      </div>

      <div className="field">
        <label>Título interno (solo lo ves vos en el panel)</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Mejor vestido/a" required />
      </div>

      <div className="field">
        <label>Nombre público (lo ven los invitados)</label>
        <input
          value={publicName}
          onChange={(e) => setPublicName(e.target.value)}
          placeholder="Ej: ¡Votá al mejor vestido de la noche!"
        />
        <p className="muted small mt-1">Si lo dejás vacío, se usa el título interno.</p>
      </div>

      {(type === TRIVIA_TYPES.MULTIPLE || type === TRIVIA_TYPES.OPEN) && (
        <div className="field">
          <label>Pregunta</label>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Escribí la pregunta…" />
        </div>
      )}

      <div className="field">
        <label>Color de fondo de la trivia</label>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          {TRIVIA_PALETTES.map((p) => {
            const active = palette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                title={p.label}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 999, cursor: "pointer",
                  background: active ? p.soft : "var(--white)",
                  border: active ? `2px solid ${p.accent}` : "1.5px solid var(--line)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span style={{ width: 18, height: 18, borderRadius: 999, background: p.bg, border: `1.5px solid ${p.accent}`, display: "inline-block" }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {editing && usesOptions && (
        <p className="muted small mb-2">
          Los {type === TRIVIA_TYPES.CANDIDATES ? "candidatos" : "opciones"} no se editan desde acá.
        </p>
      )}

      {!editing && usesOptions && (
        <div className="field">
          <label>{type === TRIVIA_TYPES.CANDIDATES ? "Candidatos" : "Opciones"}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {options.map((opt, i) => (
              <div key={i} className="card" style={{ padding: 12, background: "var(--cream)" }}>
                <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <input
                    value={opt.label}
                    onChange={(e) => updateOption(i, { label: e.target.value })}
                    placeholder={type === TRIVIA_TYPES.CANDIDATES ? `Nombre del candidato ${i + 1}` : `Opción ${i + 1}`}
                  />
                  {options.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOption(i)}>✕</button>
                  )}
                </div>
                {type === TRIVIA_TYPES.CANDIDATES && (
                  <label className="btn btn-soft btn-sm mt-1" style={{ marginTop: 8 }}>
                    {opt.file ? `📷 ${opt.file.name.slice(0, 18)}…` : "Foto del candidato"}
                    <input
                      type="file" accept="image/*" style={{ display: "none", width: 0 }}
                      onChange={(e) => updateOption(i, { file: e.target.files?.[0] || null })}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm mt-1" style={{ marginTop: 10 }} onClick={addOption}>
            + Agregar {type === TRIVIA_TYPES.CANDIDATES ? "candidato" : "opción"}
          </button>
        </div>
      )}

      {error && <p className="small" style={{ color: "#b46b6b", marginBottom: 12 }}>{error}</p>}

      <div className="row between mt-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear trivia"}
        </button>
      </div>
    </form>
  );
}
