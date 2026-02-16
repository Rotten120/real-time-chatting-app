import express from "express"
import { initSocket } from "./socket.js"
import { prisma } from "./prismaClient.js"

import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const app = express();
const server = createServer(app);
const io = initSocket(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());

app.get("/c/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  if(!conversation) {
    return res.sendStatus(404);
  }
  
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

app.post("/:convo_name", async (req, res) => {
  const params = req.params;
  const conversation = await prisma.conversation.create({
    data: { name: params.convo_name }
  });
  res.send(conversation);
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
