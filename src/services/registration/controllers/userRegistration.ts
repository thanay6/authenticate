import { Request, Response } from "express";
import db from "../../../config/db_connection";
import { v4 as uuidv4 } from "uuid";
import {
  generateSecret,
  verifyToken,
  otpauthURL,
} from "../services/otpService";
import {
  hashPassword,
  verifyPassword,
  comparePasswords,
} from "../utils/bcryptUtils";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

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

    // Validate email format
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Find the user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        message: "Email does not exist",
      });
    }

    // Generate the QR code
    const otpauthUrl = otpauthURL(user.secret, email);
    const dataUrl = await QRCode.toDataURL(otpauthUrl);

    // Send the QR code image as HTML
    return res.status(200).send(`<img src="${dataUrl}" alt="QR Code">`);
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    return res.status(500).json({
      message: "Failed to generate QR code",
      error: (err as Error).message ?? "Unknown error occurred",
    });
  }
};
// export const getQRCode = async (
//   req: Request,
//   res: Response
// ): Promise<Response> => {
//   try {
//     // Extract email from the request body
//     const { email } = req.body;

//     // Find the user by email
//     const user = await db.User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(400).json({
//         message: "Email does not exist",
//       });
//     }

//     // Generate the QR code
//     const otpauthUrl = otpauthURL(user.secret, email);
//     const dataUrl = await QRCode.toDataURL(otpauthUrl);

//     // Send the QR code image as HTML
//     return res.send(`<img src="${dataUrl}" alt="QR Code">`);
//   } catch (err) {
//     console.error("Failed to generate QR code:", err);
//     return res.status(500).send("Failed to generate QR code");
//   }
// };

export const loginUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Validate input types
    if (typeof email !== "string" || typeof password !== "string") {
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

    // Generate a JWT token
    const token = jwt.sign({ email }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    // Send a single response
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    // Handle errors
    console.error("Login error:", error); // Logging error for debugging
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

    // console.log(user.secret);

    if (isVerified) {
      return res
        .status(200)
        .json({ message: "2FA verified successfully", startStatus: "started" });
    } else {
      // console.log(token);

      return res.status(400).send("Invalid token");
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).send("Error verifying OTP");
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  const { email, currentPassword, newPassword, otp } = req.body;

  const user = await db.User.findOne({ where: { email } });

  if (!user) {
    return res.status(404).send("User not found");
  }

  // Verify current password
  const isMatch = await comparePasswords(currentPassword, user.password);

  if (!isMatch) {
    return res.status(400).send("Current password is incorrect");
  }

  // Verify OTP
  const isTokenValid = verifyToken(user.secret, otp);

  if (!isTokenValid) {
    return res.status(400).send("Invalid token");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  try {
    user.password = hashedPassword;
    await user.save();
    res.send("Password updated successfully");
  } catch (err) {
    res.status(500).send("Error updating password");
  }
};
