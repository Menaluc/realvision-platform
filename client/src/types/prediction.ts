// Shape of the prediction returned by POST /api/predict
// (mirrors PredictionResult in the Express server)
export interface PredictionResult {
    prediction: "real" | "fake";
    confidence: number;
    probabilities: {
        real: number;
        fake: number;
    };
}
