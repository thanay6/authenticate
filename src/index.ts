import express from "express";
import session from "express-session";
import "dotenv/config";
// import passport from './config/passportConfig';
import dotenv from "dotenv";
// import sequelize from './config/dbConfig';
import authRoutes from "./services/registration/routers/registrationRouters";
import "./config/db_connection";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
  })
);
// Routes
const PORT = process.env.PORT || 5000;

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/profile", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).send("You are not authenticated");
  }
  res.send(`Hello, ${(req.user as any).username}`);
});

// Sync the database and start the server
app.listen(PORT, () => {
  console.log(`server connected to ${PORT}`);
});
