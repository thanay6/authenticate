import { Router } from "express";
import {
  registerUser,
  getQRCode,
  verifyOTP,
  loginUser,
  updatePassword,
} from "../controllers/userRegistration";

const router = Router();

router.post("/register", registerUser);
router.get("/qrcode", getQRCode);
router.post("/verify", verifyOTP);
router.post("/login", loginUser);
router.post("/update-password", updatePassword);

export default router;
