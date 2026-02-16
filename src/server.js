import express from "express"
import { initSocket } from "./socket.js"
import { prisma } from "./prismaClient.js"

import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import chatRouter from "./api/chatRoutes.js"

const app = express();
const server = createServer(app);
const io = initSocket(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(join(__dirname, "..", "public")));

app.get("/c/:chatRoomId", async (req, res) => {
  const { chatRoomId } = req.params;
  const chatroom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId }
  });

  if(!chatroom) {
    return res.sendStatus(404);
  }
  
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

app.use("/chat", chatRouter);

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
