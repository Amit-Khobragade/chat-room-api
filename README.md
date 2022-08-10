# chat-room-api

This project represents a simple backend for the chatroom app which includes functionalities like:

- creating a new room,
- joining a room
- sending a message
- getting the chat history on entry in a chat room
- hashing the passwords
- quitting a room

## index.js:

This file handles ws events and chooses the right flow for a request.

## src/rooms.js

This file provides functionalities to index.js in form of functions. The functions in this file are well documented and it acts as
a point of abstraction between the websocket and database/memory. It handles complex functions like creating user/rooom,
joining rooms sending messages and exiting the room.

## src/db.js

This file handles the creation of schemas and models for the database management.
