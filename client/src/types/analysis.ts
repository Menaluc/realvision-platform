import type { PredictionResult } from "./prediction";

// The video the user picked, before it is analyzed
export interface VideoSelection {
    file: File;
    duration: number | null;
}

// Client-side details about the analyzed video (not returned by the server)
export interface VideoInfo {
    file: File;
    name: string;
    type: string;
    size: number;
    duration: number | null;
}

// Everything known about one finished analysis
export interface Analysis {
    video: VideoInfo;
    prediction: PredictionResult;
}
