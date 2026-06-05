import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes";
import { authmiddle } from "./middlewares/auth.middleware";
import userRoutes from "./routes/user.routes";
import "./lib/passport";
import { logout } from "./controller/auth.controller";
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(passport.initialize());
app.use(authRoutes);

app.use(authmiddle);

app.use(userRoutes);

app.get("/logout", logout);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("Database connected successfully...");
    app.listen(3000, () => {
      console.log(`server listening on port 3000`);
    });
  })
  .catch((err) => {
    console.log(`error connecting to database -> ${err}`);
  });
