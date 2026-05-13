import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "50mb" }));

// DB Config
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "chamdavn6a04_hotro",
  password: process.env.DB_PASS || "2rPDaTfwPeg3qkkp8CJg",
  database: process.env.DB_NAME || "chamdavn6a04_hotro",
};

let pool: mysql.Pool;

async function initDb() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log("Connected to MySQL database");

    // Create table for app state if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS app_state (
        id VARCHAR(50) PRIMARY KEY,
        data LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

// API Routes
app.get("/api/data", async (req, res) => {
  try {
    const [rows]: any = await pool.execute("SELECT data FROM app_state WHERE id = 'main'");
    if (rows.length > 0) {
      res.json(JSON.parse(rows[0].data));
    } else {
      res.json({});
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post("/api/data", async (req, res) => {
  try {
    const dataString = JSON.stringify(req.body);
    await pool.execute(
      "INSERT INTO app_state (id, data) VALUES ('main', ?) ON DUPLICATE KEY UPDATE data = ?",
      [dataString, dataString]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

async function startServer() {
  await initDb();

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
