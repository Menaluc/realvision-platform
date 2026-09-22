const fs = require("fs/promises");
const inferenceService = require("../services/inference.service");

// Handle prediction request
const predictController = async (req, res) => {
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
            error: error.message
        });

    } finally {
        try {
            await fs.unlink(file.path);
            console.log("Uploaded file deleted:", file.path);

        } catch (cleanupError) {
            console.error(
                "Failed to delete uploaded file:",
                cleanupError.message
            );
        }
    }
};

module.exports = predictController;