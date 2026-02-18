import express from "express"
import { prisma } from "../lib/prismaClient.js"
import { getPath } from "../lib/dirname.js"
import { chatRoomExists, requireChatRoomMember } from "../middleware/chatMiddleware.js"

const router = express.Router();
const chatRoomAccess = [chatRoomExists, requireChatRoomMember];

router.post("/:chatRoomName", async (req, res) => {
  const { chatRoomName } = req.params;
  const chatroom = await prisma.chatRoom.create({
    data: { name: chatRoomName }
  });

  res.send(chatroom);
});

router.get("/t/:chatRoomId", chatRoomAccess, async (req, res) => {
  const { chatRoomId } = req.params;

  if(!chatRoomId) {
    return res.sendStatus(404);
  }
  
  res.sendFile(getPath("..", "..", "public", "index.html"));
});

router.get("/:chatRoomId", chatRoomAccess, async (req, res) => {
  const { chatRoomId } = req.params;
  const chatroom = await prisma.chatRoom.findUnique({
    data: { id: chatRoomId }
  });

  if(!chatroom) {
    res.sendStatus(404);
  }

  res.json({ name: chatroom.name });
});

router.delete("/:chatRoomId/members", chatRoomAccess, async (req, res) => {
  await prisma.chatMember.deleteMany({
    where: {
      userId: req.userId,
      chatRoomId: req.chatRoom.id
    }
  });

  res.status(204).json({ message: "User has been removed from the chat group" });
});

router.post("/:chatRoomId/members", chatRoomExists, async (req, res) => {
  const { chatRoomId } = req.params;
  let chatMember = await prisma.chatMember.findMany({
    where: {
      userId: req.userId,
      chatRoomId: req.chatRoom.id
    }
  }); 

  if(chatMember.length > 0) {
    return res.status(409).json({ message: "User already part of the chat room" });
  };
  
  chatMember = await prisma.chatMember.create({
    data: {
      userId: req.userId,
      chatRoomId: req.chatRoom.id
    }
  });

  if(chatMember) {
    return res.status(201).send({ message: "User successfully joined the chatroom!" })
  }
});

export default router;
