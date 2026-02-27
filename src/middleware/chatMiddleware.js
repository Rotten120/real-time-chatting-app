import { prisma } from "../lib/prismaClient.js"

/*
 * chatRoomExists
 * Description: Checks if the chat room is in the database
 *
 * Path Params:
 *   chatRoomId (string) - The :chatRoomId often seen in chat routes;
 *                         id of the chatroom user wants to interact with
 *
 * Success Response:
 *   req.chatRoom - contains chatRoom info (see schema for more info)
 *
 * Error:
 *   404 chatroom does not exists in db
 *
 */
export const chatRoomExists = async (req, res, next) => {
  const { chatRoomId = null } = req.params
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId }
  });

  if(!chatRoomId) {
    return res.status(404).json({ message: "Chat room does not exist" });
  }

  req.chatRoom = chatRoom;
  next();
}

/*
 * requireChatRoomMember
 * Description: Validates if user is part of the chatroom;
 *              A ChatMember row contains both req.user.id and req.chatRoom.id
 *
 * Success Response:
 *   req.chatMember - contains user info as a chatmember (see schema for more info)
 *
 * Error:
 *   404 No ChatMember with those ids exists
 *
 */
export const requireChatRoomMember = async (req, res, next) => {
  const chatMember = await prisma.chatMember.findMany({
    where: {
      userId: req.user.id,
      chatRoomId: req.chatRoom.id
    }
  });

  if(chatMember.length === 0) {
    return res.status(404).json({ message: "User does not have permission to access the request" });
  }

  req.chatMember = chatMember[0];
  next();
}

/*
 * chatRoomAccess
 * Description: Checks if a user is a member of an EXISTING chatroom
 *              Combines the Success Response and Errors of both middlewares
 *
 */
export const chatRoomAccess = [chatRoomExists, requireChatRoomMember];
