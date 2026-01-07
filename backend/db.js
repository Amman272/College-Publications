import mysql from 'mysql2/promise';

// First, create a connection without specifying a database to check/create it
const createDatabaseIfNotExists = async () => {
    try {
        // Connect without specifying database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD
        });

        const dbName = process.env.DB_NAME || 'nri_portal';

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' is ready`);

        await connection.end();
    } catch (error) {
        console.error('❌ Error creating database:', error.message);
        throw error;
    }
};

// Create database first, then create pool
await createDatabaseIfNotExists();

export const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nri_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const initDb = async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Connected to MySQL database');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS publications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mainAuthor TEXT,
                title TEXT,
                email TEXT,
                phone TEXT,
                dept TEXT,
                coauthors TEXT,
                journal TEXT,
                publisher TEXT,
                year INT,
                vol TEXT,
                issueNo TEXT,
                pages TEXT,
                indexation TEXT,
                issnNo TEXT,
                journalLink TEXT,
                ugcApproved TEXT,
                impactFactor TEXT,
                pdfUrl TEXT
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                EMAIL VARCHAR(255) UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email TEXT,
                action TEXT,
                details TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        connection.release();
        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error.message);
    }
};

initDb();
