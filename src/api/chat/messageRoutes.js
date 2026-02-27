import express from "express"
import { prisma } from "../../lib/prismaClient.js"
import { chatRoomAccess } from "../../middleware/chatMiddleware.js"
import { Message } from "../../lib/message.js"

const router = express.Router();

router.get("/:chatRoomId/messages", chatRoomAccess, async (req, res) => {
  const { cursorId = "", limit = 5 } = req.query;
  
  if(cursorId === "") {
    res.status(400).send({ message: "cursorId is a required field" });
  }

  if(limit > 20) {
    res.status(400).send({ message: "Requests can only fetch 30 messages at a time" });
  }

  const prevMessages = await prisma.message.findMany({
    cursor: { id: cursorId },
    skip: 1,
    take: Number(limit),
    orderBy: { createdAt: "desc" },
    where: { chatRoomId: req.chatRoom.id },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: {select: { name: true }}
    }
  });

  let prevResMessages = [];
  for(let pm of prevMessages) {
    prevResMessages.push(Message(
      pm.id,
      pm.user.name,
      pm.content,
      pm.createdAt
    ));
  }
  
  res.send(prevResMessages);
});

router.post("/:chatRoomId/messages", chatRoomAccess, async(req, res) => {
  const { content } = req.body;

  const message = await prisma.message.create({
    data: {
      chatRoomId: req.chatRoom.id,
      userId: req.user.id,
      content: content
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: {select: { name: true }}
    }
  }); 

  res.status(201).send(Message(
    message.id,
    message.user.name,
    message.content,
    message.createdAt
  ));
});

router.delete("/:chatRoomId/messages/:messageId", chatRoomAccess, async (req, res) => {
  const { messageId } = req.params;

  const deletedMessage = await prisma.message.deleteMany({
    where: {
      id: messageId,
      chatRoomId: req.chatRoom.id,
      userId: req.user.id
    }
  });

  if(deletedMessage.count == 0) {
    return res.status(404).send({ message: "Message not found" });
  }

  res.status(204).send({ message: "Message deleted" });
});

export default router;
