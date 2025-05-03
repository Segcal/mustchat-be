import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New user connected: ", socket.id);

    // Sending a message to a specific user by socket ID
    socket.on("send_message", (data) => {
      const { receiver_id, text, sender_id, sender_name, receiver_name, time } = data;
      const message = {
        sender_id,
        sender_name,
        receiver_name,
        receiver_id,
        text,
        time,
      };
      io.to(receiver_id).emit("receive_message", JSON.stringify(message));
      console.log(sender_id + " => " + receiver_id);
    });

    // Handle disconnection (Moved inside io.on("connection", ...) )
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export default setupSocket;

