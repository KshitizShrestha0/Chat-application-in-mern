import { catchAsyncError } from "../middlewares/catchAsyncError.middleware.js"
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { v2 as cloudinary } from "cloudinary";
import { getReceiverSocketId, io } from "../utils/socket.js";


export const getAllUsers = catchAsyncError(async (req, res, next) => {
    const myId = req.user._id;

    const filteredUsers = await User.find({
        _id: { $ne: myId }
    }).select("-password");

    res.status(200).json({
        success: true,
        users: filteredUsers,
    });
});

export const getMessages = catchAsyncError(async (req, res, next) => {
    const receiverId = req.params.id;
    const myId = req.user._id;
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        return res.status(404).json({
            success: false,
            message: "Receiver Id invalid.",
        });
    }
    const messages = await Message.find({
        $or: [
            { senderId: myId, receiverId: receiverId },
            { senderId: receiverId, receiverId: myId },
        ],
    }).sort({ createdAt: 1 });
    res.status(200).json({
        success: true,
        messages,
    });

});


export const sendMessage = catchAsyncError(async (req, res, next) => {
    const { text } = req.body;
    const media = req.files?.media;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        return res.status(404).json({
            success: false,
            message: "Receiver Id invalid.",
        });
    }
    const sanitizedText = text?.trim() || "";
    if (!sanitizedText && !media) {
        return res.status(400).json({
            success: false,
            message: "Cannot send empty message.",
        });
    }

    let mediaUrl = "";
    if (media) {
        try {
            const uploadResponse = await cloudinary.uploader.upload(media.tempFilePath, {
                resource_type: "auto", // auto detects the file type (image, video, etc.)
                folder: "chat-app-media",
                transformation: [
                    { width: 1080, height: 1080, crop: "limit" },
                    { quality: "auto" },
                    { fetch_format: "auto" }
                ],
            });
            mediaUrl = uploadResponse?.secure_url;
        } catch (error) {
            console.error(" Cloudinary upload error :", error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }

    }

    const newMessage = await Message.Create({
        senderId,
        receiverId,
        text: sanitizedText,
        media: mediaUrl,
    });

    const receiverSocketId = getReceiverSocketId(receiverId)
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("new message", newMessage)
    }
    res.status(201).json(newMessage);
});
