const app = require("express")();
require("dotenv").config();
const http = require("http");
const ws = require("ws");
const {
  createRoom,
  createUser,
  joinRoom,
  quitRoom,
  sendMessage,
  hash,
} = require("./src/rooms");

const server = http.createServer(app);
const wss = new ws.WebSocketServer({ server });

// # --- Connection
wss.on("connection", function (socket, message) {
  // # --- error
  socket.on("error", socket.close);

  const user = createUser(socket, message.headers["user-name"]);

  // # --- Message
  socket.on("message", async function (message) {
    let data = null;

    try {
      data = JSON.parse(message);
    } catch (err) {
      socket.emit("error", 4001, "Bad Request");
      return;
    }

    if (data.roomId) {
      if (data.message) sendMessage(user, data);
      else if (data.isQuitting) quitRoom(user, data);
    }

    if (data.roomName && data.pswd) {
      if (
        !/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#!@$^-]).{8,15}$/.test(
          data.pswd
        )
      ) {
        user.socket.send(JSON.stringify({ err: 400, message: "Bad Request" }));
        return;
      }

      data.pswd = hash(data.pswd);

      data.isCreation && (await createRoom(data));
      joinRoom(user, data);
    }
  });

  // # --- close
  socket.on("close", (...reason) => console.log(reason.toString()));
});

server.listen(process.env.PORT);
