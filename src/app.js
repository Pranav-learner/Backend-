import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "20kb" })); // to get the body of the request in json format
app.use(express.urlencoded({ extended: true, limit: "20kb" })); // to get the body of the request in url  format from outside
app.use(express.static("public")) // to get the static files, like images to give the public access

// cookie parser is used to get the data or set the data inside the cookie in the user browser securely by the server (read only)
app.use(cookieParser())


//routes
import userRouter from "./routes/user.routes.js";


// routes declaration
app.use("/api/v1/users", userRouter)
// users will be prefix , then the userRouter will be called, which will add registers to the routes
// http://localhost:8000/api/v1/users/register


export default app