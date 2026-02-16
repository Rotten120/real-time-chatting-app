import { Server } from "socket.io"
import { prisma } from "./prismaClient.js"

export function initSocket(server) {
  const io = new Server(server);

  io.on("connection", async (socket) => {
    const conversationId = socket.handshake.auth.conversationId;

    console.log(`Connected to room ${conversationId}`);

    socket.on('chat message', async (msg, callback) => {
      const message = await prisma.message.create({
        data: { content: msg, conversationId }
      });

      console.log(`rendered to room  ${conversationId}: `, message.content, " : date: ", message.createdAt);
      io.to(conversationId).emit('chat message', message.content, message.createdAt);
      callback({ status: 'ok' });
    });

    // message recovery (yes its complicated)

    try {

      const lastSeen = new Date(socket.handshake.auth.lastMsg);

      // the lastSeen condition should be changed
      // should only execute when first time rendering of client
      // currently, the server sends all prev messages when connecting
      if(lastSeen == new Date(2000, 10, 30)) {
        // renders the last 10 msgs user have seen
        const prev_messages = await prisma.message.findMany({
          where: {
            createdAt: { lte: lastSeen },
            conversationId
          },
          orderBy: { createdAt: "desc" }
        });
      
        if(prev_messages.length > 0) {
          for(let pmsg of prev_messages.reverse()) {
            console.log(`rendered to room  ${conversationId}: `, pmsg.content, " : date: ", pmsg.createdAt);
            socket.emit('chat message', pmsg.content, pmsg.createdAt)
          }
        }
      }

      // renders the messages sent while user is offline
      const missed_messages = await prisma.message.findMany({
        where: {
          createdAt: { gt: lastSeen },
          conversationId
        },
        orderBy: { createdAt: "asc" }
      });

      for(let msg of missed_messages) {
        console.log(`rendered to room  ${conversationId}: `, msg.content, " : date: ", msg.createdAt);
        socket.emit('chat message', msg.content, msg.createdAt);
      }

    } catch(error) {
      console.log("Something went wrong: ", error);
    }

    socket.join(conversationId);
  });

  return io;
}
