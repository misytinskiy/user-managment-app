import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://user-managment-app-server.vercel.app"; // URL вашего серверного приложения

export function useBlockWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Запрос для проверки текущего статуса пользователя
        const response = await axios.get(`${API_URL}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data.user;

        if (userData.is_blocked) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          console.error("Error checking user status:", error);
        }
      }
    };

    checkUserStatus(); // Проверяем статус при каждом рендере компонента

    const interval = setInterval(checkUserStatus, 5000); // Проверяем каждые 5 секунд

    return () => clearInterval(interval); // Очищаем интервал при размонтировании
  }, [navigate]);
}
