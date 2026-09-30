import path from "path";

// Absolute path to the uploads/ directory at the project root,
// so it works no matter which directory the server is started from
export const UPLOADS_DIR = path.join(import.meta.dirname, "..", "uploads");

