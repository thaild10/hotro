import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import multer from "multer";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // MySQL Connection Pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Initialize Tables
  try {
    const conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id VARCHAR(255) PRIMARY KEY,
        value LONGTEXT
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    // Seed an admin user if not exists
    const [users]: any = await conn.query('SELECT * FROM app_users WHERE username = ?', ['admin']);
    if (users.length === 0) {
      await conn.query('INSERT INTO app_users (username, password) VALUES (?, ?)', ['admin', 'admin123']);
    }
    conn.release();
    console.log("Database initialized");
  } catch (err) {
    console.error("Database init error:", err);
  }

  // Multer for Uploads
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // API Routes
  app.post("/api/verify-password", async (req, res) => {
    const { username, password } = req.body;
    try {
      const [rows]: any = await pool.query('SELECT * FROM app_users WHERE username = ? AND password = ?', [username, password]);
      if (rows.length > 0) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false });
      }
    } catch (err) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/users/sync", async (req, res) => {
    // Sync users from appData to app_users table
    const { users } = req.body; 
    if (!Array.isArray(users)) return res.status(400).send("Invalid input");
    
    try {
      const conn = await pool.getConnection();
      await conn.beginTransaction();
      
      // For each user, if they have a password, ensure they are in app_users
      for (const user of users) {
        if (user.username && user.password) {
          await conn.query(`
            INSERT INTO app_users (username, password) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE password = ?
          `, [user.username, user.password, user.password]);
        }
      }
      
      await conn.commit();
      conn.release();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Sync error" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const [rows]: any = await pool.query('SELECT * FROM app_users WHERE username = ? AND password = ?', [username, password]);
      if (rows.length > 0) {
        res.json({ success: true, username: rows[0].username });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  app.get("/api/data/get", async (req, res) => {
    try {
      const [rows]: any = await pool.query('SELECT value FROM app_settings WHERE id = ?', ['shared_kanban']);
      if (rows.length > 0) {
        res.json(JSON.parse(rows[0].value));
      } else {
        res.json(null);
      }
    } catch (err) {
      res.status(500).json({ error: "Fetch error" });
    }
  });

  app.post("/api/data/save", async (req, res) => {
    try {
      const data = JSON.stringify(req.body);
      await pool.query('INSERT INTO app_settings (id, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?', ['shared_kanban', data, data]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Save error" });
    }
  });

  app.post("/api/upload", upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Serve uploads
  app.use('/uploads', express.static(uploadDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
