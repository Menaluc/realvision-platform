import fs from "fs";
import path from "path";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { UPLOADS_DIR } from "./config.js";
import { HttpError } from "./errors.js";

import predictRouter from "./routes/predict.routes.js";

// Ensure the uploads/ directory exists before any upload is handled
// (not guaranteed to exist on a fresh clone/deploy since it's gitignored)
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();

// Serve the frontend (public/index.html) at "/"
app.use(express.static(path.join(import.meta.dirname, "..", "public")));

// Use prediction routes under /api
app.use("/api", predictRouter);

// Handle upload errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({
            error: err.message
        });
    }

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

export default app;
