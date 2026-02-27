import express from "express"
import { prisma } from "../../lib/prismaClient.js"
import { getPath } from "../../lib/dirname.js"
import { chatRoomAccess, chatRoomExists } from "../../middleware/chatMiddleware.js"
import { Message } from "../../lib/message.js"

const router = express.Router();

router.post("/:chatRoomName", async (req, res) => {
  const { chatRoomName } = req.params;

  if(!chatRoomName) {
    return res.status(400).send({ message: "New chatroom name is required" });
  }

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
  res.sendFile(getPath("..", "..", "public", "client.html"));
});

// gets chatroom name for non-members
router.get("/:chatRoomId/name", chatRoomExists, async (req, res) => {
  const { name } = await prisma.chatRoom.findUnique({
    where: { id: req.chatRoom.id }
  });

  res.json({ chatRoomName: name });
});

// gets chatroom deets for members
router.get("/:chatRoomId", chatRoomAccess, async (req, res) => {
  const chatRoomMembers = await prisma.chatMember.findMany({
    where: { chatRoomId: req.chatRoom.id },
    select: {
      user: { select: { name: true, email: true } },
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

router.patch("/:chatRoomId", chatRoomAccess, async (req, res) => {
  const { chatRoomName } = req.body;
 
  if(!chatRoomName) {
    return res.status(400).send({ message: "New chatroom name is required" });
  }

  const updateChatRoom = await prisma.chatRoom.update({
    where: { id: req.chatRoom.id },
    data: { name: chatRoomName }
  });

  res.json({ message: "Chatroom name has been successfully changed", name: updateChatRoom.name });
});

export default router;
