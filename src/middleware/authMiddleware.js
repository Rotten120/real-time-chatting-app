import { prisma } from "../lib/prismaClient.js"
import { verifyToken } from "../lib/auth.js"

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if(!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  verifyToken(token, async (err, decoded) => {
    if(err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });   

    if(!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { password, ...userRequest } = user;
    req.user = userRequest

    next();
  });
}
