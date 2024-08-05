import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};

export const comparePasswords = async (
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};
