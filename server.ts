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

let pool: mysql.Pool | null = null;
let memoryStore: Record<string, any> = {};

async function initDb() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log("Connecting to MySQL database...");

    // Test connection
    const conn = await pool.getConnection();
    console.log("Database connection successful");
    
    // Create table for app state if it doesn't exist
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS app_state (
        id VARCHAR(50) PRIMARY KEY,
        data LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    conn.release();
  } catch (error) {
    console.error("Database initialization failed (using memory fallback):", error);
    pool = null;
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: !!pool ? "connected" : "memory" });
});

app.get("/api/data", async (req, res) => {
  try {
    if (pool) {
      const [rows]: any = await pool.execute("SELECT data FROM app_state WHERE id = 'main'");
      if (rows.length > 0) {
        return res.json(JSON.parse(rows[0].data));
      }
      return res.json({});
    } else {
      // Fallback
      return res.json(memoryStore['main'] || {});
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post("/api/data", async (req, res) => {
  try {
    if (pool) {
      const dataString = JSON.stringify(req.body);
      await pool.execute(
        "INSERT INTO app_state (id, data) VALUES ('main', ?) ON DUPLICATE KEY UPDATE data = ?",
        [dataString, dataString]
      );
    } else {
      // Fallback
      memoryStore['main'] = req.body;
    }
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
    // Determine static path robustly
    // When running from dist/server.cjs, __dirname is the dist folder
    const distPath = __dirname;
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Check if file exists to prevent loops
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
