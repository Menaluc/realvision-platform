# RealVision

Deepfake video detection platform: a React client, a Node.js API and a Python ML inference service (cloud deployment planned).

The React client uploads a video, the Node.js API validates and forwards it to a Python ML inference service, and the predicted label (`real` / `fake`) with confidence is returned as JSON.

## Architecture

```text
React client → Node.js / Express (Multer) → FastAPI → PyTorch model → Prediction
```

- **React client** — upload screen and result screen (verdict, confidence, video preview, file details). Express serves its production build.
- **Node.js / Express** — receives the upload, validates it, forwards it to the model service, cleans up the temp file, and returns the result.
- **FastAPI** — receives the video, preprocesses it into a frame tensor, runs it through the model, and returns a prediction.
- **PyTorch model** — an EfficientNet-B0-based video classifier (`VideoOnlyBaseline`) that averages per-frame features and classifies the video as real or fake.

## Project Structure

```text
client/                       React client (Vite + TypeScript)
  src/App.tsx                 Picks the screen from the analysis state
  src/hooks/useVideoAnalysis.ts  Upload → analyze → result flow (useReducer)
  src/hooks/analysisReducer.ts   Analysis state machine
  src/api/                    Calls to the Express API
  src/views/                  UploadView, ResultView
  src/components/             Dropzone, VerdictBadge, MetaGrid, VideoPreview, icons
  src/styles/                 Global and per-view CSS

src/                          Node.js API (TypeScript)
  server.ts                   Entry point, starts the HTTP server
  app.ts                      Express app, serves client/dist, error handling
  config.ts                   Shared paths (uploads directory)
  routes/predict.routes.ts    /predict route + Multer upload config
  controllers/predict.controller.ts
  services/inference.service.ts  Calls the FastAPI service
  types/prediction.ts         PredictionResult type (FastAPI response)

tests/                        API tests (Vitest + Supertest)

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
- Video files only (checked by declared MIME type, then by the file's actual content)

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
| 400 | No file uploaded, or file sent under a field other than `video` |
| 404 | Unknown API route |
| 413 | File exceeds 20MB |
| 415 | File is not declared as a video (`Only video files are allowed`) |
| 415 | File content is not a real video (`File content is not a valid video`) |
| 500 | Unexpected server error (details are logged, not returned) |
| 502 | Model service responded with an error |
| 503 | Model service is unreachable |

All errors are returned as JSON: `{ "error": "<message>" }`.

## Tech Stack

**Client**
- React 19 + TypeScript
- Vite
- Vitest + React Testing Library (tests)

**Node.js API**
- TypeScript
- Express 5
- Multer (file uploads)
- dotenv
- morgan (request logging)
- file-type (video content detection)
- Vitest + Supertest (tests)

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
npm install --prefix client
```

Create a `.env` file in the project root:

```env
PORT=3000
MODEL_SERVICE_URL=http://localhost:8000/predict
```

Run in development (two terminals):

```bash
npm run devStart      # Express API on http://localhost:3000
npm run dev:client    # Vite dev server on http://localhost:5173, proxies /api to Express
```

Run in production (`build` compiles the API to `dist/` and the client to `client/dist/`, which Express serves at `/`):

```bash
npm run build
npm start
```

Binds to `process.env.PORT` (falls back to `3000` if unset).

Other scripts:

```bash
npm test            # run API and client tests
npm run typecheck   # TypeScript type checking (API + client)
npm run lint        # ESLint (API + client)
```

In production the app and API are both available at `http://localhost:3000`.

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
- Automated tests for the API layer
- TypeScript migration of the Node.js API
- File content validation (detects the real video type from the file's bytes)
- Temporary file cleanup on the FastAPI side
- Request logging and consistent JSON error responses
- React client (Vite + TypeScript) with client tests

Planned:

- Deployment configuration
