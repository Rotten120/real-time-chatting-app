import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const hashPassword = async (password) => {
  return bcrypt.hash(password, Number(process.env.COST)); 
}

export const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
}

export const generateToken = async (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export const verifyToken = async (token, callback = null) => {
  return jwt.verify(token, process.env.JWT_SECRET, callback);
}

