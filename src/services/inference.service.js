// Process the uploaded video
const predictVideo = async (filePath) => {
    console.log("Processing file:", filePath);

    // Temporary fake result until FastAPI is connected
    return {
        prediction: "fake",
        confidence: 0.92
    };
};

module.exports = {
    predictVideo
};