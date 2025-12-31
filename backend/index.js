import "dotenv/config";
import express from "express"
import loginRoutes from "./login.js"
import FormRoutes from "./routers/formHandling.js"
import AdminRoutes from "./routers/Admin.js"
import cors from "cors"
import helmet from "helmet";
import compression from "compression";

const port = process.env.PORT||3000;
const app= express();

app.use(helmet());
app.use(compression());
app.use(express.json());

// Seed initial admin
import { db } from "./db.js";
try {
  const adminEmail = "ammanfawaz272@gmail.com";
  const row = db.prepare("SELECT 1 FROM admins WHERE EMAIL = ?").get(adminEmail);
  if (!row) {
    db.prepare("INSERT INTO admins (EMAIL) VALUES (?)").run(adminEmail);
    console.log(`Seeded admin: ${adminEmail}`);
  } else {
    console.log(`Admin exists: ${adminEmail}`);
  }
} catch (e) {
  console.error("Failed to seed admin:", e);
}

const isLocalOrigin = (origin) => {
    if (!origin) return true;
    // Match localhost, 127.0.0.1, or private network IP ranges
    return /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isLocalOrigin(origin) || origin === process.env.FRONTEND_URL) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

app.use("/login",loginRoutes);
app.use("/form",FormRoutes);
app.use("/admin",AdminRoutes);
app.listen(port, '0.0.0.0', ()=>{
console.log(`Running at 0.0.0.0:${port}`)
})