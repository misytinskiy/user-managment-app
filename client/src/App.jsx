import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import UserTable from "./components/UserTable";
import Auth from "./components/Auth";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Auth /> : <Navigate to="/users" />}
      />
      <Route
        path="/users"
        element={user ? <UserTable /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
