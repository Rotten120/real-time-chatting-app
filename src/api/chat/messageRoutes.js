import express from "express"
import { prisma } from "../../lib/prismaClient.js"
import { chatRoomAccess } from "../../middleware/chatMiddleware.js"
import { Message } from "../../lib/message.js"

const router = express.Router();

/*
 * Route: GET /chat/:chatRoomId/messages
 * Description: Fetches previous messages using pagination
 * Middleware: authMiddleware, chatRoomAccess
 *
 * Success Response:
 *   200 OK
 *   [
 *     {
 *       id: string
 *       content: string
 *       createdAt: DateTime
 *       user: {
 *         name: string
 *       }
 *     }
 *     ...
 *   ]
 *
 * Error:
 *   400 cursorId param is missing
 *   400 limit param exceeds 20
 *
 */
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

/*
 * Route: POST /chat/:chatRoomId/messages
 * Description: Sends a message with REST (so client is not updated; use for testing)
 * Middleware: authMiddleware, chatRoomAccess
 *
 * Body Params:
 *   content (string) - The content of message to send
 *
 * Success Response:
 *   201 CREATED
 *   {
 *     id: string
 *     sender: string
 *     content: string
 *     createdAt: DateTime
 *   }
 *
 * Error:
 *   400 body param is missing
 *
 */
router.post("/:chatRoomId/messages", chatRoomAccess, async(req, res) => {
  const { content } = req.body;

  if(!content) {
    return res.status(400).send({ message: "Message content is required" });
  }

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

/*
 * Route: DELETE /chat/:chatRoomId/messages/:messageId
 * Description: Deletes the user's message in a specified chatroom
 * Middleware: authMiddleware, chatRoomAccess
 *
 * Path Params:
 *   messageId (string) - identifier of a specific message
 *
 * Success Response:
 *   204 NO CONTENT
 *   {
 *     message: string
 *   }
 *
 * Error:
 *   400 missing path params
 *   404 message is not found
 *
 */
router.delete("/:chatRoomId/messages/:messageId", chatRoomAccess, async (req, res) => {
  const { messageId } = req.params;

  if(!messageId) {
    return res.status(400).send({ message: "messageId is a required field" });
  }

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

  res.sendStatus(204);
});

export default router;
