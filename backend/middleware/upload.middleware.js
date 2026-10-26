import multer from "multer";

// Use in-memory buffer storage so no temp files are created on disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file && file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WEBP, GIF) are allowed."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max limit
  },
});

export default upload;
