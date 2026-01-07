import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { db } from "../db.js";

const router = Router();

const isAdmin = async (email) => {
  try {
    const [rows] = await db.query("select 1 from admins WHERE EMAIL = ?", [email]);
    return rows.length > 0;
  } catch (e) {
    console.error(e);
    return false;
  }
};

router.get("/allAdmins", verifyToken, async (req, res) => {
  const isUserAdmin = await isAdmin(req.user.userEmail);
  if (!isUserAdmin) {
    return res.status(403).json({ message: "You are not an admin" });
  }
  const [admins] = await db.query("SELECT EMAIL as email, created_at FROM admins ORDER BY created_at ASC");
  return res.status(200).json(admins);
});

router.post("/addAdmin", verifyToken, async (req, res) => {
  const { addEmail } = req.body;
  const isUserAdmin = await isAdmin(req.user.userEmail);
  if (!isUserAdmin) {
    return res.status(403).json({ message: "You are not an admin" });
  }
  try {
    await db.query("INSERT INTO admins (email) VALUES (?)", [addEmail]);
    return res.status(200).json({ message: "Admin added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add admin" });
  }
});

router.post("/deleteAdmin", verifyToken, async (req, res) => {
  const { deleteEmail } = req.body;
  const isUserAdmin = await isAdmin(req.user.userEmail);
  if (!isUserAdmin) {
    return res.status(403).json({ message: "You are not an admin" });
  }

  if (deleteEmail.trim().toLowerCase() === req.user.userEmail.trim().toLowerCase()) {
    return res.status(400).json({ message: "You cannot remove yourself as an admin." });
  }
  try {
    const [result] = await db.query("DELETE FROM admins WHERE EMAIL=?", [deleteEmail]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

const logAction = async (userEmail, action, details) => {
  try {
    await db.query("INSERT INTO audit_logs (user_email, action, details) VALUES (?, ?, ?)", [userEmail, action, details]);
  } catch (err) {
    console.error("Failed to log action:", err);
  }
};

router.get("/logs", verifyToken, async (req, res) => {
  const email = req.user.userEmail;
  const isUserAdmin = await isAdmin(email);
  if (!isUserAdmin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [logs] = await db.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?", [limit, offset]);
    const [countResult] = await db.query("SELECT COUNT(*) as count FROM audit_logs");
    const totalLogs = countResult[0].count;

    return res.json({
      logs,
      total: totalLogs,
      page,
      totalPages: Math.ceil(totalLogs / limit)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
});

router.post("/deleteAll", verifyToken, async (req, res) => {
  const email = req.user.userEmail;
  const isUserAdmin = await isAdmin(email);
  if (!isUserAdmin) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    await db.query("DELETE FROM publications");
    await logAction(email, "DELETE_ALL", "Deleted all publications");
    return res.status(200).json({ message: "All publications deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete all" });
  }
});

export default router;
