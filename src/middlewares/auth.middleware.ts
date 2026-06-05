import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type CustomJwtPayload } from "../types/express";
import { BlackListToken } from "../models/blacklist.model";

export const authmiddle = (req: Request, res: Response, next: NextFunction) => {
  const authHead = req.headers["authorization"];
  if (!authHead) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHead.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token expired" });
  }

  const secret = process.env.JWT_SECRET!;
  if (!secret) {
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  jwt.verify(token, secret, async (err, data) => {
    if (err) {
      return res.status(403).json({ message: "Token invalid" });
    }
    const blacklist = await BlackListToken.findOne({ token });
    if (blacklist) {
      res
        .status(401)
        .json({ message: "Token has been invalidated, please login again" });
      return;
    }

    req.auth = data as CustomJwtPayload;
    next();
  });
};
