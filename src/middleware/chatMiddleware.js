import { prisma } from "../lib/prismaClient.js"

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

export const chatRoomAccess = [chatRoomExists, requireChatRoomMember];
