import express from "express"
import { initSocket } from "./socket.js"

import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const app = express();
const server = createServer(app);
const io = initSocket(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
