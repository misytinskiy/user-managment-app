import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://user-managment-app-server.vercel.app"; // URL вашего серверного приложения

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authType, setAuthType] = useState("signIn");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (event) => {
    event.preventDefault();

    try {
      const url =
        authType === "signIn" ? `${API_URL}/login` : `${API_URL}/register`;

      const response = await axios.post(url, {
        email,
        password,
        name,
      });

      localStorage.setItem("token", response.data.token);
      setMessage(
        authType === "signIn"
          ? "Вход выполнен успешно!"
          : "Регистрация успешна!"
      );
      navigate("/users");
    } catch (error) {
      console.error("Authorization error:", error);
      setMessage(`Error: ${error.response.data.error}`);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
      <div className="w-25 d-flex flex-column align-items-center mx-auto">
        <h2>{authType === "signIn" ? "Login" : "Registration"}</h2>
        <form onSubmit={handleAuth} className="w-100">
          {authType === "signUp" && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group ">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            {authType === "signIn" ? "Login" : "Registration"}
          </button>
        </form>
        <p className="mt-3">{message}</p>
        <button
          className="btn btn-link"
          onClick={() =>
            setAuthType(authType === "signIn" ? "signUp" : "signIn")
          }
        >
          {authType === "signIn" ? "Registration" : "Login"}
        </button>
      </div>
    </div>
  );
}

export default Auth;
