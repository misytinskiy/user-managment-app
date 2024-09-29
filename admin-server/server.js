const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const app = express();

const corsOptions = {
  origin: "https://user-managment-app-tau.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const secretKey = "aVerySecretKeyThatIsHardToGuess123!@#";

app.get("/", (req, res) => {
  res.send("Server is running!");
});

const db = mysql.createPool({
  host: "35.223.135.12",
  user: "root",
  password: "260199den",
  database: "database1",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "260199den",
//   database: "user_management",
// });
db.query("SELECT 1")
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Error connecting to the database:", err));

// Создание таблицы пользователей при инициализации сервера, если её ещё нет
db.query(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE
  )
`
).catch((err) => console.error("Ошибка при создании таблицы:", err));

// Middleware для проверки JWT и блокировки
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, secretKey, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    try {
      const [rows] = await db.query(
        "SELECT is_blocked FROM users WHERE id = ?",
        [user.uid]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      if (rows[0].is_blocked) {
        return res.status(403).json({ message: "User blocked" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Error checking lock:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
};

// Маршрут для регистрации пользователей
app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Вставляем нового пользователя в базу данных
    const [result] = await db.query(
      `
      INSERT INTO users (email, name, password)
      VALUES (?, ?, ?)
    `,
      [email, name, hashedPassword]
    );

    const userId = result.insertId;

    // Создаем JWT токен
    const token = jwt.sign({ uid: userId, email }, secretKey);

    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({ error: "Error while registering user" });
  }
});

// Маршрут для логина пользователей
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [rows] = await db.query(`SELECT * FROM users WHERE email = ?`, [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    // Проверяем, не заблокирован ли пользователь
    if (user.is_blocked) {
      return res.status(403).json({ error: "User blocked" });
    }

    // Создаем JWT токен
    const token = jwt.sign({ uid: user.id, email }, secretKey);

    // Обновляем время последнего входа
    await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [
      user.id,
    ]);

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Error logging in user" });
  }
});

// Маршрут для получения списка пользователей
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, email, name, created_at, last_login_at, is_blocked FROM users
    `);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error getting list of users:", error);
    res.status(500).json({ error: "Error getting users" });
  }
});

// Маршрут для проверки текущего пользователя
app.get("/user", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.user.uid,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error checking user:", error);
    res.status(500).json({ error: "Error checking user" });
  }
});

// Маршрут для блокировки пользователей
app.post("/block-user", authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: "Incorrect data" });
  }

  try {
    const [result] = await db.query(
      `UPDATE users SET is_blocked = TRUE WHERE id IN (?)`,
      [userIds]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Users are blocked" });
    } else {
      res.status(404).json({ message: "No users found" });
    }
  } catch (error) {
    console.error("Error blocking users:", error);
    res.status(500).json({ error: "Error blocking users" });
  }
});

// Маршрут для разблокировки пользователей
app.post("/unblock-user", authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: "Incorrect data" });
  }

  try {
    await db.query(`UPDATE users SET is_blocked = FALSE WHERE id IN (?)`, [
      userIds,
    ]);

    res.status(200).json({ message: "Users are unblocked" });
  } catch (error) {
    console.error("Error unblocking users:", error);
    res.status(500).json({ error: "Error unblocking users" });
  }
});

// Маршрут для удаления пользователей
app.delete("/delete-user", authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: "Incorrect data" });
  }

  try {
    await db.query(`DELETE FROM users WHERE id IN (?)`, [userIds]);

    res.status(200).json({ message: "Users have been deleted" });
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({ error: "Error deleting users" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`The server is running on port ${PORT}`);
});
