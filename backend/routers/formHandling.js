import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireAnyAdmin, isSuperAdmin } from "../middleware/authorization.js";
import { db } from "../db.js";
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { logAction } from "../utils/logger.js";
import Joi from 'joi';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Allowed departments ──
const ALLOWED_DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML', 'CSD', 'CSM', 'FED', 'MBA'];

// ── Joi validation schema for Journal Publications ──
const journalSchema = Joi.object({
  mainAuthor: Joi.string().min(1).max(255).required().messages({ 'any.required': 'Main Author is required' }),
  email: Joi.string().email().required().messages({ 'string.email': 'Please provide a valid email address', 'any.required': 'Email is required' }),
  phone: Joi.string().allow('', null).optional(),
  department: Joi.string().valid(...ALLOWED_DEPARTMENTS).required().messages({
    'any.only': `Department must be one of: ${ALLOWED_DEPARTMENTS.join(', ')}`,
    'any.required': 'Department is required'
  }),
  designation: Joi.string().allow('', null).optional(),
  caste: Joi.string().allow('', null).optional(),
  coAuthors: Joi.string().allow('', null).optional(),
  title: Joi.string().min(1).max(1000).required().messages({ 'any.required': 'Title is required' }),
  journal: Joi.string().min(1).max(500).required().messages({ 'any.required': 'Journal name is required' }),
  publisher: Joi.string().allow('', null).optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required().messages({ 'any.required': 'Year is required' }),
  volume: Joi.string().allow('', null).optional(),
  issueNumber: Joi.string().allow('', null).optional(),
  pages: Joi.string().allow('', null).optional(),
  indexation: Joi.string().allow('', null).optional(),
  issnNumber: Joi.string().allow('', null).optional(),
  ugcApproved: Joi.string().valid('Yes', 'No', '').allow(null).optional(),
  impactFactor: Joi.number().min(0).allow(null).optional(),
  journalLink: Joi.string().uri().allow('', null).optional(),
  articleLink: Joi.string().uri().allow('', null).optional(),
}).options({ stripUnknown: true });

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message).join('; ');
    return res.status(400).json({ message: messages });
  }
  req.validatedBody = value;
  next();
};

