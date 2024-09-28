import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { jwtDecode as jwt_decode } from "jwt-decode";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decoded = jwt_decode(token);
      setUser({ token, userId: decoded.uid });
    } else {
      setUser(null);
      navigate("/login");
    }

    setLoading(false);
  }, [navigate]);

  return { user, loading };
}
