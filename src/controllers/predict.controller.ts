import fs from "fs/promises";
import type { Request, Response } from "express";
import * as inferenceService from "../services/inference.service.js";

// Handle prediction request
const predictController = async (req: Request, res: Response) => {
    const file = req.file;

    // Check that a video was uploaded
    if (!file) {
        return res.status(400).json({
            error: "No file uploaded"
        });
    }

    try {
        // Send the uploaded file path to the inference service
        const result = await inferenceService.predictVideo(file.path);

        // Return prediction result to the client
        return res.status(200).json(result);

    } catch (error) {
        // Handle errors from the service / FastAPI
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error"
        });

    } finally {
        try {
            await fs.unlink(file.path);
            console.log("Uploaded file deleted:", file.path);

        } catch (cleanupError) {
            console.error(
                "Failed to delete uploaded file:",
                cleanupError instanceof Error ? cleanupError.message : cleanupError
            );
        }
    }
};

export default predictController;