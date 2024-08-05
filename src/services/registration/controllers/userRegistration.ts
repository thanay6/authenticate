import { Request, Response } from "express";
import db from "../../../config/db_connection";
import { v4 as uuidv4 } from "uuid";
import {
  generateSecret,
  verifyToken,
  otpauthURL,
} from "../services/otpService";
import { hashPassword, verifyPassword } from "../utils/bcryptUtils";
import QRCode from "qrcode";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
        solution: "Change email address",
      });
    }

    // Hash the password and generate a secret
    const hashedPassword = await hashPassword(password);
    const secret = generateSecret();

    // Create a new user
    const user = await db.User.create({
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      secret: secret.base32,
    });

    return res.status(201).json({
      message: "All users registered successfully",
      users: user,
      secret: secret,
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      message: "An error occurred during registration",
      error: (error as Error).message ?? "Unknown error occurred",
    });
  }
};

export const getQRCode = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract email from the request body
    const { email } = req.body;

    // Find the user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        message: "Email does not exist",
      });
    }

    // Generate the QR code
    const otpauthUrl = otpauthURL(user.secret, email);
    const dataUrl = await QRCode.toDataURL(otpauthUrl);

    // Send the QR code image as HTML
    return res.send(`<img src="${dataUrl}" alt="QR Code">`);
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    return res.status(500).send("Failed to generate QR code");
  }
};

export const loginUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password, otp } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof otp !== "string"
    ) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Find the user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Verify OTP
    const isOtpValid = verifyToken(user.secret, otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during login",
      error: (error as Error).message ?? "Unknown error occurred",
    });
  }
};

export const verifyOTP = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, token } = req.body;

    // Validate input
    if (typeof email !== "string" || typeof token !== "string") {
      return res.status(400).send("Invalid input");
    }

    // Find the user by email
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Verify the OTP token using the user's secret
    const isVerified = verifyToken(user.secret, token);

    if (isVerified) {
      return res
        .status(200)
        .json({ message: "2FA verified successfully", startStatus: "started" });
    } else {
      return res.status(400).send("Invalid token");
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).send("Error verifying OTP");
  }
};
