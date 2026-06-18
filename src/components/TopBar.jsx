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
          <span
            style={{
              width: 30, height: 30, borderRadius: 9,
              background: "linear-gradient(135deg, var(--mauve), var(--peach))",
              display: "inline-block",
            }}
          />
          <strong style={{ fontFamily: "var(--display)", fontSize: 18 }}>Trivias</strong>
        </Link>
        <div className="row" style={{ gap: 14 }}>
          <span className="muted small">{user?.name || user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Salir</button>
        </div>
      </div>
    </header>
  );
}
