import { catchAsyncError } from "../middlewares/catchAsyncError.middleware.js";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateJWTToken } from "../utils/jwtToken.js";
import { v2 as cloudinary } from "cloudinary";

export const signup = catchAsyncError(async (req, res, next) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide complete details",
        });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "invalid email format",
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long",
        });
    }

    const isemailExist = await User.findOne({ email });
    if (isemailExist) {
        return res.status(400).json({
            success: false,
            message: "Email already registered",
        });
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        avatar: {
            public_id: "",
            url: "",
        }
    });

    generateJWTToken(user, "User registered successfully", 201, res);


});
export const signin = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide email and password",
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "invalid email format",
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }
    generateJWTToken(user, "User logged in successfully", 200, res);
});
export const signout = catchAsyncError(async (req, res, next) => {
    res.status(200).cookie("token", "", {
        httpOnly: true,
        maxAge: 0,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development" ? true : false,
    })
        .json({
            success: true,
            message: "User signed out successfully",

        });

});
export const getUser = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user
    });
});
export const updateProfile = catchAsyncError(async (req, res, next) => {
    const { fullName, email } = req.body;
    if (fullName?.trim().length === 0 || email?.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "Fullname and email can't be empty ",
        });
    }

    const avatar = req.files?.avatar;
    let cloudinaryResponse = {};

    if (avatar) {
    try {
        console.log("Avatar received:", !!avatar);
        console.log("Temp path:", avatar.tempFilePath);
        console.log("File size:", avatar.size);
        console.log("MIME type:", avatar.mimetype);

        cloudinaryResponse = await cloudinary.uploader.upload(
            avatar.tempFilePath,
            {
                folder: "chat-app-avatars",
                resource_type: "image",
            }
        );

        console.log("Upload successful:", {
            public_id: cloudinaryResponse.public_id,
            secure_url: cloudinaryResponse.secure_url,
        });

    } catch (error) {
        console.error("Cloudinary error details:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
            error: error.error,
        });

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}if (avatar) {
    try {
        console.log("Avatar received:", !!avatar);
        console.log("Temp path:", avatar.tempFilePath);
        console.log("File size:", avatar.size);
        console.log("MIME type:", avatar.mimetype);

        cloudinaryResponse = await cloudinary.uploader.upload(
            avatar.tempFilePath,
            {
                folder: "chat-app-avatars",
                resource_type: "image",
            }
        );

        console.log("Upload successful:", {
            public_id: cloudinaryResponse.public_id,
            secure_url: cloudinaryResponse.secure_url,
        });

    }catch (error) {
    console.dir(error, { depth: null });

    console.log("Response:", error.response);
    console.log("Headers:", error.response?.headers);
    console.log("Body:", error.response?.data);

    return res.status(500).json({
        success: false,
        message: error.message,
    });
}
}

    let data = {
        fullName,
        email,
    };

    if (avatar && cloudinaryResponse?.public_id && cloudinaryResponse?.secure_url) {
        data.avatar = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        };
    }

    let user = await User.findByIdAndUpdate(req.user._id, data, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: "profile updated successfully",
        user,
    })
});