# Guide: Adding or Removing Columns

This step-by-step guide explains how to modify the database schema and update the frontend accordingly.

## 1. Update Database (`backend/db.js` / `backend/db.sql`)

1.  **Modify Schema:** Open `backend/db.js` (or `db.sql` if used for init).
    *   Add or remove the column in the `CREATE TABLE` statement.
    *   *Example:* `db.prepare("ALTER TABLE publications ADD COLUMN newColumn TEXT").run();` (Run this once or update your init script and reset DB).

## 2. Update Backend Router (`backend/routers/formHandling.js`)

You need to update 4 places in this file:

1.  **POST `/formEntry`:**
    *   Add variable to destructuring: `const { ..., newColumn } = req.body;`
    *   Update `INSERT` query: `INSERT INTO publications (..., newColumn) VALUES (..., ?)`
    *   Update `.run(...)` arguments.

2.  **PUT `/formEntryBatchUpdate`:**
    *   Update `UPDATE` query: `newColumn = COALESCE(?, newColumn)`
    *   Update `.run(...)` arguments inside the loop.

3.  **PUT `/formEntryUpdate`:**
    *   Add variable to destructuring.
    *   Update `UPDATE` query: `SET ..., newColumn = ?`
    *   Update `.run(...)` arguments.

4.  **GET `/downloadExcel`:**
    *   Add the new column to `worksheet.columns` array: `{ header: "New Header", key: "newColumn", width: 20 },`

## 3. Update Frontend Form (`frontend/src/components/forms/UploadForm.jsx`)

1.  **Initial State:** Add `newColumn: ''` to `initialForm`.
2.  **Input Field:** Add a new input field in the JSX.
    ```jsx
    <div>
      <label className={labelClass}>New Column Label</label>
      <input name="newColumn" value={formData.newColumn} onChange={handleChange} className={inputClass} />
    </div>
    ```

## 4. Update Frontend Table (`frontend/src/components/data/PublicationsTable.jsx`)

1.  **Columns Config:** Add the new column to the `columns` array.
    ```javascript
    const columns = [
      // ...
      { key: 'newColumn', label: 'New Header', minWidth: '150px' },
    ];
    ```

## 5. Update Bulk Import (`frontend/src/components/forms/BulkImport.jsx`)

1.  **Payload Mapping:** Update the `payload` object inside `handleFileUpload`.
    ```javascript
    newColumn: row['New Header in Excel'] || row['newColumn'] || '',
    ```

---
**Note:** Always restart the backend server after modifying database schema or backend code.
