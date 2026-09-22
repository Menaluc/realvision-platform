require("dotenv").config();

const express = require("express");
const multer = require("multer");

const predictRouter = require("./routes/predict.routes");

const app = express();

app.get("/", (req, res) => {
    res.send("RealVision API");
});

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

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});