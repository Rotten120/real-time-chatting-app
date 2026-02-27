import { Server } from "socket.io"
import { prisma } from "./lib/prismaClient.js"
import { Message, MessageLog } from "./lib/message.js"
import { socketMiddleware } from "./middleware/socketMiddleware.js"

export function initSocket(server) {
  const io = new Server(server);

  io.use(socketMiddleware);

  io.on("connection", async (socket) => {
    const chatRoomId = socket.handshake.auth.chatRoomId;

    console.log(`User ${socket.user.name} connects to room ${chatRoomId}`);
    socket.emit('me', socket.user);
    socket.join(chatRoomId);

    socket.on('chat message', async (msg, callback) => {
      try {
        const newMessage = await prisma.message.create({
          data: { content: msg, chatRoomId, userId: socket.user.id }
        });

        const message = Message(
          newMessage.id, 
          socket.user.name,
          newMessage.content,
          newMessage.createdAt
        );

        socket.to(chatRoomId).emit('chat message', message);
        MessageLog(message, chatRoomId);

        callback({ status: 'delivered' });
      } catch(error) {
        console.log(error);
        callback({ status: 'failed' }); 
      }
    });

    
    // message recovery (yes its complicated)
    const lastSeen = new Date(socket.handshake.auth.lastMsg);

    try {
      // renders the messages sent while user is offline
      const missedMessages = await prisma.message.findMany({
        where: {createdAt: { gt: lastSeen }, chatRoomId},
        orderBy: { createdAt: "asc" },
        select: {
          content: true,
          createdAt: true,
          user: {select: { name: true }}
        }
      });

      for(let mm of missedMessages) {
        const missedMessage = Message(
          mm.id,
          mm.user.name,
          mm.content,
          mm.createdAt
        );

        socket.emit('chat recover', missedMessage);
        MessageLog(missedMessage, chatRoomId)
      }

    } catch(error) {
      console.log("Something went wrong: ", error);
    }
  });

  return io;
}
