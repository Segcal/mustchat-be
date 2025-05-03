import Message from "../models/MessagesModel.js";
import { mkdirSync, renameSync } from "fs";

export const getMessages = async (request, response, next) => {
  try {
    const user1 = request.userId;
    const user2 = request.body.id;

    // Validate input
    if (!user1 || !user2) {
      return response.status(400).json({ error: "Both user id's are required" });
    }

    // Log the user IDs for debugging
    console.log("Fetching messages between", user1, "and", user2);

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });  // Ensure messages are sorted by timestamp (ascending)

    // Check if no messages are found
    if (messages.length === 0) {
      console.log("No messages found between", user1, "and", user2);
    }

    return response.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
};


export const uploadFile = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: "File is required" });
    }
    const date = Date.now();
    let fileDir = `uploads/files/${date}`;
    let fileName = `${fileDir}/${request.file.originalname}`;

    mkdirSync(fileDir, { recursive: true });

    renameSync(request.file.path, fileName);
    return response.status(200).json({ filePath: fileName });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
};