// ── POST /form/formEntry — Add single journal publication ──
router.post("/formEntry", verifyToken, requireAnyAdmin, async (req, res) => {
  const { error, value: validatedData } = journalSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message).join('; ');
    return res.status(400).json({ message: messages });
  }

  const {
    mainAuthor, email, phone, department, designation, caste,
    coAuthors, title, journal, publisher, year, volume,
    issueNumber, pages, indexation, issnNumber, ugcApproved,
    impactFactor, journalLink, articleLink
  } = validatedData;

  // Check department access for sub-admins
  if (req.user.role === 'sub_admin' && department !== req.user.department) {
    return res.status(403).json({ message: `You can only add publications for your department (${req.user.department})` });
  }

  try {
    // Duplicate check: issnNumber + email
    if (issnNumber) {
      const [existingRows] = await db.query(
        "SELECT 1 FROM journals WHERE issnNumber = ? AND email = ?",
        [issnNumber, email]
      );
      if (existingRows.length > 0) {
        return res.status(409).json({ message: "Duplicate entry: A publication with this ISSN and email already exists." });
      }
    }

    await db.query(
      `INSERT INTO journals 
       (mainAuthor, email, phone, department, designation, caste, coAuthors, title, journal,
        publisher, year, volume, issueNumber, pages, indexation, issnNumber, ugcApproved,
        impactFactor, journalLink, articleLink)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mainAuthor, email, phone || null, department, designation || null, caste || null,
        coAuthors || null, title, journal, publisher || null, year, volume || null,
        issueNumber || null, pages || null, indexation || null, issnNumber || null,
        ugcApproved || null, impactFactor || null, journalLink || null, articleLink || null
      ]
    );

    await logAction(req.user.userEmail, "CREATE", `Created journal publication: ${title}`);
    return res.status(200).json({ message: "Journal publication submitted successfully" });
  } catch (e) {
    console.error('❌ Error in /formEntry:', e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /form/bulkImport ──
router.post("/bulkImport", verifyToken, requireAnyAdmin, async (req, res) => {
  const entries = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: "Array of journal entries required" });
  }

  const results = { successful: [], failed: [], total: entries.length };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const rowNumber = i + 2;
    const { mainAuthor, email, phone, department, designation, caste, coAuthors, title,
      journal, publisher, year, volume, issueNumber, pages, indexation, issnNumber,
      ugcApproved, impactFactor, journalLink, articleLink } = entry;

    try {
      if (!email || !mainAuthor || !department || !title || !journal || !year) {
        throw new Error("Missing required fields: email, mainAuthor, department, title, journal, year");
      }
      if (req.user.role === 'sub_admin' && department !== req.user.department) {
        throw new Error(`You can only add publications for your department (${req.user.department})`);
      }
      if (issnNumber) {
        const [existingRows] = await db.query(
          "SELECT 1 FROM journals WHERE issnNumber = ? AND email = ?", [issnNumber, email]
        );
        if (existingRows.length > 0) throw new Error("Duplicate entry: This publication already exists for this email");
      }

      await db.query(
        `INSERT INTO journals 
         (mainAuthor, email, phone, department, designation, caste, coAuthors, title, journal,
          publisher, year, volume, issueNumber, pages, indexation, issnNumber, ugcApproved,
          impactFactor, journalLink, articleLink)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mainAuthor, email, phone || null, department, designation || null, caste || null,
          coAuthors || null, title, journal, publisher || null, year, volume || null,
          issueNumber || null, pages || null, indexation || null, issnNumber || null,
          ugcApproved || null, impactFactor || null, journalLink || null, articleLink || null
        ]
      );
      results.successful.push({ rowNumber, title });
    } catch (err) {
      results.failed.push({ rowNumber, title: title || 'N/A', error: err.message });
    }
  }

  await logAction(req.user.userEmail, "BULK_IMPORT",
    `Bulk import: ${results.successful.length} successful, ${results.failed.length} failed`);
  return res.status(200).json({ message: "Bulk import completed", ...results });
});

