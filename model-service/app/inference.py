import torch
from pathlib import Path

from app.model_arch import VideoOnlyBaseline
from app.preprocess import preprocess_video


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "baseline_best.pt"
)
# Create model
model = VideoOnlyBaseline()

# Load checkpoint
checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)

model.load_state_dict(checkpoint["model"])

model.to(DEVICE)

model.eval()


def predict_video(video_path):
    # Preprocess video
    video_tensor = preprocess_video(video_path)

    # Add batch dimension:
    # (16, 3, 224, 224)
    # →
    # (1, 16, 3, 224, 224)
    video_tensor = video_tensor.unsqueeze(0)

    video_tensor = video_tensor.to(DEVICE)

    # Disable gradient calculation during inference
    with torch.no_grad():
        logits = model(video_tensor)

        probabilities = torch.softmax(
            logits,
            dim=1
        )

    real_probability = probabilities[0][0].item()
    fake_probability = probabilities[0][1].item()

    if fake_probability > real_probability:
        prediction = "fake"
        confidence = fake_probability
    else:
        prediction = "real"
        confidence = real_probability

    return {
        "prediction": prediction,
        "confidence": confidence,
        "probabilities": {
            "real": real_probability,
            "fake": fake_probability
        }
    }
