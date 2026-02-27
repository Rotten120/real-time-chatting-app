import express from "express"
import { prisma } from "../lib/prismaClient.js"
import { verifyPassword, hashPassword } from "../lib/auth.js"

const router = express.Router();

router.get("/", async (req, res) => {
  const { password, ...userDB } = await prisma.user.findUnique({where: { id: req.userId}});
  return res.json({...userDB}); 
});

router.get("/chatrooms", async (req, res) => {
  const chatRooms = await prisma.chatMember.findMany({
    where: { userId: req.user.id },
    select: { chatRoom: { select: { id: true, name: true } } }
  });

  res.json(chatRooms);
});

router.patch("/name", async (req, res) => {
  const { newName } = req.body;
  
  if(!newName) {
    return res.status(400).send({ message: "New Name is a required field" });
  }

  await prisma.user.update({
    data: { name: newName },
    where: { id: req.user.id }
  });

  res.send({ message: "Name has been successfully changed" });
});

// this does not have input validation (i.e. password length etc.)
// could be validated over the client
router.patch("/password", async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  if(!oldPassword || !newPassword) {
    return res.status(400).json({ message: "New password and Old password are required" })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { password: true }
  });

  const isVerified = verifyPassword(oldPassword, user.password);
  if(!isVerified) {
    return res.status(400).json({ message: "Old password did not matched. Please try again" })
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: req.userId },
    data: { password: hashedPassword }
  });

  return res.json({ message: "Password set successfully" })
});

router.delete("/", async (req, res) => {
  const { password } = req.body;

  if(!password) {
    res.status(400).json({ message: "Password is a required field" });
  }

  const isVerified = await verifyPassword(password, req.user.password);
  if(!isVerified) {
    return res.status(409).json({ message: "Password is incorrect. Please try again" });
  } 

  await prisma.user.deleteUnique({
    where: { id: req.user.id }
  }); 

  res.status(204).json({ message: "User has been successfully deleted" });
});

export default router;
