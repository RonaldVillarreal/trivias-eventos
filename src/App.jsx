import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import PublicVote from "./pages/PublicVote";
import Ranking from "./pages/Ranking";

// Protege rutas del panel: si no hay sesión, manda al login
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Cargando…" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Si ya hay sesión, no mostrar el login
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Cargando…" />;
  if (user) return <Navigate to="/panel" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Zona pública de invitados: NO toca el panel ni requiere login */}
          <Route path="/votar/:triviaId" element={<PublicVote />} />
          {/* Ranking proyectable del evento: público, para las pantallas */}
          <Route path="/ranking/:eventId" element={<Ranking />} />

          {/* Zona del organizador */}
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/panel" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/panel/evento/:eventId" element={<RequireAuth><EventPage /></RequireAuth>} />

          <Route path="/" element={<Navigate to="/panel" replace />} />
          <Route path="*" element={<Navigate to="/panel" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
