// Shape of the response returned by the FastAPI model service (POST /predict)
export interface PredictionResult {
    prediction: "real" | "fake";
    confidence: number;
    probabilities: {
        real: number;
        fake: number;
    };
}
