require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { UPLOADS_DIR } = require("./config");


const predictRouter = require("./routes/predict.routes");

// Ensure the uploads/ directory exists before any upload is handled
// (not guaranteed to exist on a fresh clone/deploy since it's gitignored)
fs.mkdirSync(UPLOADS_DIR, { recursive: true });



const app = express();

// Serve the frontend (public/index.html) at "/"
app.use(express.static(path.join(__dirname, "..", "public")));

// Use prediction routes under /api
app.use("/api", predictRouter);

// Handle Multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                error: "Maximum file size is 20MB"
            });
        }
    }

    return res.status(500).json({
        error: err.message || "Something went wrong"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});