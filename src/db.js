const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL);

const roomSchema = new mongoose.Schema({
  room_name: "string",
  room_password: "string",
});

const messageSchema = new mongoose.Schema({
  roomId: "string",
  userName: "string",
  message: "string",
  createdAt: { type: Date, default: Date.now },
});

const roomModel = mongoose.model("rooms", roomSchema);
const messageModel = mongoose.model("messages", messageSchema);
module.exports = { roomModel, messageModel };
