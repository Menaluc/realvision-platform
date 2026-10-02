import express from "express";
import multer from "multer";
import { UPLOADS_DIR } from "../config.js";
import { HttpError } from "../errors.js";

import predictController from "../controllers/predict.controller.js";

const router = express.Router();

// Set where uploaded files will be saved
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },

    // Give each file a unique name
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

// First check: reject files the client doesn't declare as video
// (the real content is checked in the controller, after upload)
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new HttpError(415, "Only video files are allowed"));
    }
};

// Multer settings
const upload = multer({
    storage,
    fileFilter,
    limits: {
        // Max file size: 20MB
        fileSize: 20 * 1024 * 1024
    }
});

// Upload one video file
router.post(
    "/predict",
    upload.single("video"),
    predictController
);

export default router;