import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopBar() {
  const { user, signOut } = useAuth();
  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background: "var(--cream)",
        position: "sticky", top: 0, zIndex: 20,
      }}
    >
      <div className="container row between" style={{ height: 64 }}>
        <Link to="/panel" className="row" style={{ gap: 10 }}>
          <img
            src="/logo-bloom-horizontal.jpeg"
            alt="Bloom Trivias"
            style={{ height: 38, width: "auto", display: "block" }}
          />
        </Link>
        <div className="row" style={{ gap: 14 }}>
          <span className="muted small">{user?.name || user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Salir</button>
        </div>
      </div>
    </header>
  );
}
