import { useEffect, useState } from "react";

export function Spinner({ label }) {
  return (
    <div className="row" style={{ justifyContent: "center", padding: "48px 0", gap: 12 }}>
      <div className="spinner" />
      {label && <span className="muted small">{label}</span>}
    </div>
  );
}

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

export function useToast() {
  const [message, setMessage] = useState("");
  return {
    message,
    show: setMessage,
    clear: () => setMessage(""),
  };
}

export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(74,64,57,0.32)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 18, zIndex: 50,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", background: "var(--white)" }}
      >
        <div className="row between" style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ fontSize: 19 }}>{title}</h3>
          <button className="btn-ghost btn btn-sm" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// Carga de imagen con previsualización
export function ImageUpload({ onFile, currentUrl, label = "Imagen" }) {
  const [preview, setPreview] = useState(currentUrl || "");
  function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFile(file);
  }
  return (
    <div className="field">
      <label>{label}</label>
      <div
        style={{
          border: "1.5px dashed var(--line)", borderRadius: "var(--radius-sm)",
          padding: preview ? 0 : 22, textAlign: "center", overflow: "hidden",
          background: "var(--cream)",
        }}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
        ) : (
          <span className="muted small">Subí una imagen (JPG / PNG)</span>
        )}
      </div>
      <label className="btn btn-soft btn-sm mt-1" style={{ display: "inline-flex", marginTop: 8 }}>
        {preview ? "Cambiar imagen" : "Elegir imagen"}
        <input type="file" accept="image/*" onChange={handle} style={{ display: "none", width: 0 }} />
      </label>
    </div>
  );
}
