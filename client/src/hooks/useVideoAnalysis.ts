import { useReducer } from "react";
import { predictVideo } from "../api/predict";
import { readDuration } from "../utils/video";
import { analysisReducer, initialAnalysisState } from "./analysisReducer";

// Owns the upload → analyze → result flow
export function useVideoAnalysis() {
    const [state, dispatch] = useReducer(analysisReducer, initialAnalysisState);

    async function selectFile(file: File) {
        dispatch({ type: "fileSelected", file });
        const duration = await readDuration(file);
        dispatch({ type: "durationRead", file, duration });
    }

    async function analyze() {
        if (state.status === "done" || state.status === "analyzing") return;

        const file = state.selection?.file;
        if (!file) {
            dispatch({ type: "analysisFailed", error: "Please select a video first" });
            return;
        }

        dispatch({ type: "analysisStarted" });

        try {
            const prediction = await predictVideo(file);
            dispatch({ type: "analysisSucceeded", file, prediction });
        } catch (error) {
            dispatch({
                type: "analysisFailed",
                error: error instanceof Error ? error.message : "Analysis failed"
            });
        }
    }

    function reset() {
        dispatch({ type: "reset" });
    }

    return { state, selectFile, analyze, reset };
}
