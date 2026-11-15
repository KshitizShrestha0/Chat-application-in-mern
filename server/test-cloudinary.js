import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

config({ path: "./config/config.env" });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    debug: true,
});

try {
    const result = await cloudinary.uploader.upload(
        "./test-image.webp",
        {
            folder: "test-uploads",
            resource_type: "image",
        }
    );

    console.log("UPLOAD SUCCESS:", result.secure_url);

} catch (error) {
    console.log("UPLOAD FAILED:");
    console.dir(error, { depth: null });
}