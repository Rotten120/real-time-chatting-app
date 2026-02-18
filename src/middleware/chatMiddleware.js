import { prisma } from "../lib/prismaClient.js"

export const chatRoomExists = async (req, res, next) => {
  const { chatRoomId = null } = req.params
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId }
  });

  if(!chatRoomId) {
    return res.sendStatus(404);
  }

  req.chatRoom = chatRoom;
  next();
}

export const requireChatRoomMember = async (req, res, next) => {
  const chatMember = await prisma.chatMember.findMany({
    where: {
      userId: req.userId,
      chatRoomId: req.chatRoom.id
    }
  });

  if(chatMember.length === 0) {
    return res.sendStatus(404);
  }

  req.chatMember = chatMember;
  next();
}
