import fs from "fs";
import request from "supertest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import app from "../src/app.js";
import { UPLOADS_DIR } from "../src/config.js";
import type { PredictionResult } from "../src/types/prediction.js";

// A tiny fake video (the content doesn't matter, only the mimetype)
const fakeVideo = Buffer.from("fake video content");

describe("POST /api/predict", () => {
    beforeEach(() => {
        process.env.MODEL_SERVICE_URL = "http://model-service.test/predict";
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns 400 when no file is uploaded", async () => {
        const res = await request(app).post("/api/predict");

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("No file uploaded");
    });

    it("rejects files that are not videos", async () => {
        const res = await request(app)
            .post("/api/predict")
            .attach("video", Buffer.from("hello"), {
                filename: "notes.txt",
                contentType: "text/plain"
            });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Only video files are allowed");
    });

    it("returns 413 when the file is larger than 20MB", async () => {
        const bigVideo = Buffer.alloc(20 * 1024 * 1024 + 1);

        const res = await request(app)
            .post("/api/predict")
            .attach("video", bigVideo, {
                filename: "big.mp4",
                contentType: "video/mp4"
            });

        expect(res.status).toBe(413);
        expect(res.body.error).toBe("Maximum file size is 20MB");
    });

    it("returns the model prediction and deletes the uploaded file", async () => {
        const prediction: PredictionResult = {
            prediction: "real",
            confidence: 0.93,
            probabilities: { real: 0.93, fake: 0.07 }
        };

        // Replace the real call to FastAPI with a fake response
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => prediction
        });
        vi.stubGlobal("fetch", fetchMock);

        const filesBefore = fs.readdirSync(UPLOADS_DIR);

        const res = await request(app)
            .post("/api/predict")
            .attach("video", fakeVideo, {
                filename: "clip.mp4",
                contentType: "video/mp4"
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(prediction);
        expect(fetchMock).toHaveBeenCalledWith(
            "http://model-service.test/predict",
            expect.objectContaining({ method: "POST" })
        );

        // The uploaded file must be cleaned up
        expect(fs.readdirSync(UPLOADS_DIR)).toEqual(filesBefore);
    });

    it("returns 500 when the model service fails", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: false,
            status: 503
        }));

        const res = await request(app)
            .post("/api/predict")
            .attach("video", fakeVideo, {
                filename: "clip.mp4",
                contentType: "video/mp4"
            });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("FastAPI returned status 503");
    });
});
