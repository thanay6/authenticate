import speakeasy from "speakeasy";
import QRCode from "qrcode";

interface SecretDetails {
  base32: string;
  ascii: string;
  hex: string;
  otpauth_url: string;
  qr_code_url: string;
}

export const generateSecret = (): SecretDetails => {
  try {
    const secret = speakeasy.generateSecret({ length: 20 });

    // Ensure all properties are defined and assert their types
    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error("Secret generation failed");
    }

    // Construct QR code URL for user to scan
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(
      secret.otpauth_url
    )}`;

    return {
      base32: secret.base32,
      ascii: secret.ascii || "", // Use empty string as fallback if undefined
      hex: secret.hex || "", // Use empty string as fallback if undefined
      otpauth_url: secret.otpauth_url,
      qr_code_url: qrCodeUrl,
    };
  } catch (error) {
    console.error("Error generating secret:", error);
    throw new Error("Could not generate OTP secret");
  }
};

export const verifyToken = (secret: string, token: string) => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  });
};

export const otpauthURL = (secret: string, username: string) => {
  return speakeasy.otpauthURL({
    secret,
    label: username,
    issuer: "YourApp",
  });
};
