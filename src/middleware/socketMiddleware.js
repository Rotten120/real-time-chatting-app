import cookie from "cookie";
import { prisma } from "../lib/prismaClient.js"
import { verifyToken } from "../lib/auth.js"

/*
 * socketMiddleware
 * Description: Authenticates user before connecting to websocket
 *
 */
export const socketMiddleware = async (socket, next) => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || "");
  const token = cookies.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if(!user) {
      return next(new Error("User not found"))
    }

    const { password, ...safeUser } = user;
    socket.user = safeUser;
    next();

  } catch(error) {
    console.log(error);
    return next(new Error("Invalid token"));
  } 
}
