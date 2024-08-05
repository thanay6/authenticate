import { Router } from "express";
import passport from "passport";
import {
  registerUser,
  getQRCode,
  verifyOTP,
  loginUser,
} from "../controllers/userRegistration";

const router = Router();

router.post("/register", registerUser);
router.get("/qrcode", getQRCode);
router.post("/verify", verifyOTP);

router.post("/login", loginUser);
export default router;
