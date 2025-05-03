import User from "../models/UserModel.js";
import Channel from "../models/ChannelModel.js"; 
import mongoose from "mongoose";
import Chennel from "../models/ChannelModel.js";

export const createChannel = async (request, response, next) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;

    const admin = await User.findById(userId);
    if (!admin) {
      return response.status(404).json({ error: "Admin not found" });
    }

    const validMembers = await User.find({ _id: { $in: members } });
    if (validMembers.length !== members.length) {
      return response.status(400).json({ error: "Invalid members" });
    }

    const newChannel = new Channel({
      name,
      members,
      admin: userId,
    });

    await newChannel.save();

    return response.status(201).json({
      message: "Channel created successfully",
      channel: newChannel,
    });
  } catch (error) {
    console.error("CreateChannel error:", error.message, error.stack);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export const getUserChannels = async (request, response, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(request.userId);
    const channels = await Chennel.find({
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return response.status(201).json({
      channels,
    });
  } catch (error) {
    console.error("CreateChannel error:", error.message, error.stack);
    return response.status(500).json({ error: "Internal server error" });
  }
};
