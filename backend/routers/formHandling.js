import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { db } from "../db.js";
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const adminEmails = ["ammanfawaz272@gmail.com"];

//const isAdmin = (email) => adminEmails.includes(email);
const isAdmin = (email) => {
  const user = db.prepare("select 1 from admins WHERE email = ?").get(email);
  return !!user;
};

router.post("/isAdmin", verifyToken,(req,res)=>{
  const email = req.user.userEmail;
   const user = db.prepare("select 1 from admins WHERE email = ?").get(email);
   return res.status(200).json({isAdmin: !!user });
});

router.post("/formEntry", verifyToken, (req, res) => {
  const {
    mainAuthor,
    title,
    email,
    phone,
    dept,
    coauthors,
    journal,
    publisher,
    year,
    vol,
    issueNo,
    pages,
    indexation,
    pdfUrl,
  } = req.body;

  try {
    db.prepare(
      `INSERT INTO publications 
  (mainAuthor, title, email, phone, dept, coauthors, journal, publisher, year, vol, issueNo, pages, indexation, pdfUrl)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      mainAuthor,
      title,
      email,
      phone,
      dept,
      coauthors,
      journal,
      publisher,
      year,
      vol,
      issueNo,
      pages,
      indexation,
      pdfUrl
    );
    return res.status(200).json({ message: "data stored suceessfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/formEntryBatchUpdate", verifyToken, (req, res) => {
  // Batch update usually for admin or massive changes, strictly restrict or keep as is?
  // User didn't specify batch update rules, but implied admin access allows editing ANY entry.
  // For now I will assume this is an admin-only or specific feature.
  // As per instructions "users can edit only their entry", batch update makes it hard to enforce "only their entry" unless we check every single one.
  // I will leave it but add admin check if feasible, or just leave as is if it's used for bulk import corrections.
  // Actually, let's restrict to Admin for safety if this is "Bulk Import" related fix.
  // But wait, user said "add a admin acesss acount whihc allows any entry to be deleted and eddited".

  if (!isAdmin(req.user.userEmail)) {
    return res
      .status(403)
      .json({ message: "Only admins can perform batch updates." });
  }

  const updates = req.body; // expecting array of updates

  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: "Array expected" });
  }

  try {
    // 1. Prepare update statement
    const stmt = db.prepare(`
      UPDATE publications
      SET 
        mainAuthor = COALESCE(?, mainAuthor),
        title = COALESCE(?, title),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        dept = COALESCE(?, dept),
        coauthors = COALESCE(?, coauthors),
        journal = COALESCE(?, journal),
        publisher = COALESCE(?, publisher),
        year = COALESCE(?, year),
        vol = COALESCE(?, vol),
        issueNo = COALESCE(?, issueNo),
        pages = COALESCE(?, pages),
        indexation = COALESCE(?, indexation),
        pdfUrl = COALESCE(?, pdfUrl)
      WHERE id = ?
    `);

    // 2. Transaction function
    const updateMany = db.transaction((rows) => {
      for (const row of rows) {
        stmt.run(
          row.mainAuthor ?? null,
          row.title ?? null,
          row.email ?? null,
          row.phone ?? null,
          row.dept ?? null,
          row.coauthors ?? null,
          row.journal ?? null,
          row.publisher ?? null,
          row.year ?? null,
          row.vol ?? null,
          row.issueNo ?? null,
          row.pages ?? null,
          row.indexation ?? null,
          row.pdfUrl ?? null,
          row.id
        );
      }
    });

    // 3. Execute updates
    updateMany(updates);

    return res
      .status(200)
      .json({ message: "Batch update successful", count: updates.length });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Batch update failed" });
  }
});

router.put("/formEntryUpdate", verifyToken, (req, res) => {
  const {
    id,
    mainAuthor,
    title,
    email,
    phone,
    dept,
    coauthors,
    journal,
    publisher,
    year,
    vol,
    issueNo,
    pages,
    indexation,
    pdfUrl,
  } = req.body;

  const userEmail = req.user.userEmail;

  try {
    // Check ownership or admin
    const entry = db
      .prepare("SELECT email FROM publications WHERE id = ?")
      .get(id);

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    if (entry.email !== userEmail && !isAdmin(userEmail)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this entry" });
    }

    const info = db
      .prepare(
        `UPDATE publications 
      SET mainAuthor = ?, title = ?, email = ?, phone = ?, dept = ?, coauthors = ?, journal = ?, publisher = ?, year = ?, vol = ?, issueNo = ?, pages = ?, indexation = ?, pdfUrl = ?
      WHERE id = ?`
      )
      .run(
        mainAuthor,
        title,
        email,
        phone,
        dept,
        coauthors,
        journal,
        publisher,
        year,
        vol,
        issueNo,
        pages,
        indexation,
        pdfUrl,
        id
      );

    return res.status(200).json({ message: "Data updated successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/deleteEntry/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.userEmail;
console.log(userEmail);
  try {
    // 1. Check ownership
    const entry = db
      .prepare("SELECT email FROM publications WHERE id = ?")
      .get(id);

    if (!entry) {
      return res.status(404).json({ message: "Publication not found" });
    }

    if (entry.email !== userEmail && !isAdmin(userEmail)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this entry" });
    }

    // 2. Delete
    const info = db.prepare("DELETE FROM publications WHERE id = ?").run(id);

    return res
      .status(200)
      .json({ message: "Publication deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/formGet", (req, res) => {
  try {
    const rows = db.prepare("select * from publications").all();
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: "error reading database" });
  }
});

router.get("/downloadExcel", async (req, res) => {
  try {
    // Fetch all rows
    const rows = db.prepare("SELECT * FROM publications").all();

    // Create workbook + sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Publications");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Main Author", key: "mainAuthor", width: 20 },
      { header: "Title", key: "title", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Dept", key: "dept", width: 15 },
      { header: "Coauthors", key: "coauthors", width: 25 },
      { header: "Journal", key: "journal", width: 20 },
      { header: "Publisher", key: "publisher", width: 20 },
      { header: "Year", key: "year", width: 10 },
      { header: "Volume", key: "vol", width: 10 },
      { header: "Issue No", key: "issueNo", width: 10 },
      { header: "Pages", key: "pages", width: 15 },
      { header: "Indexation", key: "indexation", width: 20 },
      { header: "PDF URL", key: "pdfUrl", width: 40 },
    ];

    // ⭐ Add header styling
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" }, // Green background
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Add rows to sheet
    rows.forEach((row) => worksheet.addRow(row));

    // Response headers for browser download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=publications.xlsx"
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
    console.log("done");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to generate Excel file" });
  }
});

router.get("/downloadTemplate", (req, res) => {
  try {
    // Adjust path to go up one level from 'routers' to 'backend', then into 'template'
    const file = path.join(__dirname, "..", "template", "publications.xlsx");
    res.download(file, "publications_template.xlsx", (err) => {
      if (err) {
        console.error("Error downloading template:", err);
        res.status(500).json({ message: "Could not download template" });
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
