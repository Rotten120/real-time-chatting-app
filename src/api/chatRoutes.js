import express from "express"
import { prisma } from "../lib/prismaClient.js"
import { getPath } from "../lib/dirname.js"

const router = express.Router();

router.get("/t/:chatRoomId", async (req, res) => {
  const { chatRoomId } = req.params;

  if(!chatRoomId) {
    return res.sendStatus(404);
  }

  const chatroom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId }
  });

  if(!chatroom) {
    return res.sendStatus(404);
  }
  
  res.sendFile(getPath("..", "..", "public", "index.html"));
});

router.get("/:chatRoomId", async (req, res) => {
  const { chatRoomId } = req.params;
  const chatroom = await prisma.chatRoom.findUnique({
    data: { id: chatRoomId }
  });

  if(!chatroom) {
    res.sendStatus(404);
  }

  res.json({ name: chatroom.name });
});

router.post("/:chatRoomName", async (req, res) => {
  const { chatRoomName } = req.params;
  const chatroom = await prisma.chatRoom.create({
    data: { name: chatRoomName }
  });

  res.send(chatroom);
});

export default router;
