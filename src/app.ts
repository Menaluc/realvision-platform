import fs from "fs";
import path from "path";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import morgan from "morgan";
import { UPLOADS_DIR } from "./config.js";
import { HttpError } from "./errors.js";

import predictRouter from "./routes/predict.routes.js";

// Ensure the uploads/ directory exists before any upload is handled
// (not guaranteed to exist on a fresh clone/deploy since it's gitignored)
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();

// Log every request: method, path, status, response time
// (skipped in tests to keep the test output clean)
app.use(morgan("dev", {
    skip: () => process.env.NODE_ENV === "test"
}));

// Serve the built React client (client/dist) at "/"
app.use(express.static(path.join(import.meta.dirname, "..", "client", "dist")));

// Use prediction routes under /api
app.use("/api", predictRouter);

// Unknown API routes return JSON instead of Express's default HTML page
app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({
        error: "Not found"
    });
});

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

        // Other upload problems are client mistakes (e.g. wrong field name)
        return res.status(400).json({
            error: err.message
        });
    }

    // Unexpected errors: log the details, but don't expose them to the client
    console.error("Unhandled error:", err);

    return res.status(500).json({
        error: "Something went wrong"
    });
});

export default app;
