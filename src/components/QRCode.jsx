import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

// Genera un QR (como imagen) a partir de un texto/URL, con opción de descarga.
export default function QRCode({ value, size = 200, fileName = "qr-bloom" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    QRCodeLib.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#2a2230", light: "#ffffff" },
    })
      .then((u) => { if (active) setUrl(u); })
      .catch(() => { if (active) setUrl(""); });
    return () => { active = false; };
  }, [value, size]);

  if (!url) return null;

  return (
    <div className="center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <img src={url} alt="Código QR" width={size} height={size} style={{ borderRadius: 12, border: "1px solid var(--line)" }} />
      <a className="btn btn-soft btn-sm" href={url} download={`${fileName}.png`}>Descargar QR</a>
    </div>
  );
}
