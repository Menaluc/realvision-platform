const path = require("path");

// Absolute path to the uploads/ directory at the project root,
// so it works no matter which directory the server is started from
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

module.exports = { UPLOADS_DIR };
