import express from "express"
import cookieParser from "cookie-parser"

import { initSocket } from "./socket.js"
import { prisma } from "./lib/prismaClient.js"
import { getPath } from "./lib/dirname.js"

import { createServer } from "node:http"

import { authMiddleware } from "./middleware/authMiddleware.js"
import { chatMiddleware } from "./middleware/chatMiddleware.js"

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
app.use("/chat", chatRoutes);
app.use("/user", authMiddleware, userRoutes);

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
