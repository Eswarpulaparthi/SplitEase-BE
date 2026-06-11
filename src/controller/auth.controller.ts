import type { Request, Response } from "express";
import { BlackListToken } from "../models/blacklist.model";

export const logout = async (req: Request, res: Response) => {
  const authHead = req.headers["authorization"];
  const token = authHead?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  await BlackListToken.create({ token });
  res.status(200).json({ message: "Logged out successfully" });
};
