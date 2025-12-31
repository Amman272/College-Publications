import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { db } from "../db.js";

const router = Router();

const isAdmin = (email) => {
  const row = db.prepare("select 1 from admins WHERE EMAIL = ? COLLATE NOCASE").get(email);
  return !!row;
};

router.get("/allAdmins", verifyToken, (req, res) => {
  if (!isAdmin(req.user.userEmail)) {
    return res.status(403).json({ message: "You are not an admin" });
  }
  const admins = db
    .prepare("SELECT EMAIL as email, created_at FROM admins ORDER BY created_at ASC")
    .all();
  return res.status(200).json(admins);
});

router.post("/addAdmin", verifyToken, (req, res) => {
  const { addEmail } = req.body;
  if (!isAdmin(req.user.userEmail)) {
    return res.status(403).json({ message: "You are not an admin" });
  }
  try {
    db.prepare("INSERT INTO admins (email) VALUES (?)").run(addEmail);
    return res.status(200).json({ message: "Admin added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add admin" });
  }
});

router.post("/deleteAdmin", verifyToken, (req, res) => {
  const { deleteEmail } = req.body;
  if (!isAdmin(req.user.userEmail)) {
    return res.status(403).json({ message: "You are not an admin" });
  }

  if (deleteEmail.trim().toLowerCase() === req.user.userEmail.trim().toLowerCase()) {
    return res.status(400).json({ message: "You cannot remove yourself as an admin." });
  }
  try {
    const info = db.prepare("DELETE FROM admins WHERE EMAIL=? COLLATE NOCASE").run(deleteEmail);
    if (info.changes === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

const logAction = (userEmail, action, details) => {
  try {
    db.prepare("INSERT INTO audit_logs (user_email, action, details) VALUES (?, ?, ?)").run(userEmail, action, details);
  } catch (err) {
    console.error("Failed to log action:", err);
  }
};

router.get("/logs", verifyToken, (req, res) => {
  const email = req.user.userEmail;
  if (!isAdmin(email)) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?").all(limit, offset);
    const countResult = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get();
    const totalLogs = countResult.count;
    
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

router.post("/deleteAll", verifyToken, (req, res) => {
  const email = req.user.userEmail;
  if (!isAdmin(email)) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    db.prepare("DELETE FROM publications").run();
    logAction(email, "DELETE_ALL", "Deleted all publications");
    return res.status(200).json({ message: "All publications deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete all" });
  }
});

export default router;
