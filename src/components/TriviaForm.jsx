import { useState } from "react";
import { TRIVIA_TYPES, TRIVIA_TYPE_LABELS } from "../lib/config";
import { createTrivia, createOption, uploadImage } from "../lib/api";
import { ImageUpload } from "./ui.jsx";

const TYPE_HINT = {
  [TRIVIA_TYPES.CANDIDATES]: "Los invitados eligen a una persona. Cargá cada candidato con su foto.",
  [TRIVIA_TYPES.MULTIPLE]: "Una pregunta con varias respuestas posibles. Los invitados eligen una.",
  [TRIVIA_TYPES.OPEN]: "Una pregunta abierta. Los invitados escriben su respuesta libremente.",
};

export default function TriviaForm({ eventId, ownerId, onCreated, onCancel }) {
  const [type, setType] = useState(TRIVIA_TYPES.CANDIDATES);
  const [title, setTitle] = useState("");
  const [publicName, setPublicName] = useState("");
  const [question, setQuestion] = useState("");
  const [coverFile, setCoverFile] = useState(null);
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
    if (usesOptions) {
      const valid = options.filter((o) => o.label.trim());
      if (valid.length < 2) { setError("Agregá al menos dos opciones."); return; }
    }
    setBusy(true);
    try {
      let coverFileId = "";
      if (coverFile) coverFileId = await uploadImage(coverFile, ownerId);

      const trivia = await createTrivia({
        eventId, ownerId, type,
        title: title.trim(),
        publicName: publicName.trim() || title.trim(),
        question: question.trim(),
        coverFileId,
      });

      if (usesOptions) {
        for (const opt of options.filter((o) => o.label.trim())) {
          let imageFileId = "";
          if (opt.file) imageFileId = await uploadImage(opt.file, ownerId);
          await createOption({ triviaId: trivia.$id, ownerId, label: opt.label.trim(), imageFileId });
        }
      }
      onCreated();
    } catch (err) {
      setError(err?.message || "No se pudo crear la trivia.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label>Tipo de trivia</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {Object.values(TRIVIA_TYPES).map((t) => (
            <option key={t} value={t}>{TRIVIA_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <p className="muted small mt-1">{TYPE_HINT[type]}</p>
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

      <ImageUpload label="Imagen de portada" onFile={setCoverFile} />

      {usesOptions && (
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
        <button type="submit" className="btn" disabled={busy}>{busy ? "Guardando…" : "Crear trivia"}</button>
      </div>
    </form>
  );
}