// ── PUT /form/formEntryUpdate ──
router.put("/formEntryUpdate", verifyToken, requireAnyAdmin, async (req, res) => {
  const { id, mainAuthor, email, phone, department, designation, caste, coAuthors, title,
    journal, publisher, year, volume, issueNumber, pages, indexation, issnNumber,
    ugcApproved, impactFactor, journalLink, articleLink } = req.body;

  try {
    const [rows] = await db.query("SELECT email, department FROM journals WHERE id = ?", [id]);
    const entry = rows[0];
    if (!entry) return res.status(404).json({ message: "Journal publication not found" });

    if (req.user.role === 'sub_admin' && entry.department !== req.user.department) {
      return res.status(403).json({ message: `You can only edit publications from your department (${req.user.department})` });
    }

    await db.query(
      `UPDATE journals SET
        mainAuthor = COALESCE(?, mainAuthor), email = COALESCE(?, email),
        phone = COALESCE(?, phone), department = COALESCE(?, department),
        designation = COALESCE(?, designation), caste = COALESCE(?, caste),
        coAuthors = COALESCE(?, coAuthors), title = COALESCE(?, title),
        journal = COALESCE(?, journal), publisher = COALESCE(?, publisher),
        year = COALESCE(?, year), volume = COALESCE(?, volume),
        issueNumber = COALESCE(?, issueNumber), pages = COALESCE(?, pages),
        indexation = COALESCE(?, indexation), issnNumber = COALESCE(?, issnNumber),
        ugcApproved = COALESCE(?, ugcApproved), impactFactor = COALESCE(?, impactFactor),
        journalLink = COALESCE(?, journalLink), articleLink = COALESCE(?, articleLink)
       WHERE id = ?`,
      [
        mainAuthor ?? null, email ?? null, phone ?? null, department ?? null,
        designation ?? null, caste ?? null, coAuthors ?? null, title ?? null,
        journal ?? null, publisher ?? null, year ?? null, volume ?? null,
        issueNumber ?? null, pages ?? null, indexation ?? null, issnNumber ?? null,
        ugcApproved ?? null, impactFactor ?? null, journalLink ?? null, articleLink ?? null, id
      ]
    );

    await logAction(req.user.userEmail, "UPDATE", `Updated journal publication ID: ${id} - ${title}`);
    return res.status(200).json({ message: "Journal publication updated successfully" });
  } catch (e) {
    console.error("Update error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /form/formEntryBatchUpdate ──
router.put("/formEntryBatchUpdate", verifyToken, requireAnyAdmin, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Only super admins can perform batch updates." });
  }
  const updates = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ message: "Array expected" });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const successful = [], rejected = [];

    for (const row of updates) {
      const [existing] = await connection.query("SELECT id FROM journals WHERE id = ?", [row.id]);
      if (!existing || existing.length === 0) {
        rejected.push({ id: row.id, reason: "Entry not found" });
        continue;
      }
      await connection.query(
        `UPDATE journals SET
          mainAuthor = COALESCE(?, mainAuthor), email = COALESCE(?, email),
          phone = COALESCE(?, phone), department = COALESCE(?, department),
          designation = COALESCE(?, designation), caste = COALESCE(?, caste),
          coAuthors = COALESCE(?, coAuthors), title = COALESCE(?, title),
          journal = COALESCE(?, journal), publisher = COALESCE(?, publisher),
          year = COALESCE(?, year), volume = COALESCE(?, volume),
          issueNumber = COALESCE(?, issueNumber), pages = COALESCE(?, pages),
          indexation = COALESCE(?, indexation), issnNumber = COALESCE(?, issnNumber),
          ugcApproved = COALESCE(?, ugcApproved), impactFactor = COALESCE(?, impactFactor),
          journalLink = COALESCE(?, journalLink), articleLink = COALESCE(?, articleLink)
         WHERE id = ?`,
        [
          row.mainAuthor ?? null, row.email ?? null, row.phone ?? null, row.department ?? null,
          row.designation ?? null, row.caste ?? null, row.coAuthors ?? null, row.title ?? null,
          row.journal ?? null, row.publisher ?? null, row.year ?? null, row.volume ?? null,
          row.issueNumber ?? null, row.pages ?? null, row.indexation ?? null, row.issnNumber ?? null,
          row.ugcApproved ?? null, row.impactFactor ?? null, row.journalLink ?? null, row.articleLink ?? null,
          row.id
        ]
      );
      successful.push(row.id);
    }

    await connection.commit();
    await logAction(req.user.userEmail, "BATCH_UPDATE",
      `Batch update: ${successful.length} successful, ${rejected.length} rejected`);
    return res.status(200).json({
      message: "Batch update completed", successful: successful.length,
      rejected: rejected.length, rejectedEntries: rejected.length > 0 ? rejected : undefined
    });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ message: "Batch update failed" });
  } finally {
    connection.release();
  }
});

