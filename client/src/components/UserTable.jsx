import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const API_URL = "https://user-server-theta.vercel.app";

function UserTable() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Загрузка списка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data.users);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          handleLogout();
        } else if (error.response && error.response.status === 404) {
          handleLogout();
        } else {
          console.error("Error retrieving user data:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Периодическая проверка статуса текущего пользователя
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userData = response.data.user;
        if (userData.is_blocked) {
          alert("Your account has been blocked.");
          handleLogout();
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          handleLogout();
        } else if (error.response && error.response.status === 404) {
          alert("Your account has been deleted.");
          handleLogout();
        } else {
          console.error("Error checking user status:", error);
        }
      }
    };

    const interval = setInterval(checkUserStatus, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleSelectUser = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleBlockUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/block-user`,
        { userIds: selectedUsers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Users are blocked");
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id) ? { ...user, is_blocked: true } : user
        )
      );
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error blocking users:", error);
    }
  };

  const handleUnblockUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/unblock-user`,
        { userIds: selectedUsers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Users are unblocked");
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, is_blocked: false }
            : user
        )
      );
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error unblocking users:", error);
    }
  };

  const handleDeleteUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/delete-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          userIds: selectedUsers,
        },
      });
      alert("Users have been deleted");
      setUsers((prevUsers) =>
        prevUsers.filter((user) => !selectedUsers.includes(user.id))
      );
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error deleting users:", error);
    }
  };

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  if (!users.length) {
    return <p className="text-center">No users found</p>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const currentUser = users.find((u) => u.id === user?.userId) || {};

  return (
    <div className="container mt-5 d-flex flex-column align-items-center">
      <div className="d-flex justify-content-between w-100 mb-4">
        <h2>User Registry</h2>
        <div>
          <span className="me-3">Hi, {currentUser?.name || "User"}!</span>
          <button className="btn btn-outline-primary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="mb-3">
        <button
          className="btn btn-warning mx-1"
          onClick={handleBlockUsers}
          disabled={!selectedUsers.length}
        >
          <i className="bi bi-lock-fill"></i>
        </button>
        <button
          className="btn btn-success mx-1"
          onClick={handleUnblockUsers}
          disabled={!selectedUsers.length}
        >
          <i className="bi bi-unlock-fill"></i>
        </button>
        <button
          className="btn btn-danger mx-1"
          onClick={handleDeleteUsers}
          disabled={!selectedUsers.length}
        >
          <i className="bi bi-trash-fill"></i> Delete
        </button>
      </div>

      <div className="table-responsive w-75">
        <table className="table table-striped table-bordered text-center">
          <thead className="thead-dark">
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>E-mail</th>
              <th>Registration date</th>
              <th>Last login</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>{formatDate(user.last_login_at)}</td>
                <td>{user.is_blocked ? "Blocked" : "Active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserTable;
