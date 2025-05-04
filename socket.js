import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Channel from "./models/ChannelModel.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: 'https://mustchat-fe.vercel.app',
      method: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  const prohibitedWords = [
    "mumu",
    "idiot",
    "dumb",
    "fool",
    "stupid",
    "idiotic",
  ];

  const containsProhibitedWord = (messageText) => {
    const lowerCaseMessage = messageText.toLowerCase();
    return prohibitedWords.some((word) => lowerCaseMessage.includes(word));
  };

  const disconnect = (socket) => {
    console.log(`Client Disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  const sendChannelMessage = async (message) => {
    const { channelId, sender, content, messageType, fileUrl } = message;

    const createdMessage = await Message.create({
      sender,
      content,
      recipient: null,
      messageType,
      fileUrl,
      channelId,
      timestamp: new Date(),
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();

    console.log("Message sent to channel:", messageData);

    await Channel.findByIdAndUpdate(channelId, {
      $push: { messages: createdMessage._id },
    });

    const channel = await Channel.findById(channelId).populate(
      // "members",
      // "id email firstName lastName image color"
      "members"
    );

    const finalData = { ...messageData._doc, channelId: channel._id };

    if (channel && channel.members) {
      channel.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("receive-channel-message", finalData);
        }
      });
      const adminSocketId = userSocketMap.get(channel.admin._id.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit("receive-channel-message", finalData);
      }
    }

    if (containsProhibitedWord(message.content)) {
      console.log(`Message from ${message.sender} contains prohibited words.`);
      io.to(message.channelId).emit("messageFailed", {
        message: "Your message contains prohibited words and cannot be sent.",
        originalMessage: message,
      });
      return;
    }

    try {
      const createdMessage = await Message.create(message);

      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("channelId", "id name image color");

      io.to(message.channelId).emit("receiveChannelMessage", messageData);
    } catch (error) {
      console.error("Error storing channel message in DB:", error);
      io.to(message.channelId).emit("messageFailed", {
        message: "Failed to send channel message due to a server error.",
        originalMessage: message,
        error: error.message,
      });
    }
  };

  const checkMessageAndSend = async (message, socket) => {
    console.log("Received message:", message);

    if (!message.sender) {
      console.error("Error: sender is missing");
      return;
    }

    if (containsProhibitedWord(message.content)) {
      console.log(`Message from ${message.sender} contains prohibited words.`);
      socket.emit("messageFailed", {
        message: "Your message contains prohibited words and cannot be sent.",
        originalMessage: message,
      });
      return;
    }

    try {
      const senderSocketId = userSocketMap.get(message.sender);
      const recipientSocketId = userSocketMap.get(message.recipient);

      const createdMessage = await Message.create(message);

      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", messageData);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", messageData);
      }
    } catch (error) {
      console.error("Error storing message in DB:", error);
      socket.emit("messageFailed", {
        message: "Failed to send message due to a server error.",
        originalMessage: message,
        error: error.message,
      });
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User ID not provided during connection");
    }

    socket.on("sendMessage", (message) => checkMessageAndSend(message, socket));
    socket.on("send-channel-message", sendChannelMessage);
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
