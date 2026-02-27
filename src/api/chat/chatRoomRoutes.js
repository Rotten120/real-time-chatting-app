import express from "express"
import { prisma } from "../../lib/prismaClient.js"
import { getPath } from "../../lib/dirname.js"
import { chatRoomAccess, chatRoomExists } from "../../middleware/chatMiddleware.js"
import { Message } from "../../lib/message.js"

const router = express.Router();

/*
 * Route: POST /chat/:chatRoomName
 * Description: Created a new chatroom
 * Middleware: authMiddleware
 *
 * Path Params:
 *   chatRoomName (string) - name of the chatroom
 *
 * Success Response:
 *   201 CREATED
 *   {
 *     id: string
 *     name: string
 *     createdAt: DateTime
 *   }
 *
 * Error:
 *   400 missing path params
 */
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

  res.status(201).json(chatRoom);
});

/*
 * Route: GET /chat/t/:chatRoomId
 * Description: Serves the client for messaging
 * Middleware: authMiddleware, chatRoomAccess
 *
 * Success Response:
 *   200 OK
 *   client.html
 */
router.get("/t/:chatRoomId", chatRoomAccess, async (req, res) => {
  res.sendFile(getPath("..", "..", "public", "client.html"));
});

/*
 * Route: GET /chat/:chatRoomId/name
 * Description: Fetches chatroom id (good for non-members)
 * Middleware: authMiddleware, chatRoomExists
 *
 * Success Response:
 *   200 OK
 *   {
 *     chatRoomName: string
 *   }
 *
 */
router.get("/:chatRoomId/name", chatRoomExists, async (req, res) => {
  const { name } = await prisma.chatRoom.findUnique({
    where: { id: req.chatRoom.id }
  });

  res.json({ chatRoomName: name });
});

/*
 * Route: GET /chat/:chatRoomId
 * Description: Fetches chatroom details and its members
 * Middleware: authMiddleware, chatRoomAccess
 *
 * Success Response:
 *   200 OK
 *   {
 *     name: string
 *     createdAt: DateTime
 *     memberCount: int
 *     members: [
 *       {
 *         user: {
 *           name: string
 *           email: string
 *         }
 *         joinedAt: DateTime
 *       }
 *       ...
 *     ]
 *   }
 *
 */
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

/*
 * Route: PATCH /chat/:chatRoomId
 * Description: Change chatroom name
 * Middleware: authMiddleware, chatRoomAccess
 *
 * Body Params:
 *   chatRoomName (string) - the new chatroom name to update
 *
 * Success Response:
 *   200 OK
 *   {
 *     message: string
 *     name: string
 *   }
 *
 * Error:
 *   400 missing body params
 *
 */
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
