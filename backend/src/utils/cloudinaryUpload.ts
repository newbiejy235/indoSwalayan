import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export const uploadProductPhoto = (
  buffer: Buffer
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "indoSwalayan",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(
            new Error("Gagal mendapatkan hasil upload Cloudinary")
          );
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};