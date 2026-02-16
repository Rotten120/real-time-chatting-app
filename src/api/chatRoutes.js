import express from "express"
import { prisma } from "../lib/prismaClient.js"

const router = express.Router();

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
