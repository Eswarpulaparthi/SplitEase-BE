import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model";
import { redis } from "../lib/redis";

const MAX_ATTEMPTS = 3;
const OTP_TTL_SECONDS = 300;

interface OtpRecord {
  name: string;
  otp: number;
  attempts: number;
}

function generateUniqueUsername(base: string): string {
  return `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  public generateOtp(): number {
    return crypto.randomInt(100000, 999999);
  }

  public sanitized(base: string): string {
    return base.toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  public async sendOtp(name: string, email: string): Promise<void> {
    const otp = this.generateOtp();

    await redis.set<OtpRecord>(
      `otp:${email}`,
      { name, otp, attempts: 0 },
      { ex: OTP_TTL_SECONDS },
    );

    await this.transporter.sendMail({
      from: process.env.EMAIL_USER!,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP Code</h2>
        <p>Use the code below to verify your identity:</p>
        <h1 style="letter-spacing:8px;color:#4F46E5;">${otp}</h1>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  public async verifyOTP(
    email: string,
    inputOtp: number,
  ): Promise<{
    success: boolean;
    token?: string;
    message: string;
    data?: any;
  }> {
    const record = await redis.get<OtpRecord>(`otp:${email}`);

    if (!record) {
      return { success: false, message: "OTP expired or not found" };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await redis.del(`otp:${email}`);
      return {
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      };
    }

    if (inputOtp !== record.otp) {
      await redis.set<OtpRecord>(
        `otp:${email}`,
        { ...record, attempts: record.attempts + 1 },
        { keepTtl: true },
      );
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return {
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      };
    }

    await redis.del(`otp:${email}`);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const token = jwt.sign(
        {
          id: existingUser._id,
          name: existingUser.name,
          username: existingUser.username,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" },
      );

      return { success: true, token, message: "OTP verified successfully" };
    }

    const sanitizedBase = this.sanitized(email.split("@")[0]);
    const username = generateUniqueUsername(sanitizedBase);
    const user = await User.create({
      name: record.name,
      username,
      email,
    });

    const token = jwt.sign(
      { id: user._id, name: user.name, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );
    const data = { id: user._id, name: user.name, username: user.username };
    return { success: true, token, message: "OTP verified successfully", data };
  }
}

export { generateUniqueUsername };
