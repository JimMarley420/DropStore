import { z } from "zod";

// Define file type validation
export const fileTypeSchema = z.object({
  mimeType: z.string(),
  extension: z.string(),
  size: z.number().int().positive(),
});

// Define maximum file size (10GB in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

// Define allowed file types with extensions
export const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/rtf",
  ],
  videos: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  audio: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm"],
  archives: [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
  ],
};

// Flatten the allowed file types for easy checking
export const ALLOWED_MIME_TYPES = Object.values(ALLOWED_FILE_TYPES).flat();
