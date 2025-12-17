import "dotenv/config";
import express from "express"
import loginRoutes from "./login.js"
import FormRoutes from "./routers/formHandling.js"
import cors from "cors"
import helmet from "helmet";
import compression from "compression";

const port = process.env.PORT||3000;
const app= express();

app.use(helmet());
app.use(compression());
app.use(express.json());

const corsOptions = {
    origin: process.env.FRONTEND_URL || "*", // Use env var in production
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

app.use("/login",loginRoutes);
app.use("/form",FormRoutes);
app.listen(port,()=>{
console.log(`Running at ${port}`)
})