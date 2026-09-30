const express = require("express");
const multer = require("multer");
const { UPLOADS_DIR } = require("../config");

const predictController = require("../controllers/predict.controller");

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

// Accept only video files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Only video files are allowed"), false);
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

module.exports = router;