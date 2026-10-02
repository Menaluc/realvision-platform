import type { Analysis, VideoSelection } from "../types/analysis";
import type { PredictionResult } from "../types/prediction";

export type AnalysisState =
    | { status: "idle"; selection: VideoSelection | null }
    | { status: "analyzing"; selection: VideoSelection }
    | { status: "error"; selection: VideoSelection | null; error: string }
    | { status: "done"; analysis: Analysis };

export type AnalysisAction =
    | { type: "fileSelected"; file: File }
    | { type: "durationRead"; file: File; duration: number | null }
    | { type: "analysisStarted" }
    | { type: "analysisSucceeded"; file: File; prediction: PredictionResult }
    | { type: "analysisFailed"; error: string }
    | { type: "reset" };

export const initialAnalysisState: AnalysisState = { status: "idle", selection: null };

export function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
    switch (action.type) {
        case "fileSelected":
            if (state.status === "done") return state;
            return { ...state, selection: { file: action.file, duration: null } };

        case "durationRead":
            // Ignore a late result for a file that is no longer selected
            if (state.status === "done" || state.selection?.file !== action.file) return state;
            return { ...state, selection: { ...state.selection, duration: action.duration } };

        case "analysisStarted":
            if (state.status === "done" || state.status === "analyzing" || !state.selection) return state;
            return { status: "analyzing", selection: state.selection };

        case "analysisSucceeded": {
            if (state.status !== "analyzing") return state;
            const { file } = action;
            // The selection may have changed while the request was in flight
            const duration = state.selection.file === file ? state.selection.duration : null;
            return {
                status: "done",
                analysis: {
                    video: { file, name: file.name, type: file.type, size: file.size, duration },
                    prediction: action.prediction
                }
            };
        }

        case "analysisFailed":
            if (state.status === "done") return state;
            return { status: "error", selection: state.selection, error: action.error };

        case "reset":
            return initialAnalysisState;
    }
}
