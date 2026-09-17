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

    // Send the uploaded file to the service
    const result = await inferenceService.predictVideo(file.path);

    // Return the prediction to the client
    return res.status(200).json(result);
};

module.exports = predictController;