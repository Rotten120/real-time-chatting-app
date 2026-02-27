import express from "express"
import { prisma } from "../../lib/prismaClient.js"
import { chatRoomAccess, chatRoomExists } from "../../middleware/chatMiddleware.js"
import { Message } from "../../lib/message.js"

const router = express.Router();

//there could be groupchats that exists without members
router.delete("/:chatRoomId/members", chatRoomAccess, async (req, res) => {
  await prisma.chatMember.deleteMany({
    where: {
      userId: req.user.id,
      chatRoomId: req.chatRoom.id
    }
  });

  res.status(204).json({ message: "User has been removed from the chat group" });
});

router.post("/:chatRoomId/members", chatRoomExists, async (req, res) => {
  //checks if user is already member of chat room
  let chatMember = await prisma.chatMember.findMany({
    where: {
      userId: req.user.id,
      chatRoomId: req.chatRoom.id
    }
  }); 

  if(chatMember.length > 0) {
    return res.status(409).json({ message: "User already part of the chat room" });
  };
  
  //if not then it adds them
  chatMember = await prisma.chatMember.create({
    data: {
      userId: req.user.id,
      chatRoomId: req.chatRoom.id
    }
  });

  if(chatMember) {
    return res.status(201).send({ message: "User successfully joined the chatroom!" })
  }
});

export default router;
