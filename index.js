import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/AuthRoutes.js";
import constactsRoutes from "./routes/ContactRoutes.js";
import setupSocket from "./socket.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

app.use(
    cors({
        origin: process.env.ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);



app.use(cookieParser());
app.use(express.json());

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use("/api/channel", channelRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/contacts", constactsRoutes);
app.use("/api/messages", messagesRoutes);

// Connect to MongoDB before starting the server
mongoose.connect(databaseURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("DB connection established");
    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    setupSocket(server);
})
.catch((err) => console.error("Database connection error:", err));
