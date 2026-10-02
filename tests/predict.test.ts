import fs from "fs";
import request from "supertest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import app from "../src/app.js";
import { UPLOADS_DIR } from "../src/config.js";
import type { PredictionResult } from "../src/types/prediction.js";

// Minimal MP4 header ("ftyp" box) - enough for the content check to detect a real MP4
const mp4Video = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x18]),
    Buffer.from("ftypisom"),
    Buffer.from([0x00, 0x00, 0x02, 0x00]),
    Buffer.from("isommp41")
]);

// Minimal QuickTime header - detected as video/quicktime (.mov)
const movVideo = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x14]),
    Buffer.from("ftypqt  "),
    Buffer.from([0x00, 0x00, 0x02, 0x00]),
    Buffer.from("qt  ")
]);

// Claims to be a video, but the bytes are not a video file
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

    it("returns 400 when the file is sent under the wrong field name", async () => {
        const res = await request(app)
            .post("/api/predict")
            .attach("file", mp4Video, {
                filename: "clip.mp4",
                contentType: "video/mp4"
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Unexpected file field");
    });

    it("returns 415 when the file type is not a video", async () => {
        const res = await request(app)
            .post("/api/predict")
            .attach("video", Buffer.from("hello"), {
                filename: "notes.txt",
                contentType: "text/plain"
            });

        expect(res.status).toBe(415);
        expect(res.body.error).toBe("Only video files are allowed");
    });

    it("returns 415 when the file content is not a real video", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const filesBefore = fs.readdirSync(UPLOADS_DIR);

        const res = await request(app)
            .post("/api/predict")
            .attach("video", fakeVideo, {
                filename: "clip.mp4",
                contentType: "video/mp4"
            });

        expect(res.status).toBe(415);
        expect(res.body.error).toBe("File content is not a valid video");

        // The model service must not be called, and the file must be cleaned up
        expect(fetchMock).not.toHaveBeenCalled();
        expect(fs.readdirSync(UPLOADS_DIR)).toEqual(filesBefore);
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
            .attach("video", mp4Video, {
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

    it("sends the detected video type to the model service", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({})
        });
        vi.stubGlobal("fetch", fetchMock);

        // The browser-reported type is wrong on purpose: the detected type must win
        await request(app)
            .post("/api/predict")
            .attach("video", movVideo, {
                filename: "clip.mp4",
                contentType: "video/mp4"
            });

        const body = fetchMock.mock.calls[0][1].body as FormData;
        const sentFile = body.get("video") as File;

        expect(sentFile.type).toBe("video/quicktime");
        expect(sentFile.name).toBe("video.mov");
    });

    it("returns 502 when the model service responds with an error", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: false,
            status: 500
        }));

        const res = await request(app)
            .post("/api/predict")
            .attach("video", mp4Video, {
                filename: "clip.mp4",
                contentType: "video/mp4"
            });

        expect(res.status).toBe(502);
        expect(res.body.error).toBe("Model service returned status 500");
    });

    it("returns 503 when the model service is unreachable", async () => {
        // This is what fetch throws when nothing is listening on the URL
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

        const filesBefore = fs.readdirSync(UPLOADS_DIR);

        const res = await request(app)
            .post("/api/predict")
            .attach("video", mp4Video, {
                filename: "clip.mp4",
                contentType: "video/mp4"
            });

        expect(res.status).toBe(503);
        expect(res.body.error).toBe("Model service is unavailable");
        expect(fs.readdirSync(UPLOADS_DIR)).toEqual(filesBefore);
    });
});

describe("unknown API routes", () => {
    it("returns 404 as JSON", async () => {
        const res = await request(app).get("/api/does-not-exist");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Not found");
    });
});
