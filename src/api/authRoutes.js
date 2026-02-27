import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prismaClient.js"
import { hashPassword, verifyPassword } from "../lib/auth.js"
import { setCookie } from "../lib/cookies.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const router = express.Router();

/*
 * POST /auth/register
 * Description: Creates a new account, saves token in cookies if successful
 * Middleware: None
 *
 * Body Params:
 *   name (string)
 *   email (string) - should be unique
 *   password (string)
 *
 * Success Response:
 *   201 CREATED
 *   {
 *     message: string
 *     token: string
 *   }
 *
 * Error:
 *   400 missing body params
 *   409 email already exists
 *   500 server error
 *
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if(!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required fields" });
    }

    const existingUser = await prisma.user.findUnique({where: {email}});
    if(existingUser) {
      return res.status(409).json({ message: "User with this email address already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const { id } = await prisma.user.create({
      data: {email, name, password: hashedPassword} 
    });

    const token = await setCookie(res, id);

    res.status(201).json({ message: "Account successfully registered", token });
  } catch(error) {
    console.log(error);
    res.status(500).json({ message: "Error has been found" });
  }
});

/*
 * POST /auth/login
 * Description: Exchanges login credentials for tokens, also saves token in cookies
 * Middleware: None
 *
 * Body Params:
 *   email (string)
 *   password (string)
 *
 * Success Response:
 *   200 OK
 *   {
 *     message: string
 *     token: string
 *   }
 *
 *  Error:
 *    400 missing body params
 *    409 wrong login credentials
 *
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if(!email || !password) {
      return res.status(400).json({ message: "Email, and password are required fields" });
    }

    const userDB = await prisma.user.findUnique({where: {email}});
    if(!userDB) {
      return res.status(409).json({ message: "Email or password is incorrect. Please try again" });
    }

    const isVerified = await verifyPassword(password, userDB.password);
    if(!isVerified) {
      return res.status(409).json({ message: "Email or password is incorrect. Please try again" })
    }

  const token = await setCookie(res, userDB.id)  

    res.json({ message: "Account successfully logged in", token });
  } catch(error) {
    console.log(error);
    res.status(500).json({ message: "Error has been found" });
  } 
});

/*
 * POST /auth/logout
 * Description: Removes the token in the cookie
 * Middleware: None
 *
 * Success Response:
 *   200 OK
 *   {
 *     message: string
 *   }
 *
 */
router.post("/logout", async (req, res) => {
  await setCookie(res, "", 0); 
  res.send({ message: "Successfully logged out" })
});

/*
 * GET /auth/me
 * Description: Fetches user's primary id
 * Middleware: authMiddleware
 *
 * Success Response:
 *   200 OK
 *   {
 *     userId: string
 *   }
 *
 */
router.get("/me", authMiddleware, async (req, res) => {
  return res.send({ userId: req.user.id });
});

export default router;

