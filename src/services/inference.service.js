import fs from "fs/promises";

// Process the uploaded video
const predictVideo = async (filePath) => {
    if (!filePath) {
        throw new Error("filePath is required");
    }

    console.log("Processing file:", filePath);

    // Read the uploaded video from disk
    const fileBuffer = await fs.readFile(filePath);

    // Convert the file buffer into a Blob
    const videoBlob = new Blob([fileBuffer], {
        type: "video/mp4"
    });

    // Build multipart/form-data request
    const formData = new FormData();

    formData.append("video", videoBlob, "video.mp4");

    // Get FastAPI URL from environment variables
    const modelServiceUrl = process.env.MODEL_SERVICE_URL;

    if (!modelServiceUrl) {
        throw new Error("MODEL_SERVICE_URL is not configured");
    }

    // Send the video to FastAPI
    const response = await fetch(modelServiceUrl, {
        method: "POST",
        body: formData
    });

    // Handle FastAPI errors
    if (!response.ok) {
        throw new Error(
            `FastAPI returned status ${response.status}`
        );
    }

    // Parse FastAPI response
    const result = await response.json();

    return result;
};

export {
    predictVideo
};