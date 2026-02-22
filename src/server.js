import express from "express"
import cookieParser from "cookie-parser"

import { initSocket } from "./socket.js"
import { prisma } from "./lib/prismaClient.js"
import { getPath } from "./lib/dirname.js"

import { createServer } from "node:http"

import { authMiddleware } from "./middleware/authMiddleware.js"

import chatRoutes from "./api/chatRoutes.js"
import authRoutes from "./api/authRoutes.js"
import userRoutes from "./api/userRoutes.js"

const app = express();
const server = createServer(app);
const io = initSocket(server);

app.use(cookieParser());
app.use(express.json());
app.use(express.static(getPath("..", "..", "public")));

app.use("/auth", authRoutes);
app.use("/chat", authMiddleware, chatRoutes);
app.use("/user", authMiddleware, userRoutes);

app.get("/", (req, res) => {
  res.sendFile(getPath("..", "..", "public", "index.html"));
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
