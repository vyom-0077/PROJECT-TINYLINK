const express = require("express");
// const bodyParser = require('body-parser');
const cors = require("cors");
// const { version } = require("react");
const app = express();

const PORT = process.env.PORT || 3001;

require("dotenv").config();

const { pool } = require("./db");

app.use(
  cors({
    // bodyParser = require('body-parser');
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/healthz", (req, res) => {
  res.status(200).json({
    ok: true,
    version: "1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// URRLL Validation

const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
};

//for validation formaat of code
const isValidCode = (code) => /^[A-Za-z0-9]{6,8}$/.test(code);

const generateCode = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code =
      code + characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

app.post("/api/links", async (req, res) => {
  try {
    const { target_url, code } = req.body;

    if (!target_url || !isValidUrl(target_url)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    let shortCode = code;

    if (shortCode) {
      console.log("Custom code provided:", shortCode);

      if (!isValidCode(shortCode)) {
        return res.status(400).json({
          error: "Code must be 6-8 characters (letters and numbers only)",
        });
      }

      const existingLink = await pool.query(
        "SELECT code FROM links WHERE code = $1",
        [shortCode]
      );

      if (existingLink.rows.length > 0) {
        return res.status(409).json({ error: "Code already exists" });
      }

      console.log(" Using custom code:", shortCode);
    } else {
      console.log(" Generating random code");

      let attempts = 0;
      do {
        shortCode = generateCode();
        const existingLink = await pool.query(
          "SELECT code FROM links WHERE code = $1",
          [shortCode]
        );
        if (existingLink.rows.length === 0) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        return res.status(500).json({
          error: "Could not generate unique code. Please try again.",
        });
      }

      console.log(" Generated random code:", shortCode);
    }

    console.log("Saving the code:", shortCode);

    const result = await pool.query(
      `INSERT INTO links (code, target_url, total_clicks, created_at) 
       VALUES ($1, $2, 0, NOW()) 
       RETURNING *`,
      [shortCode, target_url]
    );

    console.log("✅ Link created successfully");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating link:", error);

    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/links", async (req, res) => {
  // for listing all Links
  try {
    const result = await pool.query(
      "SELECT * FROM links ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/links/:code", async (req, res) => {
  // for getting a single link by code
  try {
    const { code } = req.params;
    const result = await pool.query("SELECT * FROM  links WHERE code = $1", [
      code,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching link:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/links/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      "DELETE FROM links WHERE code = $1 RETURNING *",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.json({ message: "Link deleted successfully", link: result.rows[0] });
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/:code", async (req, res) => {
  // Redirect to target URL
  try {
    const { code } = req.params;
    const result = await pool.query("SELECT * FROM links WHERE code = $1", [
      code,
    ]);

    if (code === "api" || code === "healthz") {
      return res.status(404).json({ error: "Not found" });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    const link = result.rows[0];

    await pool.query(
      `UPDATE links
      SET total_clicks = total_clicks + 1,
          last_clicked = NOW()
      WHERE code = $1`,
      [code]
    );

    return res.redirect(302, link.target_url);
  } catch (error) {
    console.error("Error redirecting to link:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
