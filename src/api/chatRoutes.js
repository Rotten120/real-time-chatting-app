import express from "express"
import { prisma } from "../lib/prismaClient.js"
import { getPath } from "../lib/dirname.js"
import { chatRoomExists, requireChatRoomMember } from "../middleware/chatMiddleware.js"

const router = express.Router();
const chatRoomAccess = [chatRoomExists, requireChatRoomMember];

router.post("/:chatRoomName", async (req, res) => {
  const { chatRoomName } = req.params;
  const chatRoom = await prisma.chatRoom.create({
    data: { name: chatRoomName }
  });

  await prisma.chatMember.create({
    data: {
      userId: req.user.id,
      chatRoomId: chatRoom.id
    }
  }); 

  res.status(400).json(chatRoom);
});

router.get("/t/:chatRoomId", chatRoomAccess, async (req, res) => {  
  res.sendFile(getPath("..", "..", "public", "index.html"));
});

router.get("/:chatRoomId", chatRoomAccess, async (req, res) => {
  const chatRoomMembers = await prisma.chatMember.findMany({
    where: { chatRoomId: req.chatRoom.id },
    select: {
      user: { select: { name: true } },
      joinedAt: true
    }
  });
  
  res.json({
    name: req.chatRoom.name,
    createdAt: req.chatRoom.createdAt,
    members: chatRoomMembers,
    memberCount: chatRoomMembers.length
  });
});

//there could be groupchats that exists without members
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

  //checks if user is already member of chat room
  let chatMember = await prisma.chatMember.findMany({
    where: {
      userId: req.userId,
      chatRoomId: req.chatRoom.id
    }
  }); 

  if(chatMember.length > 0) {
    return res.status(409).json({ message: "User already part of the chat room" });
  };
  
  //if not then it adds them
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
