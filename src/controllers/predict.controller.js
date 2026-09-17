const predictController = (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    return res.status(200).json({
        message: "Video received",
        file: file.originalname
    });
}
module.exports = predictController;