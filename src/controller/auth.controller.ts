import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { BlackListToken } from "../models/blacklist.model";

const authController = new AuthService();
export const send_otp = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) {
    res.status(400).send("Email and name required!");
    return;
  }
  const normalEmail = email.toLowerCase().trim();
  try {
    await authController.sendOtp(name, normalEmail);
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to send otp", error });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!otp || !email) {
      res.status(400).send("Email and otp required!");
      return;
    }
    const normalEmail = email.toLowerCase().trim();
    const result = await authController.verifyOTP(normalEmail, Number(otp));
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

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
