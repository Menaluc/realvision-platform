# RealVision API

Backend API for deepfake video detection.

Users upload a video, the backend validates it, sends it to an ML inference service, and returns a prediction.

## Tech Stack

- Node.js
- Express
- Multer
- FastAPI
- PyTorch

## Architecture

```text
Client → Node.js / Express → FastAPI → PyTorch → Prediction
```

## API

### `POST /api/predict`

- One video per request
- Field name: `video`
- Maximum size: 20MB
- Video files only

## Run Locally

```bash
npm install
node src/server.js
```

Server:

```text
http://localhost:3000
```

## Status

Currently under development.

Next:

- Controller layer
- Service layer
- Node.js → FastAPI integration
- Tests
