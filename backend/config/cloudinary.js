import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "bbgzkhcx",
  api_key: process.env.CLOUDINARY_API_KEY || "365835998994188",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

/**
 * Uploads a buffer directly to Cloudinary using upload_stream.
 * Resizes and optimizes the image to 400x400 with automatic face gravity cropping.
 *
 * @param {Buffer} fileBuffer - The image file buffer from Multer memoryStorage
 * @param {string} folder - The Cloudinary folder path
 * @returns {Promise<object>} Cloudinary upload result object
 */
export const uploadToCloudinary = (fileBuffer, folder = "codedev/profiles") => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_API_SECRET) {
      return reject(
        new Error(
          "CLOUDINARY_API_SECRET is missing. Please set CLOUDINARY_API_SECRET in backend/.env"
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] Upload stream error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
