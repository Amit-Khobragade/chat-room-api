const { v4: uuidv4 } = require("uuid");
const { roomModel, messageModel } = require("./db");
const ws = require("ws");
const crypto = require("node:crypto");

/**
 * @typedef {Object} User
 *  @property {string} name
 *  @property {string} uuid
 *  @property {ws.WebSocket} socket
 *
 * @typedef {Object} RoomAuth
 *  @property {string} roomName
 *  @property {string} pswd
 *
 * @typedef {Object} Room
 *  @property {string} name
 *  @property {string} pswd
 *  @property {Map<string, User>} users
 *
 */

/**
 * @name Rooms#rooms
 * @type {Map<string, Room>}
 */
const rooms = new Map();

/**
 *
 * @param {ws.WebSocket} socket
 * @param {string} userName
 * @returns {User}
 *
 */
function createUser(socket, userName) {
  return userName
    ? {
        name: userName,
        uuid: uuidv4(),
        socket,
      }
    : socket.emit("error", 1007, "invalid request");
}

/**
 *
 * @param {RoomAuth} param0
 *
 */
async function createRoom({ roomName, pswd }) {
  const room = new roomModel({
    room_name: roomName,
    room_password: pswd,
  });
  await room.save();
}

/**
 *
 * @param {string} pswd
 * @returns {string}
 */
function hash(pswd) {
  return crypto
    .createHash("sha256")
    .update(pswd)
    .update(process.env.SALT)
    .digest()
    .toString();
}

/**
 *
 * @param {User} user
 * @param {{roomId: string, message: string}} param1
 *
 */
async function sendMessage(user, { roomId, message }) {
  const room = rooms.get(roomId);

  if (!room || !room.users.has(user.uuid)) {
    user.socket.send(JSON.stringify({ err: 404, message: "rooms DNE" }));
    return;
  }

  const doc = new messageModel({ message, userName: user.name, roomId });
  const msg = await (async ({ id, userName, message, roomId, createdAt }) => ({
    id,
    userName,
    message,
    roomId,
    createdAt,
  }))(await doc.save());
  for (const { socket } of room.users.values()) {
    socket.send(JSON.stringify(msg));
  }
}

/**
 *
 * @param {User} user
 * @param {RoomAuth} param1
 *
 */
async function joinRoom(user, { roomName, pswd }) {
  let room = await roomModel
    .findOne({ room_name: roomName, room_password: pswd })
    .exec();

  // * -- check if rooom exists
  if (!room) {
    user.socket.send(JSON.stringify({ err: 404, message: "room DNE" }));
    return;
  }

  rooms.has(room.id)
    ? rooms.get(room.id).users.set(user.uuid, user)
    : setRoomToMemory(user, room);

  user.socket.send(
    JSON.stringify({
      messages: await messageModel.find({ created_on: Date.now() }),
    })
  );
  // * --- send all an message about joining
  for (const { socket } of rooms.get(room.id).users.values()) {
    socket.send(
      JSON.stringify({
        roomId: room.id,
        userName: user.name,
        isJoining: true,
      })
    );
  }
}

/**
 *
 * @param {User} user
 * @param {{roomId: string}} param1
 */
function quitRoom(user, { roomId }) {
  const room = rooms.get(roomId);
  room?.users.delete(user.uuid);
  if (room && !room.users.size) rooms.delete(roomId);
}

/**
 *
 * @param {User} user
 * @param {{id: string, room_name: string, room_password: string}} param1
 * @requires user
 * @requires param1
 *
 */
function setRoomToMemory(user, { id, room_name, room_password }) {
  rooms.set(id, {
    name: room_name,
    pswd: room_password,
    users: new Map().set(user.uuid, user),
  });
}

module.exports = {
  createRoom,
  createUser,
  joinRoom,
  quitRoom,
  sendMessage,
  hash,
};
