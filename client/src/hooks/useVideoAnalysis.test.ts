import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PredictionResult } from "../types/prediction";
import { useVideoAnalysis } from "./useVideoAnalysis";

const video = new File(["fake video content"], "clip.mp4", { type: "video/mp4" });

const fakePrediction: PredictionResult = {
    prediction: "fake",
    confidence: 0.92,
    probabilities: { real: 0.08, fake: 0.92 }
};

function stubFetch(status: number, body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("useVideoAnalysis", () => {
    it("starts idle with no selection", () => {
        const { result } = renderHook(() => useVideoAnalysis());

        expect(result.current.state).toEqual({ status: "idle", selection: null });
    });

    it("reports an error when analyzing without a file", async () => {
        const fetchMock = stubFetch(200, fakePrediction);
        const { result } = renderHook(() => useVideoAnalysis());

        await act(() => result.current.analyze());

        expect(result.current.state).toMatchObject({ status: "error", error: "Please select a video first" });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("uploads the selected file and stores the analysis", async () => {
        const fetchMock = stubFetch(200, fakePrediction);
        const { result } = renderHook(() => useVideoAnalysis());

        act(() => { result.current.selectFile(video); });
        await act(() => result.current.analyze());

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("/api/predict");
        expect((init.body as FormData).get("video")).toBe(video);

        expect(result.current.state).toEqual({
            status: "done",
            analysis: {
                video: { file: video, name: "clip.mp4", type: "video/mp4", size: video.size, duration: null },
                prediction: fakePrediction
            }
        });
    });

    it("keeps the selection and shows the server error when the request fails", async () => {
        stubFetch(413, { error: "Maximum file size is 20MB" });
        const { result } = renderHook(() => useVideoAnalysis());

        act(() => { result.current.selectFile(video); });
        await act(() => result.current.analyze());

        expect(result.current.state).toMatchObject({
            status: "error",
            error: "Maximum file size is 20MB",
            selection: { file: video }
        });
    });

    it("returns to idle on reset", async () => {
        stubFetch(200, fakePrediction);
        const { result } = renderHook(() => useVideoAnalysis());

        act(() => { result.current.selectFile(video); });
        await act(() => result.current.analyze());
        act(() => result.current.reset());

        expect(result.current.state).toEqual({ status: "idle", selection: null });
    });
});