// ── DELETE /form/deleteEntry/:id ──
router.delete("/deleteEntry/:id", verifyToken, requireAnyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT email, department FROM journals WHERE id = ?", [id]);
    const entry = rows[0];
    if (!entry) return res.status(404).json({ message: "Journal publication not found" });

    if (req.user.role === 'sub_admin' && entry.department !== req.user.department) {
      return res.status(403).json({ message: `You can only delete publications from your department (${req.user.department})` });
    }

    await db.query("DELETE FROM journals WHERE id = ?", [id]);
    await logAction(req.user.userEmail, "DELETE", `Deleted journal publication ID: ${id}`);
    return res.status(200).json({ message: "Journal publication deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /form/formGet — Public with optional soft auth ──
router.get("/formGet", async (req, res) => {
  try {
    const pageParam = req.query.page;
    const limitParam = req.query.limit;
    const filtersParam = req.query.filters;
    const sortKeyParam = req.query.sortKey;
    const sortDirectionParam = req.query.sortDirection;

    const page = pageParam ? parseInt(pageParam, 10) : null;
    const limit = limitParam ? parseInt(limitParam, 10) : null;
    let filters = {};
    if (filtersParam) { try { filters = JSON.parse(filtersParam); } catch (e) {} }

    // Soft auth
    let user = null;
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try { const decoded = jwt.verify(token, process.env.JWT_SECRET); user = decoded; } catch (err) {}
    }

    let conditions = [];
    let searchParams = [];

    if (user && user.role === 'sub_admin') {
      conditions.push('department = ?');
      searchParams.push(user.department);
    }

    const allowedColumns = [
      'mainAuthor', 'email', 'phone', 'department', 'designation', 'caste', 'coAuthors',
      'title', 'journal', 'publisher', 'year', 'volume', 'issueNumber', 'pages',
      'indexation', 'issnNumber', 'ugcApproved', 'impactFactor', 'journalLink', 'articleLink'
    ];

    for (const [key, value] of Object.entries(filters)) {
      if (value && allowedColumns.includes(key)) {
        conditions.push(`${key} LIKE ?`);
        searchParams.push(`%${value}%`);
      }
    }

    const searchCondition = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const safeSortKey = allowedColumns.includes(sortKeyParam) ? sortKeyParam : 'id';
    const safeSortDirection = sortDirectionParam === 'desc' ? 'DESC' : 'ASC';
    const finalSortDirection = (!sortKeyParam) ? 'DESC' : safeSortDirection;
    const orderClause = `ORDER BY \`${safeSortKey}\` ${finalSortDirection}`;

    if (page && limit && !isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM journals ${searchCondition}`, searchParams);
      const total = countResult[0].total;
      const [rows] = await db.query(
        `SELECT * FROM journals ${searchCondition} ${orderClause} LIMIT ? OFFSET ?`,
        [...searchParams, limit, offset]
      );
      return res.json({ data: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } else {
      const [rows] = await db.query(`SELECT * FROM journals ${searchCondition} ${orderClause}`, searchParams);
      return res.json(rows);
    }
  } catch (e) {
    console.error("Error in /formGet:", e);
    return res.status(500).json({ message: "error reading database", error: e.message });
  }
});

// ── GET /form/downloadExcel ──
router.get("/downloadExcel", async (req, res) => {
  try {
    const filtersParam = req.query.filters;
    const filters = filtersParam ? JSON.parse(filtersParam) : {};
    const allowedFilterColumns = [
      'mainAuthor', 'email', 'phone', 'department', 'designation', 'caste', 'coAuthors',
      'title', 'journal', 'publisher', 'year', 'volume', 'issueNumber', 'pages',
      'indexation', 'issnNumber', 'ugcApproved', 'impactFactor'
    ];

    let conditions = [], searchParams = [];
    for (const [key, value] of Object.entries(filters)) {
      if (value && allowedFilterColumns.includes(key)) {
        conditions.push(`\`${key}\` LIKE ?`);
        searchParams.push(`%${value}%`);
      }
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(`SELECT * FROM journals ${whereClause} ORDER BY id DESC`, searchParams);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Journal Publications");

    const columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Main Author", key: "mainAuthor", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Department", key: "department", width: 15 },
      { header: "Designation", key: "designation", width: 22 },
      { header: "Caste", key: "caste", width: 10 },
      { header: "Co-Authors", key: "coAuthors", width: 30 },
      { header: "Title", key: "title", width: 45 },
      { header: "Journal", key: "journal", width: 35 },
      { header: "Publisher", key: "publisher", width: 25 },
      { header: "Year", key: "year", width: 10 },
      { header: "Volume", key: "volume", width: 12 },
      { header: "Issue Number", key: "issueNumber", width: 15 },
      { header: "Pages", key: "pages", width: 12 },
      { header: "Indexation", key: "indexation", width: 18 },
      { header: "ISSN Number", key: "issnNumber", width: 18 },
      { header: "UGC Approved", key: "ugcApproved", width: 15 },
      { header: "Impact Factor", key: "impactFactor", width: 15 },
      { header: "Link to Journal", key: "journalLink", width: 50 },
      { header: "Link to Article", key: "articleLink", width: 50 },
    ];

    // Title row
    worksheet.mergeCells(`A1:U1`);
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = "FACULTY JOURNAL PUBLICATIONS";
    titleRow.getCell(1).font = { name: "Arial", size: 16, bold: true };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    titleRow.height = 30;

    columns.forEach((col, index) => { worksheet.getColumn(index + 1).width = col.width; });

    const headerRow = worksheet.addRow(columns.map(c => c.header));
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2845" } };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    headerRow.height = 25;

    rows.forEach(row => {
      const rowData = columns.map(col => row[col.key]);
      const newRow = worksheet.addRow(rowData);
      newRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        if ((colNumber === 20 || colNumber === 21) && cell.value && String(cell.value).startsWith('http')) {
          cell.value = { text: String(cell.value), hyperlink: String(cell.value), tooltip: 'Click to open link' };
          cell.font = { color: { argb: 'FF0000FF' }, underline: true };
        }
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=journals.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel generation error:", err);
    res.status(500).json({ message: "Failed to generate Excel file" });
  }
});

// ── GET /form/downloadTemplate ──
router.get("/downloadTemplate", async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Journal Publications");

    const columns = [
      { header: "Main Author (Dr. John Doe)", width: 30 },
      { header: "Email (faculty@domain.com)", width: 35 },
      { header: "Phone (optional)", width: 20 },
      { header: "Department (CSE/ECE/EEE/MECH/CIVIL/IT/AIML/CSD/CSM/FED/MBA)", width: 60 },
      { header: "Designation (Professor/Associate Professor/etc)", width: 40 },
      { header: "Caste (SC/ST/OC/OBC/BC)", width: 25 },
      { header: "Co-Authors (Name1, Name2)", width: 35 },
      { header: "Title", width: 50 },
      { header: "Journal (Journal Name)", width: 40 },
      { header: "Publisher (optional)", width: 30 },
      { header: "Year (e.g. 2024)", width: 18 },
      { header: "Volume (optional)", width: 18 },
      { header: "Issue Number (optional)", width: 20 },
      { header: "Pages (e.g. 123-130)", width: 20 },
      { header: "Indexation (SCI/Scopus/UGC/etc)", width: 30 },
      { header: "ISSN Number (optional)", width: 22 },
      { header: "UGC Approved (Yes or No)", width: 22 },
      { header: "Impact Factor (optional, e.g. 3.456)", width: 30 },
      { header: "Link to Journal (https://...)", width: 45 },
      { header: "Link to Article (https://...)", width: 45 },
    ];

    worksheet.mergeCells(`A1:T1`);
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = "FACULTY JOURNAL PUBLICATIONS — IMPORT TEMPLATE";
    titleRow.getCell(1).font = { name: "Arial", size: 14, bold: true };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    titleRow.height = 30;

    columns.forEach((col, index) => { worksheet.getColumn(index + 1).width = col.width; });
    const headerRow = worksheet.addRow(columns.map(c => c.header));
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2845" } };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    headerRow.height = 40;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=journals_template.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error("Template download error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── GET /form/pdf-preview — kept for backward compatibility (hidden feature) ──
router.get("/pdf-preview", async (req, res) => {
  try {
    const { file } = req.query;
    if (!file) return res.status(400).json({ message: "Missing file parameter" });
    const uploadsBase = path.join(__dirname, '../uploads');
    const relative = file.replace(/^\/+uploads\/+/, '');
    const fullPath = path.resolve(uploadsBase, relative);
    if (!fullPath.startsWith(uploadsBase)) return res.status(403).json({ message: "Access denied" });
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "File not found" });
    const ext = path.extname(fullPath).toLowerCase();
    if (ext !== '.pdf') return res.status(400).json({ message: "Only PDF files are supported" });
    const data = fs.readFileSync(fullPath);
    return res.json({ data: data.toString('base64'), mimeType: 'application/pdf' });
  } catch (err) {
    console.error('[pdf-preview] Error:', err);
    return res.status(500).json({ message: "Failed to load file" });
  }
});

export default router;
