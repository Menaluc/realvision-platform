# RealVision

Deepfake video detection platform (backend API, with a client and cloud deployment planned).

A client uploads a video, the Node.js API validates and forwards it to a Python ML inference service, and the predicted label (`real` / `fake`) with confidence is returned as JSON.

## Architecture

```text
Client → Node.js / Express (Multer) → FastAPI → PyTorch model → Prediction
```

- **Node.js / Express** — receives the upload, validates it, forwards it to the model service, cleans up the temp file, and returns the result.
- **FastAPI** — receives the video, preprocesses it into a frame tensor, runs it through the model, and returns a prediction.
- **PyTorch model** — an EfficientNet-B0-based video classifier (`VideoOnlyBaseline`) that averages per-frame features and classifies the video as real or fake.

## Project Structure

```text
src/                          Node.js API
  server.js                   App entry point, error handling
  routes/predict.routes.js    /predict route + Multer upload config
  controllers/predict.controller.js
  services/inference.service.js  Calls the FastAPI service

model-service/                Python ML inference service
  app/main.py                 FastAPI app, /predict endpoint
  app/inference.py            Loads the model, runs inference
  app/preprocess.py           Frame sampling, resizing, normalization
  app/model_arch.py           VideoOnlyBaseline model definition
  models/baseline_best.pt     Trained model checkpoint
  requirements.txt
```

## API

### `POST /api/predict`

Uploads one video for deepfake analysis.

- Content type: `multipart/form-data`
- Field name: `video`
- One video per request
- Maximum size: 20MB
- Video files only (checked by MIME type)

**Example response**

```json
{
  "prediction": "fake",
  "confidence": 0.92,
  "probabilities": {
    "real": 0.08,
    "fake": 0.92
  }
}
```

**Error responses**

| Status | Cause |
| --- | --- |
| 400 | No file uploaded |
| 413 | File exceeds 20MB |
| 500 | Inference service error / unexpected failure |

## Tech Stack

**Node.js API**
- Express 5
- Multer (file uploads)
- dotenv

**ML Inference Service**
- FastAPI + Uvicorn
- PyTorch + Torchvision
- timm (EfficientNet backbone)
- OpenCV, Decord (video/frame handling)
- NumPy, Pillow

## Setup

### Node.js API

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
MODEL_SERVICE_URL=http://localhost:8000/predict
```

Run the server (development):

```bash
npm run devStart
```

Run the server (production):

```bash
npm start
```

Binds to `process.env.PORT` (falls back to `3000` if unset).

The API will be available at `http://localhost:3000`.

### ML Inference Service

```bash
cd model-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run the service (development):

```bash
uvicorn app.main:app --reload --port 8000
```

Run the service (production):

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

No `--reload` in production, and binding to `0.0.0.0` (not the `127.0.0.1` default) is required so the service is reachable from outside the container.

## Status

Under active development.

Implemented:

- Video upload with validation (Multer)
- Node.js → FastAPI integration
- Frame sampling and preprocessing pipeline
- PyTorch video classification model + inference endpoint

Planned:

- Automated tests for the API layer
- Stronger file validation
- Temporary file cleanup guarantees on the FastAPI side
- Request logging and better error responses
- Deployment configuration
