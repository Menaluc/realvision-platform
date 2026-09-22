import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException

from app.inference import predict_video


app = FastAPI()


@app.post("/predict")
async def predict(video: UploadFile = File(...)):
    temp_path = None

    try:
        suffix = os.path.splitext(video.filename)[1] or ".mp4"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            content = await video.read()
            temp_file.write(content)
            temp_path = temp_file.name

        result = predict_video(temp_path)

        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
