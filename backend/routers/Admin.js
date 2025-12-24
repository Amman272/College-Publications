import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { db } from "../db.js";

const router = Router();

const isAdmin = (email) => {
  const row = db.prepare("select 1 from admins WHERE email = ?").get(email);
  return !!row;
};

router.get("/allAdmins", verifyToken, (req, res) => {
  if (!isAdmin(req.user.userEmail)) {
    return res.status(403).json({ message: "You are not an admin" });
  }
  const admins = db
    .prepare("SELECT email, created_at FROM admins ORDER BY created_at ASC")
    .all();
  return res.status(200).json(admins);
});

router.post("/addAdmin", verifyToken, (req, res) => {
  const { addEmail } = req.body;
  if (!isAdmin(req.user.userEmail)) {
    return res.status(403).json({ message: "You are not an admin" });
  }
  try {
    db.prepare("INSERT INTO admins (EMAIL) VALUES (?)").run(addEmail);
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
  try {
    const info = db.prepare("DELETE FROM admins WHERE email=?").run(deleteEmail);
    if (info.changes === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});
