import { Server } from "socket.io"
import { prisma } from "./prismaClient.js"

export function initSocket(server) {
  const io = new Server(server);

  io.on("connection", async (socket) => {
        
    socket.on('chat message', async (msg, callback) => {
      const message = await prisma.message.create({
        data: { content: msg }
      });

      console.log("Message: ", message.content, " ", message.createdAt);
      io.emit('chat message', message.content, message.createdAt);
      callback({ status: 'ok' });
    });

    try {

      const lastSeen = new Date(socket.handshake.auth.lastMsg);

      // the lastSeen condition should be changed
      if(lastSeen == new Date(2000, 10, 30)) {
        // renders the last 10 msgs user have seen
        const prev_messages = await prisma.message.findMany({
          where: { createdAt: { lte: lastSeen } },
          orderBy: { createdAt: "desc" },
          take: 10
        });
      
        if(prev_messages.length > 0) {
          for(let pmsg of prev_messages.reverse()) {
            console.log('rendered: ', pmsg.content, " : date: ", pmsg.createdAt);
            socket.emit('chat message', pmsg.content, pmsg.createdAt)
          }
        }
      }
      // renders the messages sent while user is offline
      const missed_messages = await prisma.message.findMany({
        where: { createdAt: { gt: lastSeen } },
        orderBy: { createdAt: "asc" }
      });

      for(let msg of missed_messages) {
        console.log('rendered: ', msg.content, " : date: ", msg.createdAt);
        socket.emit('chat message', msg.content, msg.createdAt);
      }

    } catch(error) {
      console.log("Something went wrong: ", error);
    }

  });

  return io;
}
